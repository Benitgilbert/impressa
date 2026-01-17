import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const checkProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const ids = [
            "696b42d71cadec12bbce4f15", // From logs (PUT)
            "696b324bf4666852c093d083",  // From user URL
            "696b3e263e2a3820992384eb"   // From logs (DELETE)
        ];

        for (const id of ids) {
            if (!mongoose.Types.ObjectId.isValid(id)) continue;

            const p = await Product.findById(id);
            if (p) {
                console.log(`\n--- Product: ${p.name} (${p._id}) ---`);
                console.log(`Attributes:`, JSON.stringify(p.attributes, null, 2));
                console.log(`Variations Count: ${p.variations.length}`);
                if (p.variations.length > 0) {
                    console.log(`Sample Variation (0):`, JSON.stringify(p.variations[0], null, 2));
                    // Check if attributes are present in variation
                    const missingAttrs = p.variations.some(v => !v.attributes || Object.keys(v.attributes).length === 0);
                    console.log(`Any variations missing attributes? ${missingAttrs ? "YES (BAD)" : "NO (GOOD)"}`);
                }
            } else {
                console.log(`\nProduct ${id} not found.`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkProduct();
