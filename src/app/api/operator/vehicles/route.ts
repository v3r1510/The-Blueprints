import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ResourceState, VehicleType } from "@/models/Vehicle";
import {
  getMobilityProviderService,
  serializeVehicle,
} from "@/lib/mobility-provider/mobilityProviderService";

const VALID_TYPES: VehicleType[] = ["Car", "Bike", "Scooter"];
const VALID_STATES: ResourceState[] = [
  "Available",
  "Reserved",
  "InUse",
  "Maintenance",
];

function hasOperatorAccess(role?: string) {
  return role === "operator" || role === "admin";
}

export async function GET() {
  const session = await auth();
  if (!session || !hasOperatorAccess(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const service = getMobilityProviderService();
    const vehicles = await service.listVehicles();
    return NextResponse.json({ vehicles: vehicles.map(serializeVehicle) });
  } catch (error) {
    console.error("[OPERATOR VEHICLES GET ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasOperatorAccess(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();

    const type = body?.type as VehicleType | undefined;
    const zone = body?.zone as string | undefined;
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    const batteryLevel =
      body?.batteryLevel === undefined ? undefined : Number(body?.batteryLevel);
    const state = body?.state as ResourceState | undefined;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid vehicle type" }, { status: 400 });
    }

    if (!zone || !zone.trim()) {
      return NextResponse.json({ error: "Zone is required" }, { status: 400 });
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    if (
      batteryLevel !== undefined &&
      (Number.isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100)
    ) {
      return NextResponse.json(
        { error: "Battery level must be between 0 and 100" },
        { status: 400 },
      );
    }

    if (state && !VALID_STATES.includes(state)) {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const service = getMobilityProviderService();
    const vehicle = await service.addVehicle({
      type,
      zone: zone.trim(),
      lat,
      lng,
      batteryLevel,
      state,
    });

    return NextResponse.json({ vehicle: serializeVehicle(vehicle) }, { status: 201 });
  } catch (error) {
    console.error("[OPERATOR VEHICLE CREATE ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
