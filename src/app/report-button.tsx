"use client";

import { useState } from "react";
import { ClipboardCheck, FileDown, Loader2 } from "lucide-react";

function downloadMarkdown(report: string) {
  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `juha-codex-report-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function CodexReportButton() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/codex-report?days=14&limit=80", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const report = await response.text();
      downloadMarkdown(report);

      try {
        await navigator.clipboard.writeText(report);
        setStatus("파일로 저장하고 클립보드에도 복사했어요.");
      } catch {
        setStatus("파일로 저장했어요.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "리포트를 만들지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        disabled={isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileDown className="size-4" />
        )}
        Codex 리포트 만들기
      </button>
      {status ? (
        <p className="flex items-start gap-1.5 text-xs leading-5 text-neutral-500">
          <ClipboardCheck className="mt-0.5 size-3.5 shrink-0" />
          {status}
        </p>
      ) : null}
    </div>
  );
}
