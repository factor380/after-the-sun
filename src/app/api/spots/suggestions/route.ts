import { NextResponse } from "next/server";
import { clientAddress } from "@/lib/client-address";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { isSuggestionHoneypot } from "@/lib/suggestions";
import { suggestSpotSchema } from "@/lib/validations/spot";
import { createSuggestion } from "@/services/spots";

const SUGGEST_RATE_LIMIT = 5;
const SUGGEST_RATE_WINDOW_MS = 60 * 60 * 1000;

function suggestionKey(request: Request): string {
  return `spots:suggest:${clientAddress(request)}`;
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid spot data" }, { status: 400 });
    }

    // Same response as a real accept so a bot cannot tell the field was noticed.
    if (isSuggestionHoneypot(body)) {
      rateLimit(suggestionKey(request), SUGGEST_RATE_LIMIT, SUGGEST_RATE_WINDOW_MS);
      return NextResponse.json({ accepted: true });
    }

    const parsed = suggestSpotSchema.safeParse(body);
    if (!parsed.success) {
      if (
        !rateLimit(suggestionKey(request), SUGGEST_RATE_LIMIT, SUGGEST_RATE_WINDOW_MS)
      ) {
        return NextResponse.json(
          { error: "Too many requests. Try again shortly." },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: "Invalid spot data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await createSuggestion(parsed.data, {
      consumeRateLimit: () =>
        rateLimit(suggestionKey(request), SUGGEST_RATE_LIMIT, SUGGEST_RATE_WINDOW_MS),
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { id: result.spot.id, status: "pending", accepted: true },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("POST /api/spots/suggestions", error);
    const message =
      error instanceof Error && error.message === "Location must be within Israel bounds"
        ? error.message
        : "Failed to create spot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
