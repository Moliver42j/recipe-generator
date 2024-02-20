const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});

exports.handler = async function (event) {
  console.log("event", event);

  const ingredients = event.ingredients || ["chicken", "potatoes", "onions"];
  const spices = event.spices || [];
  const dietaryRestrictions = event.dietaryRestrictions || [];

  const allIngredients = new Set([...ingredients, ...spices, ...dietaryRestrictions]);

  try {
    const messages = [
      {
        role: "assistant",
        content:
          "You are a recipe helper. When given a list of ingredients that I have in my fridge, I want you to give me the name of a recipe that I can make with them (you do not have to use them all). Assume I have oil, salt and black pepper. You can use any recipe from the internet. If Spices are provided, incorporate where appropriate, if not, assume I have a fully stocked spice rack and stock cubes. If there are dietary restrictions provided, take them into account. You return information about the recipe, including the name, ingredients, and instructions. You can also include a link to the recipe (only if the link is legitimate). If you can't find a recipe with the given ingredients, you can say so. Format the response as a JSON object with the following keys: 'recipe', 'ingredients', 'instructions', and 'link'. If you can't find a recipe, return a JSON object with the key 'error' and a message explaining that you couldn't find a recipe.",
      },
      { role: "user", content: Array.from(allIngredients).join(", ") },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
