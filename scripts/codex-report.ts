import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type CliOptions = {
  days: number;
  limit: number;
  out?: string;
};

function parseArgs(): CliOptions {
  const options: CliOptions = { days: 14, limit: 80 };

  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.split("=");
    if (key === "--days" && value) options.days = Number(value);
    if (key === "--limit" && value) options.limit = Number(value);
    if (key === "--out" && value) options.out = value;
  }

  return options;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^"|"$/g, "");
  }
}

function loadEnv() {
  for (const file of [".env.production.local", ".env.local", ".env"]) {
    loadEnvFile(path.join(process.cwd(), file));
  }
}

function findOutputsDir() {
  let current = process.cwd();

  for (let i = 0; i < 5; i += 1) {
    const candidate = path.join(current, "outputs");
    if (fs.existsSync(candidate)) return candidate;
    current = path.dirname(current);
  }

  return path.join(process.cwd(), "codex-reports");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function clean(value?: string | null) {
  return value?.trim() ? value.trim() : "없음";
}

function bullet(label: string, value?: string | null) {
  return `- ${label}: ${clean(value)}`;
}

function reviewLabel(decision?: string | null) {
  if (decision === "APPROVED") return "연습에 써도 됨";
  if (decision === "DO_NOT_TRAIN") return "연습시키지 않기";
  if (decision === "NEEDS_MORE_OBSERVATION") return "더 관찰";
  return "아직 안 봄";
}

function helpLevelLabel(level?: string | null) {
  if (level === "RED") return "빨강";
  if (level === "YELLOW") return "노랑";
  if (level === "GREEN") return "초록";
  return "미분류";
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function hasMindGuess(text: string) {
  const patterns = [
    "기분 나빠",
    "기분나빠",
    "싫어",
    "화난",
    "짜증",
    "무시",
    "피했",
    "얄밉",
    "일부러",
    "삐졌",
    "서운",
    "분위기가 이상",
  ];

  return patterns.some((pattern) => text.includes(pattern));
}

function defaultOutPath() {
  const outputsDir = findOutputsDir();
  fs.mkdirSync(outputsDir, { recursive: true });
  return path.join(outputsDir, "juha_observation_codex_report.md");
}

async function main() {
  const options = parseArgs();
  loadEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL이 없습니다. 먼저 `vercel env pull .env.production.local --environment=production --yes`를 실행해주세요.",
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const since = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000);

  try {
    const families = await prisma.family.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        children: {
          orderBy: { createdAt: "asc" },
          select: { displayName: true },
        },
      },
    });

    const notes = await prisma.observationNote.findMany({
      where: { observedAt: { gte: since } },
      orderBy: { observedAt: "desc" },
      take: options.limit,
      include: {
        family: { select: { name: true } },
        child: { select: { displayName: true } },
        situationKind: { select: { userFacingLabel: true } },
        detail: {
          include: {
            cueKey: {
              include: {
                review: { select: { decision: true, expertNote: true } },
              },
            },
          },
        },
      },
    });

    const cueKeys = await prisma.cueKey.findMany({
      where: {
        observations: {
          some: {
            note: { observedAt: { gte: since } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        situationKind: { select: { userFacingLabel: true } },
        review: { select: { decision: true, expertNote: true } },
        observations: {
          where: { note: { observedAt: { gte: since } } },
          orderBy: { note: { observedAt: "desc" } },
          include: {
            note: {
              select: {
                observedAt: true,
                quickText: true,
                locationLabel: true,
              },
            },
          },
        },
      },
    });

    const detailedNotes = notes.filter((note) => note.detail);
    const askExpertDetails = detailedNotes.filter(
      (note) => note.detail?.askExpert,
    );
    const situationCounts = countBy(
      notes,
      (note) => note.situationKind?.userFacingLabel ?? "기타",
    );
    const mindGuessNotes = detailedNotes.filter((note) =>
      hasMindGuess(
        [
          note.detail?.cueRawText,
          note.detail?.cueObservedText,
          note.detail?.childActionText,
          note.detail?.peerSpeechText,
          note.detail?.peerBodyText,
          note.detail?.endingText,
          note.detail?.parentThoughts,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );

    const lines: string[] = [];
    lines.push("# 주하 관찰 기록 Codex 리포트");
    lines.push("");
    lines.push(`- 생성 시각: ${formatDate(new Date())}`);
    lines.push(`- 조회 범위: 최근 ${options.days}일`);
    lines.push(`- 조회 최대 기록 수: ${options.limit}`);
    lines.push(
      `- 가족: ${families.map((family) => family.name).join(", ") || "없음"}`,
    );
    lines.push(
      `- 아이: ${
        families
          .flatMap((family) => family.children.map((child) => child.displayName))
          .join(", ") || "없음"
      }`,
    );
    lines.push("");

    lines.push("## 한눈에 보기");
    lines.push("");
    lines.push(`- 30초 메모: ${notes.length}건`);
    lines.push(`- 자세히 정리된 기록: ${detailedNotes.length}건`);
    lines.push(`- 반복해서 나온 것: ${cueKeys.length}개`);
    lines.push(`- 전문가에게 물어볼 표시: ${askExpertDetails.length}건`);
    lines.push(`- 속마음 추측 표현 재확인 후보: ${mindGuessNotes.length}건`);
    lines.push("");

    lines.push("## 무슨 일이 많았나");
    lines.push("");
    if (situationCounts.length === 0) {
      lines.push("- 아직 기록이 없습니다.");
    } else {
      for (const [label, count] of situationCounts) {
        lines.push(`- ${label}: ${count}건`);
      }
    }
    lines.push("");

    lines.push("## 반복해서 나온 것");
    lines.push("");
    if (cueKeys.length === 0) {
      lines.push("- 아직 자세히 정리된 반복 기록이 없습니다.");
    } else {
      for (const cueKey of cueKeys) {
        const helpCounts = countBy(cueKey.observations, (item) =>
          helpLevelLabel(item.helpLevel),
        );
        lines.push(
          `### ${cueKey.displayText} (${cueKey.observations.length}건)`,
        );
        lines.push("");
        lines.push(`- 무슨 일: ${cueKey.situationKind.userFacingLabel}`);
        lines.push(`- 현재 판단: ${reviewLabel(cueKey.review?.decision)}`);
        lines.push(
          `- 도움 필요 정도: ${
            helpCounts.map(([label, count]) => `${label} ${count}`).join(" / ") ||
            "없음"
          }`,
        );
        lines.push(
          `- 전문가에게 물어볼 표시: ${
            cueKey.observations.filter((item) => item.askExpert).length
          }건`,
        );
        if (cueKey.review?.expertNote) {
          lines.push(`- 전문가 메모: ${cueKey.review.expertNote}`);
        }
        lines.push("- 최근 예시:");
        for (const observation of cueKey.observations.slice(0, 3)) {
          lines.push(
            `  - ${formatDate(observation.note.observedAt)} · ${clean(
              observation.note.locationLabel,
            )} · ${observation.note.quickText}`,
          );
        }
        lines.push("");
      }
    }
    lines.push("");

    lines.push("## 최근 30초 메모");
    lines.push("");
    if (notes.length === 0) {
      lines.push("- 아직 기록이 없습니다.");
    } else {
      for (const note of notes) {
        lines.push(`### ${formatDate(note.observedAt)}`);
        lines.push("");
        lines.push(
          `- 무슨 일: ${note.situationKind?.userFacingLabel ?? "기타"}`,
        );
        lines.push(`- 장소: ${clean(note.locationLabel)}`);
        lines.push(`- 상태: ${note.detail ? "자세히 정리됨" : "정리 전"}`);
        lines.push(`- 30초 메모: ${note.quickText}`);
        lines.push("");
      }
    }
    lines.push("");

    lines.push("## 자세히 정리된 기록");
    lines.push("");
    if (detailedNotes.length === 0) {
      lines.push("- 아직 자세히 정리된 기록이 없습니다.");
    } else {
      for (const note of detailedNotes) {
        const detail = note.detail;
        if (!detail) continue;

        lines.push(`### ${formatDate(note.observedAt)} · ${detail.cueRawText}`);
        lines.push("");
        lines.push(
          `- 무슨 일: ${note.situationKind?.userFacingLabel ?? "기타"}`,
        );
        lines.push(`- 장소: ${clean(note.locationLabel)}`);
        lines.push(`- 30초 메모: ${note.quickText}`);
        lines.push(bullet("그때 보인 것", detail.cueRawText));
        lines.push(bullet("보인 것 추가", detail.cueObservedText));
        lines.push(bullet("주하 행동", detail.childActionText));
        lines.push(bullet("친구 말", detail.peerSpeechText));
        lines.push(bullet("친구 표정/몸/자리", detail.peerBodyText));
        lines.push(bullet("어떻게 끝났나", detail.endingText));
        lines.push(bullet("부모 생각 메모", detail.parentThoughts));
        lines.push(`- 도움 필요 정도: ${helpLevelLabel(detail.helpLevel)}`);
        lines.push(
          `- 전문가에게 물어볼 것: ${detail.askExpert ? "예" : "아니오"}`,
        );
        lines.push(
          `- 현재 판단: ${reviewLabel(detail.cueKey.review?.decision)}`,
        );
        if (detail.cueKey.review?.expertNote) {
          lines.push(`- 전문가 메모: ${detail.cueKey.review.expertNote}`);
        }
        lines.push("");
      }
    }
    lines.push("");

    lines.push("## Codex에게 바로 요청하기");
    lines.push("");
    lines.push(
      "이 리포트를 기준으로 `반복 패턴을 요약하고, 훈련으로 넘기면 안 되는 항목과 전문가에게 물어볼 항목을 나눠줘`라고 요청하면 됩니다.",
    );
    lines.push("");

    const report = `${lines.join("\n").trim()}\n`;
    const outPath = path.resolve(options.out ?? defaultOutPath());
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, report, "utf8");

    console.log(report);
    console.error(`\nSaved report: ${outPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
