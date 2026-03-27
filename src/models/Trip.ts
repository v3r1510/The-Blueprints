import mongoose, { Schema, Document, Model } from "mongoose";

export type TripResourceType = "vehicle" | "parking";

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  resourceType: TripResourceType;
  vehicleId?: mongoose.Types.ObjectId;
  parkingSpotId?: mongoose.Types.ObjectId;
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
    resourceType: {
      type: String,
      enum: ["vehicle", "parking"],
      default: "vehicle",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: false,
    },
    parkingSpotId: {
      type: Schema.Types.ObjectId,
      ref: "ParkingSpot",
      required: false,
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

TripSchema.pre("validate", function () {
  const hasV = !!this.vehicleId;
  const hasP = !!this.parkingSpotId;
  if (hasV && hasP) {
    throw new Error("Trip cannot reference both vehicle and parking spot");
  }
  if (!hasV && !hasP) {
    throw new Error("Trip must set vehicleId or parkingSpotId");
  }
  this.set("resourceType", hasV ? "vehicle" : "parking");
});

if (mongoose.models.Trip) {
  mongoose.deleteModel("Trip");
}

const Trip: Model<ITrip> = mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;
