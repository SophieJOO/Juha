import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildCodexReport } from "../src/lib/codex-report";

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

  try {
    const report = await buildCodexReport(prisma, {
      days: options.days,
      limit: options.limit,
    });
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
