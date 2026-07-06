// 查询当前 IP 的剩余信用点
import { NextResponse } from "next/server";
import { getCreditsLeft, CREDIT_INFO } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const credits = getCreditsLeft(request.headers);
  return NextResponse.json({ ...credits, costs: CREDIT_INFO.costs, hardCaps: CREDIT_INFO.hardCaps });
}
