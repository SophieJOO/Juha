import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { buildCodexReport } from "@/lib/codex-report";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("로그인이 필요합니다.", { status: 401 });
  }

  const member = await prisma.familyMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { familyId: true },
  });

  if (!member) {
    return new Response("가족 기록을 찾지 못했습니다.", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = toPositiveInt(searchParams.get("days"), 14, 90);
  const limit = toPositiveInt(searchParams.get("limit"), 80, 300);
  const report = await buildCodexReport(prisma, {
    days,
    familyId: member.familyId,
    limit,
  });
  const filename = `juha-codex-report-${new Date().toISOString().slice(0, 10)}.md`;

  return new Response(report, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
