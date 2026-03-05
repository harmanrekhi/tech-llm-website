import axios from "axios";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function fetchLLMResponse(prompt: string) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/completions",
      {
        model: "gpt-4o-mini",
        prompt: prompt,
        max_tokens: 200,
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].text;
  } catch (error) {
    console.error(error);
    return "Error: Unable to get response from AI.";
  }
}