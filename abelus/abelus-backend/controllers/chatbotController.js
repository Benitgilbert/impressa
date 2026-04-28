import prisma from "../prisma.js";
import Fuse from "fuse.js";

/**
 * 🤖 Handle Public Customer Questions
 */
export const handlePublicChatbot = async (req, res) => {
    try {
        const { question, messages = [] } = req.body;
        const userId = req.user?.id || null;

        // 1. Context Retrieval
        // A. Products
        const products = await prisma.product.findMany({
            where: { visibility: "public", approvalStatus: "approved" },
            select: { name: true, price: true, description: true, tags: true },
            orderBy: { salesCount: 'desc' },
            take: 50
        });

        // B. Active Deals
        const now = new Date();
        const activeSales = await prisma.flashSale.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            select: { name: true }
        });

        const salesContext = activeSales.length > 0
            ? activeSales.map(s => `- ${s.name}: ACTIVE DEALS`).join("\n")
            : "No active flash sales at the moment.";

        const fuse = new Fuse(products, {
            keys: ["name", "tags", "description"],
            threshold: 0.4
        });

        const results = fuse.search(question);
        const topMatches = results.slice(0, 5).map(r => r.item);
        const finalContextProducts = topMatches.length > 0 ? topMatches : products.slice(0, 3);

        const productContext = finalContextProducts.map(p =>
            `- ${p.name}: ${p.price} RWF (${(p.description || '').substring(0, 50)}...)`
        ).join("\n");

        // 2. Build Prompt
        const history = messages
            .slice(-6)
            .map(m => `${m.role === 'user' ? 'Customer' : 'AI'}: ${m.text}`)
            .join("\n");

        const prompt = `
You are the Sales & Support AI Assistant for Abelus Marketplace.
Use the PRODUCT DATA, ACTIVE DEALS, and CHAT HISTORY to answer the Customer.

PRODUCT DATA:
${productContext}

ACTIVE DEALS:
${salesContext}

CHAT HISTORY:
${history}

RULES:
1. Goal: Help the customer find products or answer basic questions.
2. Conciseness: Keep answers short (2-3 sentences max).
3. No greetings if conversation is already in progress.

Customer Question: ${question}
Response:
`;

        let answer = "";

        // 3. Try Calling LLM
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
                console.warn("Cohere API failed:", apiErr.message);
            }
        }

        // 4. Fallback Logic
        if (!answer) {
            const lowerQ = question.toLowerCase();
            if (topMatches.length > 0) {
                answer = `I found these likely matches: ${topMatches.map(p => p.name).slice(0, 3).join(", ")}. Prices start around ${topMatches[0].price} RWF.`;
            } else if (lowerQ.includes("delivery") || lowerQ.includes("shipping")) {
                answer = "We offer fast shipping across Rwanda! Free delivery for orders over 50,000 RWF.";
            } else {
                answer = "I'm here to help! I'd recommend browsing our 'Trending' section or searching for specific items.";
            }
        }

        // 5. Log the Interaction
        try {
            await prisma.chatLog.create({
                data: {
                    userId,
                    question,
                    answer,
                    topics: topMatches.map(p => p.name)
                }
            });
        } catch (logErr) {
            console.error("Failed to log chat:", logErr);
        }

        res.json({ answer });

    } catch (err) {
        console.error("Public chatbot error:", err);
        res.json({ answer: "I'm having a brief connection issue, but please browse our collection!" });
    }
};

/**
 * 🤖 Get Chat Logs for Admin
 */
export const getChatLogs = async (req, res) => {
    try {
        const logs = await prisma.chatLog.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch logs" });
    }
};

/**
 * 🤖 Bulk Delete Chat Logs
 */
export const deleteChatLogs = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No IDs provided" });
        }

        await prisma.chatLog.deleteMany({
            where: { id: { in: ids } }
        });
        res.json({ message: "Chat logs deleted successfully" });
    } catch (err) {
        console.error("Failed to delete chat logs:", err);
        res.status(500).json({ message: "Failed to delete chat logs" });
    }
};
