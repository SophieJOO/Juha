"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { createQuickNote, saveDetailedObservation } from "@/app/actions";

type ActionState = {
  ok: boolean;
  message: string;
};

type SituationOption = {
  id: string;
  label: string;
};

type PendingNoteOption = {
  id: string;
  label: string;
  quickText: string;
};

const initialState: ActionState = { ok: false, message: "" };

function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  const Icon = state.ok ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-[13px] leading-5 sm:text-sm ${
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{state.message}</p>
    </div>
  );
}

export function QuickNoteForm({
  familyId,
  childId,
  situationKinds,
}: {
  familyId: string;
  childId: string;
  situationKinds: SituationOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createQuickNote,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const quickTextRef = useRef<HTMLTextAreaElement>(null);
  const storageKey = useMemo(
    () => `juha.quickText.${familyId}.${childId}`,
    [familyId, childId],
  );

  useEffect(() => {
    if (quickTextRef.current) {
      quickTextRef.current.value = window.localStorage.getItem(storageKey) ?? "";
    }
  }, [storageKey]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      window.localStorage.removeItem(storageKey);
    }
  }, [state.ok, storageKey]);

  return (
    <form action={formAction} className="mt-4 grid gap-4 sm:mt-5" ref={formRef}>
      <input name="familyId" type="hidden" value={familyId} />
      <input name="childId" type="hidden" value={childId} />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-neutral-700">
          무슨 일이었나요?
        </legend>
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3">
          {situationKinds.map((kind, index) => (
            <label key={kind.id} className="group">
              <input
                className="peer sr-only"
                defaultChecked={index === 0}
                name="situationKindId"
                type="radio"
                value={kind.id}
              />
              <span className="flex min-h-11 cursor-pointer items-center break-keep rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-left text-[15px] font-medium leading-5 text-neutral-700 group-hover:border-teal-600 group-hover:bg-teal-50 peer-checked:border-teal-700 peer-checked:bg-teal-50 peer-checked:text-teal-950 sm:text-sm">
                {kind.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        한 줄 메모
        <textarea
          className="min-h-32 rounded-md border border-stone-300 px-3 py-3 text-base leading-6 outline-none ring-teal-600 transition placeholder:text-neutral-400 focus:ring-2 sm:min-h-28"
          name="quickText"
          onChange={(event) => {
            if (event.target.value) {
              window.localStorage.setItem(storageKey, event.target.value);
            } else {
              window.localStorage.removeItem(storageKey);
            }
          }}
          placeholder="예: 친구가 먼저 한 번 더 하자고 했고, 주하는 바로 다시 했다."
          ref={quickTextRef}
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        어디였나요?
        <input
          className="rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
          name="locationLabel"
          placeholder="예: 운동장, 교실, 하교길"
        />
      </label>

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:min-h-11 sm:text-sm"
        disabled={isPending || situationKinds.length === 0}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        저장하기
      </button>

      <ActionMessage state={state} />
    </form>
  );
}

export function DetailForm({
  familyId,
  pendingNotes,
}: {
  familyId: string;
  pendingNotes: PendingNoteOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    saveDetailedObservation,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-4 sm:mt-5">
      <input name="familyId" type="hidden" value={familyId} />

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        정리할 메모
        <select
          className="rounded-md border border-stone-300 bg-white px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
          disabled={pendingNotes.length === 0}
          name="noteId"
          required
        >
          {pendingNotes.length === 0 ? (
            <option value="">먼저 30초 메모를 남겨주세요</option>
          ) : (
            pendingNotes.map((note) => (
              <option key={note.id} value={note.id}>
                {note.label}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        그때 보인 것
        <input
          className="rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
          name="cueRawText"
          placeholder="예: 친구가 먼저 한 번 더 하자고 함"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        그때 보인 것을 조금 더 적기
        <textarea
          className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
          name="cueObservedText"
          placeholder="예: 친구가 손을 내밀며 '한 번 더?'라고 말했다."
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          주하는 무엇을 했나요?
          <textarea
            className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
            name="childActionText"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          친구가 한 말
          <textarea
            className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
            name="peerSpeechText"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          친구의 표정/몸/자리
          <textarea
            className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
            name="peerBodyText"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          어떻게 끝났나요?
          <textarea
            className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
            name="endingText"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        부모 생각 메모
        <textarea
          className="min-h-20 rounded-md border border-stone-300 px-3 py-3 text-base outline-none ring-teal-600 transition focus:ring-2"
          name="parentThoughts"
          placeholder="예: 다음 상담 때 물어보고 싶음"
        />
      </label>

      <label className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-neutral-700">
        <input className="size-4 accent-teal-700" name="askExpert" type="checkbox" />
        전문가에게 물어볼 목록에 올리기
      </label>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <p className="text-sm leading-6 text-amber-950">
            마음을 추측한 말일 수 있으면 저장하지 않고 알려줍니다. 실제로
            한 말, 표정, 몸 움직임, 자리를 떠났는지로 바꿔 적어주세요.
          </p>
        </div>
      </div>

      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:min-h-11 sm:text-sm"
        disabled={isPending || pendingNotes.length === 0}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        자세히 정리 저장
      </button>

      <ActionMessage state={state} />
    </form>
  );
}
