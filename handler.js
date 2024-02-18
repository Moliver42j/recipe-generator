const OpenAI = require("openai");

// Replace "your_api_key_here" with your actual OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "key",
});

const handler = async (event) => {
// const run = async () => {
  // const ingredients = ["chicken", "potatoes", "onions"];

  const ingredients = event.ingredients || ["chicken", "potatoes", "onions"];

  console.log("LeT'S COok BItcHES!");
  console.log("Ingredients: ", ingredients);

  try {
    const messages = [
      {
        role: "assistant",
        content:
          "You are a recipe helper. When given a list of ingredients that I have in my fridge, I want you to give me the name of a recipe that I can make with them. Assume I have oil, salt and black pepper.",
      },
      { role: "user", content: Array.from(ingredients).join(", ") },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.5,
      max_tokens: 60,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    //console.log(messages.content);
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
};
// run();
