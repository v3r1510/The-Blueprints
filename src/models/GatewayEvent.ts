import mongoose, { Schema } from "mongoose";

const GatewayEventSchema = new Schema({
  service: { type: String, required: true }, // "STM_VEHICLES" | "STM_TRIPS" | "STM_DISPLAY"
  status: { type: String, enum: ["success", "failure"], required: true },
  latencyMs: { type: Number, required: true },
  httpStatus: { type: Number },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.GatewayEvent ||
  mongoose.model("GatewayEvent", GatewayEventSchema);
