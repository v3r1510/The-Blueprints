import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ResourceState } from "@/models/Vehicle";
import {
    getMobilityProviderService,
    serializeVehicle,
} from "@/lib/mobility-provider/service";

const VALID_STATES: ResourceState[] = [
    "Available",
    "Reserved",
    "InUse",
    "Maintenance",
];

function hasOperatorAccess(role?: string) {
    return role === "operator" || role === "admin";
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session || !hasOperatorAccess(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectDB();
        const body = await req.json();
        const { id } = await context.params;

        const batteryLevel =
            body?.batteryLevel === undefined ? undefined : Number(body.batteryLevel);
        const lat = body?.lat === undefined ? undefined : Number(body.lat);
        const lng = body?.lng === undefined ? undefined : Number(body.lng);
        const state = body?.state as ResourceState | undefined;

        if (
            batteryLevel !== undefined &&
            (Number.isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100)
        ) {
            return NextResponse.json(
                { error: "Battery level must be between 0 and 100" },
                { status: 400 },
            );
        }

        if (
            (lat !== undefined && Number.isNaN(lat)) ||
            (lng !== undefined && Number.isNaN(lng))
        ) {
            return NextResponse.json(
                { error: "Latitude and longitude must be valid numbers" },
                { status: 400 },
            );
        }

        if (state && !VALID_STATES.includes(state)) {
            return NextResponse.json({ error: "Invalid state" }, { status: 400 });
        }

        const service = getMobilityProviderService();
        const vehicle = await service.updateVehicle(id, {
            zone: body?.zone,
            batteryLevel,
            lat,
            lng,
            state,
        });

        return NextResponse.json({ vehicle: serializeVehicle(vehicle) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const status = message.includes("not found")
            ? 404
            : message.includes("Invalid state transition")
                ? 400
                : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session || !hasOperatorAccess(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectDB();
        const { id } = await context.params;
        const service = getMobilityProviderService();
        await service.removeVehicle(id);

        return NextResponse.json({ message: "Vehicle removed" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const status =
            message.includes("not found") ? 404 : message.includes("Cannot remove") ? 400 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
