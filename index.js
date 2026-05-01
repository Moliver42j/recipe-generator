const { OpenAI } = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});
const assistantDefinition = fs.readFileSync("assistant-definition.txt", "utf8");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
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

exports.handler = async function (event) {
// run = async (event) => {
  console.log("event:", event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  const payload = parseEventPayload(event);

  const ingredients = normalizeStringArray(payload.ingredients);
  const pantryItems = normalizeStringArray(payload.pantryItems);
  const dietaryRestrictions = normalizeStringArray(payload.dietaryRestrictions);
  const spices = Array.isArray(payload.spices)
    ? normalizeStringArray(payload.spices)
    : [];
  const difficulty =
    typeof payload.difficulty === "string" ? payload.difficulty.trim() : "";
  const calories =
    typeof payload.calories === "string" ? payload.calories.trim() : "";
  const recipeToSkip =
    typeof payload.recipeToSkip === "string" ? payload.recipeToSkip.trim() : "";

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
    ...(difficulty ? [difficulty] : []),
    ...(calories ? [calories] : []),
    ...(recipeToSkip ? [recipeToSkip] : []),
  ]);

  try {
    const messages = [
      {
        role: "assistant",
        content: assistantDefinition,
      },
      { role: "user", content: Array.from(allIngredients).join(", ") },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.5,
      max_tokens: 1000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    console.log(response.choices[0].message.content);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: response.choices[0].message.content,
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Failed to generate recipe" }),
    };
  }
};
// run();
