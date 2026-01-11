import express from "express";
import {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    deleteSubscriber,
    exportSubscribers,
    sendNewsletter
} from "../controllers/newsletterController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/subscribe", subscribe);
router.get("/unsubscribe/:email", unsubscribe);

// Admin protected routes
router.get("/subscribers", verifyAdmin, getAllSubscribers);
router.delete("/subscribers/:id", verifyAdmin, deleteSubscriber);
router.get("/export", verifyAdmin, exportSubscribers);
router.post("/send", verifyAdmin, sendNewsletter);

export default router;
