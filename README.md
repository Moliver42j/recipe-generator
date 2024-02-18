# Recipe Suggestion App

This Node.js application leverages the OpenAI API to suggest recipes based on the ingredients you have. By providing a list of ingredients, the app queries the OpenAI's GPT model to generate a recipe idea that incorporates these ingredients. It's designed to help you discover new recipe ideas based on what you already have in your fridge or pantry.

## Requirements

- Node.js (version 12.x or higher recommended)
- An OpenAI API key

## Setup Instructions

1. **Clone the repository**  
   Clone this repository to your local machine using `git clone` or download the source code.

2. **Install dependencies**  
   Navigate to the project directory and run `npm install` to install the required dependencies.

3. **Set up your OpenAI API key**  
   - Sign up for an API key at [OpenAI](https://openai.com/api/).
   - Create a `.env` file in the root of your project directory.
   - Add your OpenAI API key to the `.env` file as follows:
     ```
     export OPENAI_API_KEY=your_api_key_here
     ```
   - The application is configured to use this environment variable for authentication with the OpenAI API.

4. **Configuration**  
   The application is ready to run out of the box with default ingredients. You can modify the default ingredients directly in the code if desired.

## How to Run the Application

- **Running the app**  
  Run the application with the command:
  ```bash
  node handler.js

Example usage:
```
const event = {
  ingredients: ["chicken", "rice", "broccoli"]
};
handler(event);
```

When executed, the application will output a recipe suggestion based on the ingredients provided.

Troubleshooting
If you encounter any issues related to the OpenAI API, ensure that:

- Your API key is correctly entered and valid.
- You are connected to the internet.
- The OpenAI API service is operational.
- For further assistance, consult the OpenAI documentation or reach out to OpenAI support.