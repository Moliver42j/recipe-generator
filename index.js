const { OpenAI } = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const assistantDefinitionFileByType = {
  single: "assistant-definition-single.txt",
  planner: "assistant-definition-planner.txt",
};

function parseEventPayload(event) {
  if (!event || typeof event !== "object") {
    return {};
  }

  if (event.body && typeof event.body === "string") {
    try {
      return JSON.parse(event.body);
    } catch {
      return {};
    }
  }

  return event;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function normalizeOptionalString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalNumber(value) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : null;
}

exports.handler = async function (event) {
  console.log("event:", event);

  if (event?.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  const payload = parseEventPayload(event);
  const requestType = payload.type === "planner" ? "planner" : "single";

  const ingredients = normalizeStringArray(payload.ingredients);
  const pantryItems = normalizeStringArray(payload.pantryItems);
  const dietaryRestrictions = normalizeStringArray(payload.dietaryRestrictions);
  const spices = Array.isArray(payload.spices)
    ? normalizeStringArray(payload.spices)
    : [];
  const difficulty = normalizeOptionalString(payload.difficulty);
  const calories = normalizeOptionalString(payload.calories);
  const recipeToSkip = normalizeOptionalString(payload.recipeToSkip);

  const mealsToPlan =
    normalizeOptionalNumber(payload.mealsToPlan) ??
    normalizeOptionalNumber(payload.mealCount) ??
    normalizeOptionalNumber(payload.numberOfMeals);
  const maxItemsToBuy =
    normalizeOptionalNumber(payload.maxItemsToBuy) ??
    normalizeOptionalNumber(payload.shoppingItemsLimit) ??
    normalizeOptionalNumber(payload.itemsToBuy);

  if (ingredients.length === 0) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Please provide at least one ingredient.",
      }),
    };
  }

  const allIngredients = new Set([
    ...ingredients,
    ...pantryItems,
    ...spices,
    ...dietaryRestrictions,
    ...(difficulty ? [`difficulty:${difficulty}`] : []),
    ...(calories ? [`calories:${calories}`] : []),
    ...(recipeToSkip ? [`recipeToSkip:${recipeToSkip}`] : []),
    ...(requestType === "planner" && mealsToPlan
      ? [`mealsToPlan:${mealsToPlan}`]
      : []),
    ...(requestType === "planner" && maxItemsToBuy
      ? [`maxItemsToBuy:${maxItemsToBuy}`]
      : []),
  ]);

  const assistantDefinitionFileName =
    assistantDefinitionFileByType[requestType] ??
    assistantDefinitionFileByType.single;

  const singleRecipeSchema = {
    name: "single_recipe",
    strict: true,
    schema: {
      type: "object",
      properties: {
        recipe: { type: "string" },
        ingredients: { type: "array", items: { type: "string" } },
        instructions: { type: "array", items: { type: "string" } },
        caloriesPerServing: {
          type: "object",
          properties: {
            calories: { type: "string" },
            protein: { type: "string" },
            carbs: { type: "string" },
          },
          required: ["calories", "protein", "carbs"],
          additionalProperties: false,
        },
        link: { type: "string" },
        descriptionStart: { type: "string" },
        descriptionEnd: { type: "string" },
        error: { type: "string" },
      },
      required: [
        "recipe",
        "ingredients",
        "instructions",
        "caloriesPerServing",
        "link",
        "descriptionStart",
        "descriptionEnd",
        "error",
      ],
      additionalProperties: false,
    },
  };

  const plannerRecipeSchema = {
    name: "planner_recipes",
    strict: true,
    schema: {
      type: "object",
      properties: {
        recipes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              recipe: { type: "string" },
              ingredients: { type: "array", items: { type: "string" } },
              instructions: { type: "array", items: { type: "string" } },
              caloriesPerServing: {
                type: "object",
                properties: {
                  calories: { type: "string" },
                  protein: { type: "string" },
                  carbs: { type: "string" },
                },
                required: ["calories", "protein", "carbs"],
                additionalProperties: false,
              },
              link: { type: "string" },
              descriptionStart: { type: "string" },
              descriptionEnd: { type: "string" },
              error: { type: "string" },
            },
            required: [
              "recipe",
              "ingredients",
              "instructions",
              "caloriesPerServing",
              "link",
              "descriptionStart",
              "descriptionEnd",
              "error",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["recipes"],
      additionalProperties: false,
    },
  };

  const modelByType = {
    single: "gpt-4o-mini",
    planner: "gpt-4o",
  };

  const maxTokensByType = {
    single: 1200,
    planner: 4096,
  };

  try {
    const assistantDefinition = fs.readFileSync(
      assistantDefinitionFileName,
      "utf8"
    );
    const messages = [
      {
        role: "system",
        content: assistantDefinition,
      },
      { role: "user", content: Array.from(allIngredients).join(", ") },
    ];

    const responseFormat = {
      type: "json_schema",
      json_schema:
        requestType === "planner" ? plannerRecipeSchema : singleRecipeSchema,
    };

    const response = await openai.chat.completions.create({
      model: modelByType[requestType],
      messages,
      temperature: 0.5,
      max_tokens: maxTokensByType[requestType],
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      response_format: responseFormat,
    });

    const rawContent = response.choices[0].message.content;
    console.log(rawContent);

    let body = rawContent;
    if (requestType === "planner") {
      try {
        const parsed = JSON.parse(rawContent);
        body = JSON.stringify(parsed.recipes);
      } catch {
        // Fall back to raw content if parsing fails
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body,
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to generate recipe" }),
    };
  }
};
