import { GET } from "@/app/api/vehicles/route";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/mongodb", () => ({
  connectDB: jest.fn(),
}));

jest.mock("@/models/Vehicle", () => ({
  find: jest.fn(),
}));

jest.mock("next/server", () => {
  return {
    NextRequest: class {
      nextUrl: URL;
      constructor(url: string) {
        this.nextUrl = new URL(url);
      }
    },
    NextResponse: {
      json: jest.fn((data, options) => ({
        status: options?.status || 200,
        body: data,
      })),
    },
  };
});

describe("GET /api/vehicles Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 Unauthorized if the rider is not logged in", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/vehicles");

    const response = await GET(req);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("should return 200 and a list of available vehicles for authorized users", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { email: "student@concordia.ca" },
    });
    (connectDB as jest.Mock).mockResolvedValue(true);

    const mockVehicles = [
      { id: "1", type: "Scooter", state: "Available" },
      { id: "2", type: "Car", state: "Available" },
    ];

    (Vehicle.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockVehicles),
    });

    const req = new NextRequest("http://localhost:3000/api/vehicles");

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockVehicles);
    expect(Vehicle.find).toHaveBeenCalledWith({ state: "Available" });
  });

  it("should return 400 if an invalid vehicle type is requested", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { email: "user@test.com" } });

    const req = new NextRequest(
      "http://localhost:3000/api/vehicles?type=Helicopter",
    );

    const response = await GET(req);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid vehicle type filter" });
  });
});
