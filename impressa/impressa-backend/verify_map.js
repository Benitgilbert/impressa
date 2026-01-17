import mongoose from "mongoose";

const variationSchema = new mongoose.Schema({
    attributes: { type: Map, of: String }
});
const productSchema = new mongoose.Schema({
    variations: [variationSchema]
});
const Product = mongoose.model("TestProduct", productSchema);

const run = async () => {
    const p = new Product({
        variations: [{
            attributes: { "Size": "Small" }
        }]
    });

    console.log("Original Attributes (Map):", p.variations[0].attributes);

    const defaultObj = p.toObject();
    console.log("Default toObject JSON:", JSON.stringify(defaultObj));

    const flattenedObj = p.toObject({ flattenMaps: true });
    console.log("FlattenMaps toObject JSON:", JSON.stringify(flattenedObj));
};

run();
