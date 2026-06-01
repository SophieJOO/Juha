import {
  CheckCircle2,
  ClipboardList,
  FileDown,
  Home,
  ListChecks,
  Mail,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { DetailForm, QuickNoteForm } from "@/app/home-forms";
import { CodexReportButton } from "@/app/report-button";
import { isExplicitlyAllowedEmail } from "@/lib/allowed-emails";
import { DEFAULT_SITUATION_KINDS } from "@/lib/default-situation-kinds";
import { createFamilyWithDefaults } from "@/lib/family-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "오늘", mobileLabel: "오늘", href: "#today", icon: Home },
  { label: "30초 메모", mobileLabel: "메모", href: "#quick", icon: Plus },
  { label: "기록 리스트", mobileLabel: "기록", href: "#records", icon: ClipboardList },
  { label: "자세히 정리", mobileLabel: "정리", href: "#detail", icon: CheckCircle2 },
  { label: "반복해서 나온 것", mobileLabel: "반복", href: "#repeated", icon: Sparkles },
  { label: "전문가 판단 목록", mobileLabel: "판단", href: "#review", icon: ListChecks },
  { label: "전문가에게 보여주기", mobileLabel: "공유", href: "#export", icon: FileDown },
  { label: "설정", mobileLabel: "설정", href: "#settings", icon: Settings },
];

const bottomNavItems = navItems.slice(0, 5);

type HomeData = {
  familyId: string;
  childId: string;
  familyName: string;
  childName: string;
  situationKinds: { id: string; label: string }[];
  pendingNotes: { id: string; label: string; quickText: string }[];
  recordRows: {
    id: string;
    quickText: string;
    label: string;
    observedAt: string;
    locationLabel: string | null;
    status: string;
    detailText: string | null;
    askExpert: boolean;
  }[];
  repeatedPatterns: {
    id: string;
    title: string;
    where: string;
    count: number;
    level: string;
    ask: string;
    state: string;
  }[];
  stats: {
    pendingCount: number;
    newPatternCount: number;
    askExpertCount: number;
  };
};

const KOREA_TIME_ZONE = "Asia/Seoul";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getKoreaDateParts(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});
}

function formatInputDate(date: Date) {
  const parts = getKoreaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatInputTime(date: Date) {
  const parts = getKoreaDateParts(date);
  return `${parts.hour}:${parts.minute}`;
}

function formatRecordDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function reviewLabel(decision: string) {
  if (decision === "APPROVED") {
    return "연습에 써도 됨";
  }

  if (decision === "DO_NOT_TRAIN") {
    return "연습시키지 않기";
  }

  if (decision === "NEEDS_MORE_OBSERVATION") {
    return "더 관찰";
  }

  return "아직 안 봄";
}

function helpLevelSummary(levels: Array<string | null>) {
  const counts = levels.reduce(
    (acc, level) => {
      if (level === "RED") acc.red += 1;
      if (level === "YELLOW") acc.yellow += 1;
      if (level === "GREEN") acc.green += 1;
      return acc;
    },
    { red: 0, yellow: 0, green: 0 },
  );

  const parts = [
    counts.red ? `빨강 ${counts.red}` : "",
    counts.yellow ? `노랑 ${counts.yellow}` : "",
    counts.green ? `초록 ${counts.green}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "아직 없음";
}

async function ensureHomeData(userId: string, email?: string | null) {
  let member = await prisma.familyMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { familyId: true },
  });

  if (!member) {
    const existingFamily = isExplicitlyAllowedEmail(email)
      ? await prisma.family.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
      : null;

    if (existingFamily) {
      await prisma.familyMember.upsert({
        where: {
          familyId_userId: {
            familyId: existingFamily.id,
            userId,
          },
        },
        create: {
          familyId: existingFamily.id,
          userId,
          name: email ?? "부모",
          role: "PARENT",
        },
        update: {
          name: email ?? "부모",
        },
      });
      member = { familyId: existingFamily.id };
    } else {
      const family = await createFamilyWithDefaults({
        ownerUserId: userId,
        ownerName: email ?? "부모",
        familyName: "주하 가족",
        childName: "주하",
      });
      member = { familyId: family.id };
    }
  }

  const familyId = member.familyId;

  const [family, initialChildren, initialSituationKinds] = await Promise.all([
    prisma.family.findUniqueOrThrow({
      where: { id: familyId },
      select: { name: true },
    }),
    prisma.child.findMany({
      where: { familyId },
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.situationKind.findMany({
      where: { familyId, archivedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, userFacingLabel: true },
    }),
  ]);

  let children = initialChildren;
  let situationKinds = initialSituationKinds;

  if (children.length === 0) {
    const child = await prisma.child.create({
      data: { familyId, displayName: "주하" },
      select: { id: true, displayName: true },
    });
    children = [child];
  }

  if (situationKinds.length === 0) {
    await prisma.situationKind.createMany({
      data: DEFAULT_SITUATION_KINDS.map((kind, index) => ({
        familyId,
        code: kind.code,
        label: kind.label,
        userFacingLabel: kind.userFacingLabel,
        expertCheckDefault: kind.expertCheckDefault,
        sortOrder: index,
      })),
      skipDuplicates: true,
    });
    situationKinds = await prisma.situationKind.findMany({
      where: { familyId, archivedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, userFacingLabel: true },
    });
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [notes, cueKeys] = await Promise.all([
    prisma.observationNote.findMany({
      where: { familyId },
      orderBy: { observedAt: "desc" },
      take: 50,
      select: {
        id: true,
        quickText: true,
        observedAt: true,
        locationLabel: true,
        situationKind: { select: { userFacingLabel: true } },
        detail: { select: { id: true, cueRawText: true, askExpert: true } },
      },
    }),
    prisma.cueKey.findMany({
      where: { familyId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        displayText: true,
        firstSeenAt: true,
        situationKind: { select: { userFacingLabel: true } },
        review: { select: { decision: true } },
        observations: {
          select: {
            helpLevel: true,
            askExpert: true,
          },
        },
      },
    }),
  ]);

  const pendingNotes = notes
    .filter((note) => !note.detail)
    .slice(0, 8)
    .map((note) => ({
      id: note.id,
      quickText: note.quickText,
      label: `${note.situationKind?.userFacingLabel ?? "기타"} · ${note.quickText.slice(0, 34)}`,
    }));

  const repeatedPatterns = cueKeys
    .filter((cueKey) => cueKey.observations.length > 0)
    .map((cueKey) => ({
      id: cueKey.id,
      title: cueKey.displayText,
      where: cueKey.situationKind.userFacingLabel,
      count: cueKey.observations.length,
      level: helpLevelSummary(cueKey.observations.map((item) => item.helpLevel)),
      ask: `전문가에게 물어보기 ${
        cueKey.observations.filter((item) => item.askExpert).length
      }번`,
      state: reviewLabel(cueKey.review?.decision ?? "UNREVIEWED"),
    }));

  return {
    familyId,
    childId: children[0].id,
    familyName: family.name,
    childName: children[0].displayName,
    situationKinds: situationKinds.map((kind) => ({
      id: kind.id,
      label: kind.userFacingLabel,
    })),
    pendingNotes,
    recordRows: notes.map((note) => ({
      id: note.id,
      quickText: note.quickText,
      label: note.situationKind?.userFacingLabel ?? "기타",
      observedAt: formatRecordDate(note.observedAt),
      locationLabel: note.locationLabel,
      status: note.detail ? "자세히 정리됨" : "정리 전",
      detailText: note.detail?.cueRawText ?? null,
      askExpert: note.detail?.askExpert ?? false,
    })),
    repeatedPatterns,
    stats: {
      pendingCount: pendingNotes.length,
      newPatternCount: cueKeys.filter((cueKey) => cueKey.firstSeenAt >= twoWeeksAgo)
        .length,
      askExpertCount: cueKeys.reduce(
        (sum, cueKey) =>
          sum + cueKey.observations.filter((item) => item.askExpert).length,
        0,
      ),
    },
  } satisfies HomeData;
}

function LoginRequired() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-stone-50 px-5">
      <section className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-teal-700">주하 관찰 OS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          가족 기록 공간에 들어가세요
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          부모가 함께 학교생활 장면을 기록하고, 반복해서 나온 것을 상담 때
          바로 보여줄 수 있게 모읍니다.
        </p>
        <Link
          className="mt-6 inline-flex w-full min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-3 text-sm font-medium text-white hover:bg-teal-800"
          href="/login"
        >
          Google로 들어가기
        </Link>
      </section>
    </main>
  );
}

function SectionShell({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="scroll-mt-20 border-y border-stone-200 bg-white p-4 shadow-none sm:scroll-mt-24 sm:rounded-lg sm:border sm:p-5 sm:shadow-sm"
      id={id}
    >
      <div>
        <h3 className="text-[1.05rem] font-semibold sm:text-lg">{title}</h3>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-neutral-500 sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MobileHeader({ date, familyName }: { date: string; familyName: string }) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden"
    >
      <p className="text-xs font-semibold text-teal-700">주하 관찰 OS</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {familyName}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500">{date}</p>
        </div>
        <a
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-teal-700 px-3 text-sm font-medium text-white shadow-sm"
          href="#quick"
        >
          <Plus className="size-4" />
          메모
        </a>
      </div>
    </header>
  );
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <LoginRequired />;
  }

  const data = await ensureHomeData(userId, session.user?.email);

  const now = new Date();
  const todayLabel = formatDate(now);
  const defaultObservedDate = formatInputDate(now);
  const defaultObservedTime = formatInputTime(now);

  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-stone-50 pb-24 lg:pb-0">
      <div className="flex min-h-[100svh]">
        <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-white px-4 py-5 lg:block">
          <div className="px-2">
            <p className="text-sm font-semibold text-teal-700">
              주하 관찰 OS
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {data.familyName}
            </h1>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-600 transition hover:bg-stone-100"
                  href={item.href}
                >
                  <Icon className="size-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1" id="today">
          <MobileHeader date={todayLabel} familyName={data.familyName} />

          <header
            className="sticky top-0 z-10 hidden border-b border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur md:px-8 lg:block"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  {todayLabel}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  오늘 있었던 일을 30초만 잡아두세요
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-stone-100" href="#records">
                  <Search className="size-4" />
                  찾아보기
                </a>
                <a className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800" href="#quick">
                  <Plus className="size-4" />
                  지금 메모하기
                </a>
              </div>
            </div>
          </header>

          <div className="grid gap-4 py-3 sm:px-4 sm:py-6 md:px-8 lg:gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="space-y-4 lg:space-y-6">
              <SectionShell
                description="기억이 사라지기 전에 한 줄만 남깁니다."
                id="quick"
                title="30초 메모"
              >
                <QuickNoteForm
                  childId={data.childId}
                  defaultObservedDate={defaultObservedDate}
                  defaultObservedTime={defaultObservedTime}
                  familyId={data.familyId}
                  situationKinds={data.situationKinds}
                />
              </SectionShell>

              <div className="hidden gap-3 sm:grid sm:grid-cols-3">
                {[
                  ["정리할 메모", data.stats.pendingCount, "아직 자세히 정리 전"],
                  ["새로 보인 반복", data.stats.newPatternCount, "최근 14일 기준"],
                  ["전문가에게 물어볼 것", data.stats.askExpertCount, "상담 때 확인"],
                ].map(([label, value, hint]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-medium text-neutral-500">
                      {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold">{value}</p>
                    <p className="mt-1 text-sm text-neutral-500">{hint}</p>
                  </div>
                ))}
              </div>

              <SectionShell
                description="보인 것과 부모 생각을 나눠 적습니다."
                id="detail"
                title="자세히 정리"
              >
                <div className="mt-4 flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <p>
                    혼자 노는 장면은 실패로 보지 않습니다. 반복해서 나온
                    장면을 먼저 모으고, 연습 여부는 전문가 확인 뒤에 정합니다.
                  </p>
                </div>
                <DetailForm
                  familyId={data.familyId}
                  pendingNotes={data.pendingNotes}
                />
              </SectionShell>
            </section>

            <section className="space-y-4 lg:space-y-6">
              <SectionShell
                description="최근 기록을 시간순으로 볼 수 있습니다."
                id="records"
                title="기록 리스트"
              >
                <div className="mt-4 divide-y divide-stone-200">
                  {data.recordRows.length === 0 ? (
                    <p className="py-4 text-sm text-neutral-500">
                      아직 저장된 메모가 없습니다.
                    </p>
                  ) : (
                    data.recordRows.map((note) => (
                      <div key={note.id} className="py-4 first:pt-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-keep text-[15px] font-medium leading-6 sm:text-base">
                              {note.quickText}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-500">
                              <span>{note.label}</span>
                              <span>{note.observedAt}</span>
                              {note.locationLabel ? (
                                <span>{note.locationLabel}</span>
                              ) : null}
                            </div>
                            {note.detailText ? (
                              <p className="mt-2 text-sm leading-5 text-neutral-600">
                                그때 보인 것: {note.detailText}
                              </p>
                            ) : null}
                            {note.askExpert ? (
                              <span className="mt-2 inline-flex rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                                전문가에게 물어볼 것
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-neutral-700">
                            {note.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionShell>

              <SectionShell id="repeated" title="반복해서 나온 것">
                <div className="mt-4 divide-y divide-stone-200">
                  {data.repeatedPatterns.length === 0 ? (
                    <p className="py-4 text-sm text-neutral-500">
                      자세히 정리한 뒤 반복이 여기에 모입니다.
                    </p>
                  ) : (
                    data.repeatedPatterns.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-keep text-[15px] font-medium leading-6 sm:text-base">
                              {item.title}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                              {item.where} · {item.count}번
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-neutral-700">
                            {item.state}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                            {item.level}
                          </span>
                          <span className="rounded-md bg-sky-50 px-2 py-1 text-sky-800">
                            {item.ask}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionShell>

              <SectionShell id="review" title="전문가 판단 목록">
                <div className="mt-4 grid gap-2">
                  {[
                    ["더 관찰", "아직 연습에 쓰지 않습니다."],
                    ["연습에 써도 됨", "나중에 이야기 연습 재료가 될 수 있습니다."],
                    ["연습시키지 않기", "아이용 연습으로 넘기지 않습니다."],
                  ].map(([label, description]) => (
                    <div
                      key={label}
                      className="grid gap-1 rounded-md border border-stone-200 px-3 py-2.5 text-left sm:flex sm:items-center sm:justify-between"
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-sm text-neutral-500">
                        {description}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionShell>

              <SectionShell id="export" title="전문가에게 보여주기">
                <div className="mt-4 grid gap-3 sm:flex sm:items-start sm:justify-between">
                  <p className="text-sm leading-6 text-neutral-500">
                    최근 14일 기록을 Markdown으로 만들어 내려받습니다.
                  </p>
                  <CodexReportButton />
                </div>

                <div className="mt-4 overflow-x-auto rounded-md border border-stone-200">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead className="bg-stone-100 text-left text-neutral-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">무슨 일</th>
                        <th className="px-3 py-2 font-medium">보인 것</th>
                        <th className="px-3 py-2 font-medium">횟수</th>
                        <th className="px-3 py-2 font-medium">현재 판단</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {data.repeatedPatterns.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                            전문가에게 보여줄 반복 기록이 아직 없습니다.
                          </td>
                        </tr>
                      ) : (
                        data.repeatedPatterns.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.where}</td>
                            <td className="px-3 py-2">{item.title}</td>
                            <td className="px-3 py-2">{item.count}</td>
                            <td className="px-3 py-2">{item.state}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionShell>

              <SectionShell id="settings" title="설정">
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2.5 text-sm font-medium hover:bg-stone-50">
                    <Users className="size-4" />
                    함께 기록할 사람
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2.5 text-sm font-medium hover:bg-stone-50">
                    <Mail className="size-4" />
                    초대 링크 보내기
                  </button>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <p>
                    아이 연습 화면은 아직 없습니다. 전문가가 괜찮다고 한
                    것만 나중에 재료로 씁니다.
                  </p>
                </div>
              </SectionShell>
            </section>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium text-neutral-600 hover:bg-stone-100 hover:text-teal-800"
                href={item.href}
              >
                <Icon className="size-5" />
                <span>{item.mobileLabel}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
