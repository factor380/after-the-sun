import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validations/report";
import { createSpotReport } from "@/services/reports";

type RouteContext = { params: Promise<{ id: string }> };

const REPORT_RATE_LIMIT = 5;
const REPORT_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !rateLimit(
        `spots:report:${user.id}`,
        REPORT_RATE_LIMIT,
        REPORT_RATE_WINDOW_MS,
      )
    ) {
      return NextResponse.json(
        { error: "Too many reports. Try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const report = await createSpotReport(id, user.id, parsed.data);
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/spots/[id]/report", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
