import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai"; // FIXED IMPORT

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Check if API key exists
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR: Missing OpenAI API Key in environment variables.");
    process.exit(1);
}

// Initialize OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat Route
app.post("/chat", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Missing prompt" });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error("🔥 OpenAI Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});

