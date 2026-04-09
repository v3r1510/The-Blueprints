import { GET } from "@/app/api/vehicles/route";
import { jsonRequest, readJson } from "../helpers/next-request";
import { auth } from "@/lib/auth";

jest.mock("@/lib/mongodb", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const mockSort = jest.fn();
const mockFind = jest.fn(() => ({ sort: mockSort }));

jest.mock("@/models/Vehicle", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

describe("GET /api/vehicles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSort.mockResolvedValue([{ _id: "v1", type: "Car" }]);
  });

  it("returns 401 when there is no session", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const req = jsonRequest("/api/vehicles");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid type filter", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/vehicles", {
      searchParams: { type: "Plane" },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Invalid vehicle type filter");
  });

  it("returns vehicles when authenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/vehicles", {
      searchParams: { type: "Bike" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = (await readJson(res)) as Array<{ type: string }>;
    expect(data[0].type).toBe("Car");
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ state: "Available", type: "Bike" }),
    );
  });
});
