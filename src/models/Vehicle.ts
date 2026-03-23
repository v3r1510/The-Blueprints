import mongoose, { Schema, Document, Model } from "mongoose";

export type VehicleType = "Car" | "Bike" | "Scooter";
export type ResourceState = "Available" | "Reserved" | "InUse" | "Maintenance";

export interface IVehicle extends Document {
  type: VehicleType;
  location: {
    type: string; // 'Point'
    coordinates: number[]; //[longitude, latitude]
  };
  state: ResourceState; 
  batteryLevel?: number; //just for display purposes, we can keep or remove 
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Schema
const VehicleSchema: Schema<IVehicle> = new Schema(
  {
    type: {
      type: String,
      enum: ["Car", "Bike", "Scooter"],
      required: true,
    },
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
      }, //order: longitude, latitude
    },
    state: {
      type: String,
      enum: ["Available", "Reserved", "InUse", "Maintenance"],
      default: "Available",
      required: true,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

if (mongoose.models.Vehicle) {
  mongoose.deleteModel("Vehicle");
}

//2d sphere index for map searches
VehicleSchema.index({ location: "2dsphere" });

const Vehicle: Model<IVehicle> = mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;
