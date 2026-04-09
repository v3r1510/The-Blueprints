import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StarRating from "@/app/rider/StarRating";

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("StarRating component", () => {
  const onSubmitted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 5 star buttons", () => {
    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);
    // The first 5 buttons are the star buttons
    const buttons = screen.getAllByRole("button");
    const starButtons = buttons.filter((b) => b.textContent?.includes("★"));
    expect(starButtons).toHaveLength(5);
  });

  it("renders the submit button", () => {
    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);
    expect(
      screen.getByRole("button", { name: /submit rating/i }),
    ).toBeInTheDocument();
  });

  it("disables the submit button when no star is selected", () => {
    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);
    expect(
      screen.getByRole("button", { name: /submit rating/i }),
    ).toBeDisabled();
  });

  it("enables the submit button after clicking a star", () => {
    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);
    const starButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("★"));
    fireEvent.click(starButtons[2]); // click the 3rd star
    expect(
      screen.getByRole("button", { name: /submit rating/i }),
    ).toBeEnabled();
  });

  it("renders the comment textarea", () => {
    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);
    expect(
      screen.getByPlaceholderText(/leave a comment/i),
    ).toBeInTheDocument();
  });

  it("shows success message after a successful submission", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rating: {} }),
    });

    jest.useFakeTimers();

    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);

    // Select 4 stars
    const starButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("★"));
    fireEvent.click(starButtons[3]);

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/thanks for your rating/i),
      ).toBeInTheDocument();
    });

    // Advance past the 1500 ms delay before calling onSubmitted
    jest.advanceTimersByTime(1500);
    expect(onSubmitted).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("shows an error message when the submission fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Can only rate completed trips" }),
    });

    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);

    // Select 2 stars
    const starButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("★"));
    fireEvent.click(starButtons[1]);

    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Can only rate completed trips"),
      ).toBeInTheDocument();
    });

    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it("shows a generic error when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<StarRating tripId="trip123" onSubmitted={onSubmitted} />);

    const starButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("★"));
    fireEvent.click(starButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("sends the correct payload to the ratings API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rating: {} }),
    });

    jest.useFakeTimers();

    render(<StarRating tripId="abc-123" onSubmitted={onSubmitted} />);

    const starButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("★"));
    fireEvent.click(starButtons[4]); // 5 stars

    const textarea = screen.getByPlaceholderText(/leave a comment/i);
    fireEvent.change(textarea, { target: { value: "Excellent!" } });

    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() =>
      expect(screen.getByText(/thanks for your rating/i)).toBeInTheDocument(),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/ratings",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: "abc-123", stars: 5, comment: "Excellent!" }),
      }),
    );

    jest.useRealTimers();
  });
});
