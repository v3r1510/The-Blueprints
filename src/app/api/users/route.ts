import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User, { UserRole } from "@/models/User";

const VALID_ROLES: UserRole[] = ["rider", "operator", "admin"];

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin access only" }, { status: 403 });
  }

  try {
    await connectDB();

    const role = req.nextUrl.searchParams.get("role") as UserRole | null;

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role filter" }, { status: 400 });
    }

    const filter = role ? { role } : {};
    const users = await User.find(filter, { password: 0 }).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (err) {
    console.error("[USERS FETCH ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
