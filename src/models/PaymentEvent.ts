import mongoose, { Schema } from "mongoose";

const PaymentEventSchema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ["success", "failure"], required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PaymentEvent ||
  mongoose.model("PaymentEvent", PaymentEventSchema);