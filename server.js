// SecretAi - AI Chat Web App
// Backend: Node.js | Hosting: Vercel

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import OpenAI from "openai";  // ✅ FIXED OpenAI Import
import bodyParser from "body-parser";
import path from "path";
import stripe from "stripe";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

// ✅ FIXED: Correct OpenAI instance creation
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ [Error] Missing OpenAI API Key in Environment Variables!");
    process.exit(1);  // Stop the server if no API key
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Debugging Middleware (Logs every request)
app.use((req, res, next) => {
    console.log(`📌 [Request] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// Route to create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
    try {
        console.log("✅ [Stripe] Creating checkout session...");
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            success_url: "https://aisecret2025.com/success",
            cancel_url: "https://aisecret2025.com/cancel",
            line_items: [
                {
                    price: "your-stripe-price-id-here",
                    quantity: 1
                }
            ]
        });
        console.log("✅ [Stripe] Checkout session created:", session.id);
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("❌ [Stripe] Error:", error);
        res.status(500).send("Error creating Stripe session");
    }
});

// ✅ FIXED OpenAI Chat Route
app.post("/chat", async (req, res) => {
    try {
        console.log("✅ [Chat] Received a request at /chat");
        const { prompt } = req.body;

        if (!prompt) {
            console.error("❌ [Chat] ERROR: No prompt provided");
            return res.status(400).json({ error: "Prompt is required." });
        }

        console.log("✅ [Chat] Sending request to OpenAI API...");
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 200,
        });

        console.log("✅ [Chat] OpenAI API response received:", response);

        if (response.choices && response.choices.length > 0) {
            res.json({ reply: response.choices[0].message.content });
        } else {
            console.error("❌ [Chat] ERROR: OpenAI returned an empty response.");
            res.status(500).json({ error: "OpenAI returned an empty response." });
        }
    } catch (error) {
        console.error("❌ [Chat] OpenAI API ERROR:", error);
        res.status(500).json({ error: error.message || "Failed to process OpenAI request." });
    }
});

// WebSocket Connection
io.on("connection", (socket) => {
    console.log("🔵 [WebSocket] New connection established");
    socket.on("disconnect", () => {
        console.log("🔴 [WebSocket] User disconnected");
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
