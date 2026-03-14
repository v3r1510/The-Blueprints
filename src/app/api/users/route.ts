import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[USERS FETCH ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
