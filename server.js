// SecretAi - AI Chat Web App
// Backend: Node.js | Frontend: React | Hosting: Vercel

// Import required modules
import express from "express";
import cors from "cors";
import stripe from "stripe";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 5000;
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Route to create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
    try {
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "AI Chat Subscription",
                        },
                        unit_amount: 1000, // $10 per month
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: "https://yourwebsite.com/success",
            cancel_url: "https://yourwebsite.com/cancel",
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Real-time AI chat using GPT-3.5 with WebSockets
io.on("connection", (socket) => {
    console.log("User connected");
    
    socket.on("sendMessage", async (message) => {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
                max_tokens: 500,
            });
            
            socket.emit("receiveMessage", response.choices[0].message.content);
        } catch (error) {
            console.error("Error processing AI chat:", error);
            socket.emit("errorMessage", "Failed to generate response");
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Serve Frontend Pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
