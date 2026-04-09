import { GET } from "@/app/api/parking-spots/route";
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

jest.mock("@/models/ParkingSpot", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

describe("GET /api/parking-spots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSort.mockResolvedValue([{ _id: "p1", zone: "A" }]);
  });

  it("returns 401 when there is no session", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const req = jsonRequest("/api/parking-spots");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when location params are invalid", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/parking-spots", {
      searchParams: { lat: "x", lng: "y" },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toBe("Invalid location parameters");
  });

  it("returns spots when authenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/parking-spots");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = (await readJson(res)) as Array<{ zone: string }>;
    expect(data[0].zone).toBe("A");
    expect(mockFind).toHaveBeenCalled();
  });
});
