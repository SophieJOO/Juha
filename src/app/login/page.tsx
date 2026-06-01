import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium text-teal-700">주하 관찰 OS</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          이메일로 들어가기
        </h1>
        <p className="text-sm leading-6 text-neutral-600">
          비밀번호 없이 이메일 링크로 로그인합니다. 엄마와 아빠가 같은 가족
          기록을 함께 볼 수 있습니다.
        </p>
      </div>

      <form
        action={async (formData) => {
          "use server";
          await signIn("nodemailer", {
            email: formData.get("email"),
            redirectTo: "/",
          });
        }}
        className="mt-8 space-y-4"
      >
        <label className="block text-sm font-medium text-neutral-800">
          이메일
          <input
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
            placeholder="parent@example.com"
          />
        </label>
        <button className="w-full rounded-lg bg-teal-700 px-4 py-3 font-medium text-white transition hover:bg-teal-800">
          로그인 링크 받기
        </button>
      </form>
    </main>
  );
}
