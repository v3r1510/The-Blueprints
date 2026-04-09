import { POST } from "@/app/api/ratings/route";
import { jsonRequest, readJson } from "../helpers/next-request";
import { auth } from "@/lib/auth";

jest.mock("@/lib/mongodb", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const mockTripFindById = jest.fn();
const mockRatingFindOne = jest.fn();
const mockRatingCreate = jest.fn();

jest.mock("@/models/Trip", () => ({
  __esModule: true,
  default: {
    findById: (...args: unknown[]) => mockTripFindById(...args),
  },
}));

jest.mock("@/models/Rating", () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockRatingFindOne(...args),
    create: (...args: unknown[]) => mockRatingCreate(...args),
  },
}));

describe("POST /api/ratings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { tripId: "t1", stars: 5 },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when tripId is missing", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { stars: 5 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when stars are invalid", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { tripId: "t1", stars: 6 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await readJson(res)) as { error: string };
    expect(data.error).toContain("Stars");
  });

  it("returns 404 when trip is not found", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    mockTripFindById.mockResolvedValueOnce(null);
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { tripId: "t1", stars: 4 },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 403 when trip belongs to another user", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    mockTripFindById.mockResolvedValueOnce({
      userId: { toString: () => "other" },
      status: "Completed",
      vehicleId: "v1",
    });
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { tripId: "t1", stars: 4 },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 201 when rating is created", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "u1", role: "rider" },
    });
    mockTripFindById.mockResolvedValueOnce({
      userId: { toString: () => "u1" },
      status: "Completed",
      vehicleId: "v1",
    });
    mockRatingFindOne.mockResolvedValueOnce(null);
    mockRatingCreate.mockResolvedValueOnce({
      _id: "r1",
      stars: 5,
      tripId: "t1",
    });
    const req = jsonRequest("/api/ratings", {
      method: "POST",
      body: { tripId: "t1", stars: 5, comment: " Great " },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockRatingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: "t1",
        stars: 5,
        comment: "Great",
      }),
    );
  });
});
