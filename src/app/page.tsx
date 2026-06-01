import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
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
import { DEFAULT_SITUATION_KINDS } from "@/lib/default-situation-kinds";

const navItems = [
  { label: "오늘", icon: Home },
  { label: "30초 메모", icon: Plus },
  { label: "자세히 정리", icon: ClipboardList },
  { label: "반복해서 나온 것", icon: Sparkles },
  { label: "전문가 판단 목록", icon: ListChecks },
  { label: "전문가에게 보여주기", icon: FileDown },
  { label: "설정", icon: Settings },
];

const repeatedPatterns = [
  {
    title: "친구가 한 번 더 하자고 함",
    where: "가위바위보/순서",
    count: 2,
    level: "초록 2번",
    ask: "전문가에게 물어보기 1번",
    state: "아직 안 봄",
  },
  {
    title: "주하만 다시 하자고 함",
    where: "가위바위보/순서",
    count: 4,
    level: "노랑 3번 · 초록 1번",
    ask: "전문가에게 물어보기 3번",
    state: "더 관찰",
  },
  {
    title: "친구가 자리를 떠남",
    where: "내 놀이에 친구가 왔어요",
    count: 2,
    level: "노랑 2번",
    ask: "전문가에게 물어보기 1번",
    state: "아직 안 봄",
  },
];

const reviewRows = [
  ["가위바위보/순서", "친구가 한 번 더 하자고 함", "2", "초록 2", "아직 안 봄"],
  ["가위바위보/순서", "주하만 다시 하자고 함", "4", "노랑 3 / 초록 1", "더 관찰"],
  ["내 놀이에 친구가 왔어요", "친구가 자리를 떠남", "2", "노랑 2", "아직 안 봄"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-white px-4 py-5 lg:block">
          <div className="px-2">
            <p className="text-sm font-semibold text-teal-700">
              주하 관찰 OS
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              가족 기록 공간
            </h1>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
                    index === 0
                      ? "bg-teal-50 text-teal-900"
                      : "text-neutral-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  2026년 6월 1일
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  오늘 있었던 일을 30초만 잡아두세요
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-stone-100">
                  <Search className="size-4" />
                  찾기
                </button>
                <button className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-800">
                  <Plus className="size-4" />
                  지금 메모하기
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-6 px-4 py-6 md:px-8 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["정리할 메모", "3", "아직 자세히 정리 전"],
                  ["새로 보인 반복", "2", "최근 14일 기준"],
                  ["전문가에게 물어볼 것", "4", "상담 때 확인"],
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

              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">30초 메모</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      기억이 사라지기 전에 한 줄만 남깁니다.
                    </p>
                  </div>
                  <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                    필수 2개
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    무슨 일이었나요?
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {DEFAULT_SITUATION_KINDS.slice(0, 9).map((kind) => (
                        <button
                          key={kind.code}
                          className="min-h-11 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:border-teal-600 hover:bg-teal-50"
                        >
                          {kind.userFacingLabel}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    한 줄 메모
                    <textarea
                      className="min-h-24 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition placeholder:text-neutral-400 focus:ring-2"
                      placeholder="예: 친구가 먼저 한 번 더 하자고 했고, 주하는 바로 다시 했다."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">자세히 정리</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      보인 것과 부모 생각을 나눠 적습니다.
                    </p>
                  </div>
                  <Eye className="mt-1 size-5 text-teal-700" />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    ["그때 보인 것", "친구가 한 번 더 하자고 함"],
                    ["주하는 무엇을 했나요?", "다시 하자고 말하고 바로 손을 냄"],
                    ["친구는 무엇을 했나요?", "'그래'라고 말하고 다시 손을 냄"],
                    ["어떻게 끝났나요?", "놀이가 계속됨"],
                  ].map(([label, value]) => (
                    <label
                      key={label}
                      className="grid gap-2 text-sm font-medium text-neutral-700"
                    >
                      {label}
                      <input
                        className="rounded-md border border-stone-300 px-3 py-2.5 text-sm outline-none ring-teal-600 transition focus:ring-2"
                        defaultValue={value}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
                    <p className="text-sm leading-6 text-amber-950">
                      마음을 추측한 말일 수 있으면, 실제로 한 말이나 몸의
                      움직임으로 바꿔 적습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">반복해서 나온 것</h3>
                  <button className="text-sm font-medium text-teal-700 hover:text-teal-900">
                    모두 보기
                  </button>
                </div>

                <div className="mt-4 divide-y divide-stone-200">
                  {repeatedPatterns.map((item) => (
                    <div key={item.title} className="py-4 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.where} · {item.count}번
                          </p>
                        </div>
                        <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-neutral-700">
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
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-rose-700" />
                  <h3 className="text-lg font-semibold">전문가 판단 목록</h3>
                </div>
                <div className="mt-4 grid gap-2">
                  {[
                    ["더 관찰", "아직 연습에 쓰지 않습니다."],
                    ["연습에 써도 됨", "나중에 이야기 연습 재료가 될 수 있습니다."],
                    ["연습시키지 않기", "아이용 연습으로 넘기지 않습니다."],
                  ].map(([label, description]) => (
                    <button
                      key={label}
                      className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2.5 text-left hover:bg-stone-50"
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-sm text-neutral-500">
                        {description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    전문가에게 보여주기
                  </h3>
                  <button className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50">
                    <FileDown className="size-4" />
                    익명으로 저장
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-md border border-stone-200">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-stone-100 text-left text-neutral-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">무슨 일</th>
                        <th className="px-3 py-2 font-medium">보인 것</th>
                        <th className="px-3 py-2 font-medium">횟수</th>
                        <th className="px-3 py-2 font-medium">현재 판단</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {reviewRows.map(([where, seen, count, , state]) => (
                        <tr key={`${where}-${seen}`}>
                          <td className="px-3 py-2">{where}</td>
                          <td className="px-3 py-2">{seen}</td>
                          <td className="px-3 py-2">{count}</td>
                          <td className="px-3 py-2">{state}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">설정</h3>
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
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <p>
                    아이 연습 화면은 아직 없습니다. 전문가가 괜찮다고 한
                    것만 나중에 재료로 씁니다.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
