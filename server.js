// SecretAi - AI Chat Web App
// Backend: Node.js | Hosting: Vercel

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import OpenAI from "openai";
import bodyParser from "body-parser";
import path from "path";
import stripe from "stripe";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// Route to create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
    try {
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
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).send("Error creating Stripe session");
    }
});

// OpenAI API Route
app.post("/chat", async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await openai.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }]
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).send("Error processing OpenAI request");
    }
});

// WebSocket Connection
io.on("connection", (socket) => {
    console.log("New WebSocket connection");
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
