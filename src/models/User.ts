import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "rider" | "operator" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  preferredMobilityType?: string; // rider-specific
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["rider", "operator", "admin"], required: true, default: "rider" },
    preferredMobilityType: { type: String, trim: true },
  },
  { timestamps: true }
);

// Always delete the cached model so schema changes are picked up on hot reload
if (mongoose.models.User) {
  mongoose.deleteModel("User");
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
