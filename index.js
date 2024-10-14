const { OpenAI } = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});

// exports.handler = async function (event) {
run = async (event) => {
  event = {
    ingredients: ["chicken", "potatoes", "onions"],
    spices: ["salt", "pepper"],
    dietaryRestrictions: [""],
    difficulty: "easy",
    calories: "low",
    recipeToSkip: "Chicken and potato bake",
  };
  console.log("event:", event);

  const ingredients = event.ingredients || ["chicken", "potatoes", "onions"];
  const spices = event.spices || [];
  const dietaryRestrictions = event.dietaryRestrictions || [];
  const difficulty = event.difficulty || "5";
  const calories = event.calories || 650;
  const recipeToSkip = event.recipeToSkip || "";
  const allIngredients = new Set([
    ...ingredients,
    ...spices,
    ...dietaryRestrictions,
    difficulty,
    calories,
    recipeToSkip
  ]);

  try {
    // read assistant definition from the file assistant-definition.txt
    const assistantDefinition = fs.readFileSync(
      "assistant-definition.txt",
      "utf8"
    );
    const messages = [
      {
        role: "assistant",
        content: assistantDefinition,
      },
      { role: "user", content: Array.from(allIngredients).join(", ") },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: 1500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    console.log(response.choices[0].message.content);
    return {
      statusCode: 200,
      body: response.choices[0].message.content,
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
};
run();
