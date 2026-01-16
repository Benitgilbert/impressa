import Product from "../models/Product.js";
import ChatLog from "../models/ChatLog.js";
import Fuse from "fuse.js";

// Handle Public Customer Questions
export const handlePublicChatbot = async (req, res) => {
    try {
        const { question, messages = [] } = req.body;
        const userId = req.user?.id || null; // Optional if we attach auth middleware loosely

        // 1. Search for relevant products (Context Retrieval)
        // We want to give the AI generic store info + specific products if asked
        const products = await Product.find({ visibility: "public", approvalStatus: "approved" })
            .select("name price description tags category")
            .sort({ salesCount: -1 }) // Prioritize popular items
            .limit(50); // Fetch a batch for fuzzy search

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
        const prompt = `
You are the Sales & Support AI Assistant for Impressa (an online marketplace).
A customer is asking a question. Use the PRODUCT DATA below to help them.

PRODUCT DATA:
${productContext}

RULES:
1. **Goal**: Help the customer find products or answer basic questions.
2. **Products**: Only recommend products listed above. If none match, ask clarifying questions.
3. **Tone**: Friendly, helpful, sales-oriented but honest.
4. **Conciseness**: Keep answers short (2-3 sentences max).
5. **No Hallucination**: Do not invent products or prices.

Customer Question: ${question}

Response:
`;

        // 3. Call LLM
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
        if (!response.ok) throw new Error(result.message || "AI Error");

        const answer = result.text || "I'm not sure, please browse our shop!";

        // 4. Log the Interaction
        await ChatLog.create({
            user: userId,
            question,
            answer,
            // Simple keyword extraction for topics (naive approach)
            topics: topMatches.map(p => p.name)
        });

        res.json({ answer });

    } catch (err) {
        console.error("Public chatbot error:", err);
        res.status(500).json({ message: "I'm having trouble connecting right now." });
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
