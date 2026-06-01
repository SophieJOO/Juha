import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium text-teal-700">주하 관찰 OS</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Google 계정으로 들어가기
        </h1>
        <p className="text-sm leading-6 text-neutral-600">
          엄마와 아빠가 각자 Google 계정으로 로그인하고 같은 가족 기록을 함께
          볼 수 있습니다.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
        className="mt-8"
      >
        <button className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-3 font-medium text-neutral-900 shadow-sm transition hover:bg-stone-50">
          <span className="flex size-5 items-center justify-center rounded-full border border-neutral-300 text-sm font-semibold">
            G
          </span>
          Google로 계속하기
        </button>
      </form>
    </main>
  );
}
