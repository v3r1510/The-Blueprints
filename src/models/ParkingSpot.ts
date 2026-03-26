import mongoose, { Schema, Document, Model } from "mongoose";

export type ParkingResourceState = "Available" | "Reserved" | "InUse" | "Maintenance";

export interface IParkingSpot extends Document {
  lotNumber: string;
  zone: string;
  location: {
    type: string;
    coordinates: number[];
  };
  state: ParkingResourceState;
  /** Flat fee charged when the parking session completes (Strategy: FlatRate). */
  flatRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingSpotSchema = new Schema<IParkingSpot>(
  {
    lotNumber: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    state: {
      type: String,
      enum: ["Available", "Reserved", "InUse", "Maintenance"],
      default: "Available",
      required: true,
    },
    flatRate: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
  },
  { timestamps: true },
);

ParkingSpotSchema.index({ location: "2dsphere" });

if (mongoose.models.ParkingSpot) {
  mongoose.deleteModel("ParkingSpot");
}

const ParkingSpot: Model<IParkingSpot> = mongoose.model<IParkingSpot>(
  "ParkingSpot",
  ParkingSpotSchema,
);

export default ParkingSpot;
