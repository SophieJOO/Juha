export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium text-teal-700">이메일을 확인해주세요</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        로그인 링크를 보냈어요
      </h1>
      <p className="mt-4 text-sm leading-6 text-neutral-600">
        받은 편지함에서 링크를 눌러 앱으로 돌아오면 됩니다. 링크가 보이지
        않으면 스팸함도 확인해주세요.
      </p>
    </main>
  );
}
