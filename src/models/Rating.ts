import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRating extends Document {
  tripId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stars: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema<IRating> = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

RatingSchema.index({ vehicleId: 1 });
RatingSchema.index({ userId: 1 });

if (mongoose.models.Rating) {
  mongoose.deleteModel("Rating");
}

const Rating: Model<IRating> = mongoose.model<IRating>("Rating", RatingSchema);

export default Rating;
