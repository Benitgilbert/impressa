import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null // Null for guests
        },
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        sentiment: {
            type: String, // 'positive', 'neutral', 'negative' (can be added later by AI)
            default: 'neutral'
        },
        topics: [String] // Keywords extracted
    },
    { timestamps: true }
);

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;
