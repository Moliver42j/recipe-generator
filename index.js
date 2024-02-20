const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});

exports.handler = async function (event) {
  console.log("event", event);
  // const ingredients = ["chicken", "potatoes", "onions"];

  const ingredients = event.ingredients || ["chicken", "potatoes", "onions"];

  console.log("LeT'S COok BItcHES!");
  console.log("Ingredients: ", ingredients);

  try {
    const messages = [
      {
        role: "assistant",
        content:
          "You are a recipe helper. When given a list of ingredients that I have in my fridge, I want you to give me the name of a recipe that I can make with them. Assume I have oil, salt and black pepper. You can use any recipe from the internet. If Spices are provided, incorporate where appropriate, if not, assume I have a fully stocked spice rack.You return information about the recipe, including the name, ingredients, and instructions. You can also include a link to the recipe. If you can't find a recipe with the given ingredients, you can say so. Format the response as a JSON object with the following keys: 'recipe', 'ingredients', 'instructions', and 'link'. If you can't find a recipe, return a JSON object with the key 'error' and a message explaining that you couldn't find a recipe.",
      },
      { role: "user", content: Array.from(ingredients).join(", ") },
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
