import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { isSameOriginRequest } from "@/lib/request-origin";
import { revalidatePublishedSpots } from "@/lib/revalidate-public";
import { createClient } from "@/lib/supabase/server";
import { moderateSuggestion } from "@/services/spots";

type RouteContext = { params: Promise<{ id: string }> };

async function readAction(request: Request): Promise<"approve" | "reject" | null> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { action?: unknown };
    return body.action === "approve" || body.action === "reject" ? body.action : null;
  }

  const form = await request.formData();
  const action = form.get("action");
  return action === "approve" || action === "reject" ? action : null;
}

export async function POST(request: Request, context: RouteContext) {
  const wantsHtml = !(request.headers.get("content-type") ?? "").includes(
    "application/json",
  );

  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const action = await readAction(request);
    if (!action) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { id } = await context.params;
    const spot = await moderateSuggestion(id, action === "approve" ? "approved" : "rejected");
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (spot.status === "approved") revalidatePublishedSpots(spot.id);

    if (wantsHtml) {
      return NextResponse.redirect(new URL("/admin/suggestions", request.url), 303);
    }
    return NextResponse.json({ id: spot.id, status: spot.status });
  } catch (error) {
    console.error("POST /api/admin/suggestions/[id]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
