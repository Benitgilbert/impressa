import mongoose from "mongoose";

const customizationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  customText: String,
  customFile: String, // image or PDF filename
  cloudLink: String,
  cloudPassword: String,
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Customization = mongoose.model("Customization", customizationSchema);

export default Customization;