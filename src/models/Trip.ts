import mongoose, { Schema, Document, Model } from "mongoose";


export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  pricingStrategy: "PerMinute" | "PerHour" | "FlatRate";
  status: "Reserved" | "Active" | "Completed" | "Cancelled";
  totalFare?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema: Schema<ITrip> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    pricingStrategy: {
      type: String,
      enum: ["PerMinute", "PerHour", "FlatRate"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Reserved", "Active", "Completed", "Cancelled"],
      default: "Reserved",
      required: true,
    },
    totalFare: {
      type: Number,
    },
  },
  { timestamps: true },
);


const Trip: Model<ITrip> = mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;
