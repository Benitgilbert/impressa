import Product from "../models/Product.js";
import ChatLog from "../models/ChatLog.js";
import Fuse from "fuse.js";
import FlashSale from "../models/FlashSale.js"; // Import FlashSale

// Handle Public Customer Questions
export const handlePublicChatbot = async (req, res) => {
    try {
        const { question, messages = [] } = req.body;
        const userId = req.user?.id || null; // Optional if we attach auth middleware loosely

        // 1. Context Retrieval
        // A. Products
        const products = await Product.find({ visibility: "public", approvalStatus: "approved" })
            .select("name price description tags category")
            .sort({ salesCount: -1 })
            .limit(50);

        // B. Active Deals
        const now = new Date();
        const activeSales = await FlashSale.find({
            status: "active",
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).select("name discountPercentage");

        const salesContext = activeSales.length > 0
            ? activeSales.map(s => `- ${s.name}: ${s.discountPercentage}% OFF`).join("\n")
            : "No active flash sales or daily deals at the moment.";

        const fuse = new Fuse(products, {
            keys: ["name", "tags", "category", "description"],
            threshold: 0.4
        });

        const results = fuse.search(question);
        const topMatches = results.slice(0, 5).map(r => r.item);

        // Fallback: If no matches, maybe show top 3 generic popular products
        const finalContextProducts = topMatches.length > 0 ? topMatches : products.slice(0, 3);

        const productContext = finalContextProducts.map(p =>
            `- ${p.name}: ${p.price} RWF (${p.description.substring(0, 50)}...)`
        ).join("\n");

        // 2. Build Prompt
        const history = messages
            .slice(-6) // Keep last 6 messages for context
            .map(m => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.text}`)
            .join("\n");

        const prompt = `
You are the Sales & Support AI Assistant for Impressa (an online marketplace).
Use the PRODUCT DATA, ACTIVE DEALS, and CHAT HISTORY to answer the Customer.

PRODUCT DATA:
${productContext}

ACTIVE DEALS (Flash Sales / Daily Deals):
${salesContext}

CHAT HISTORY:
${history}

RULES:
1. **Goal**: Help the customer find products or answer basic questions.
2. **Context**: Use the CHAT HISTORY to understand the conversation flow.
3. **No Greetings**: Do NOT say "Hello" or "Welcome" if you see it in the history.
4. **Deals**: ONLY mention deals/discounts if they appear in "ACTIVE DEALS". If none are listed, say "We have everyday low prices" instead of promising specific deals.
5. **Conciseness**: Keep answers short (2-3 sentences max).

Customer Question: ${question}

Response:
`;

        let answer = "";

        // 3. Try Calling LLM (if key exists)
        if (process.env.COHERE_API_KEY) {
            try {
                const response = await fetch("https://api.cohere.ai/v1/chat", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "command-r-08-2024",
                        message: prompt,
                        temperature: 0.3
                    })
                });
                const result = await response.json();
                if (response.ok && result.text) {
                    answer = result.text;
                }
            } catch (apiErr) {
                console.warn("Cohere API failed, falling back to local logic:", apiErr.message);
            }
        }

        // 4. Fallback Logic (if no API key or API failed)
        if (!answer) {
            const lowerQ = question.toLowerCase();
            const hasHistory = messages.length > 1;

            if (topMatches.length > 0) {
                const names = topMatches.map(p => p.name).slice(0, 3).join(", ");
                answer = `I found these likely matches: ${names}.`;
                if (lowerQ.includes("price") || lowerQ.includes("cost")) {
                    answer += ` Prices start around ${topMatches[0].price} RWF.`;
                }
            } else if ((lowerQ.includes("hello") || lowerQ.includes("hi")) && !hasHistory) {
                answer = "Hello! Welcome to Impressa Premium Market. How can I help you find the perfect product today?";
            } else if (lowerQ.includes("delivery") || lowerQ.includes("shipping")) {
                answer = "We offer fast shipping across Rwanda! Free delivery for orders over 50,000 RWF.";
            } else if (lowerQ.includes("return") || lowerQ.includes("refund")) {
                answer = "You can return items within 30 days if you're not satisfied. Satisfaction guaranteed!";
            } else if (lowerQ.includes("payment") || lowerQ.includes("pay")) {
                answer = "We accept MTN Mobile Money, Visa, MasterCard, and Cash on Delivery.";
            } else {
                if (hasHistory) {
                    answer = "I'm focusing on products right now. Could you try asking about specific items or categories like 'shoes', 'watches', or 'electronics'?";
                } else {
                    answer = "I'm here to help! I'd recommend browsing our 'Trending' section to see what others are loving right now.";
                }
            }
        }

        // 5. Log the Interaction
        try {
            await ChatLog.create({
                user: userId,
                question,
                answer,
                topics: topMatches.map(p => p.name)
            });
        } catch (logErr) {
            console.error("Failed to log chat:", logErr);
        }

        res.json({ answer });

    } catch (err) {
        console.error("Public chatbot error:", err);
        res.json({ answer: "I'm having a brief connection issue, but please browse our amazing collection!" });
    }
};

// Get Chat Logs for Admin
export const getChatLogs = async (req, res) => {
    try {
        const logs = await ChatLog.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch logs" });
    }
};

// Bulk Delete Chat Logs
export const deleteChatLogs = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No IDs provided" });
        }

        await ChatLog.deleteMany({ _id: { $in: ids } });
        res.json({ message: "Chat logs deleted successfully" });
    } catch (err) {
        console.error("Failed to delete chat logs:", err);
        res.status(500).json({ message: "Failed to delete chat logs" });
    }
};
