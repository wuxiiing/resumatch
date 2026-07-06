// 每日免费领取 10 点
import { NextResponse } from "next/server";
import { claimFreeCredits } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = claimFreeCredits(request.headers);
  if (!result.ok) return NextResponse.json({ error: result.error, daily: result.daily }, { status: 429 });
  return NextResponse.json({ ok: true, daily: result.daily });
}
