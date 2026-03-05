const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

app.post("/chat", upload.none(), async (req, res) => {
  const userMessage = req.body?.message || "";
  console.log("Message:", userMessage);

  if (!userMessage) return res.json({ reply: "No message received." });
  if (!process.env.OPENROUTER_API_KEY) return res.json({ reply: "Error: API key missing." });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("Reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    res.json({ reply: "Error: Cannot load AI assistant right now." });
  }
});

app.listen(3001, () => console.log("Server running at http://localhost:3001"));