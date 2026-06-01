"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/lib/access-control";
import { looksLikeMindReading } from "@/lib/cue-normalize";
import { prisma } from "@/lib/prisma";
import { saveObservationDetail } from "@/lib/observation-service";

type ActionState = {
  ok: boolean;
  message: string;
};

const quickNoteSchema = z.object({
  familyId: z.string().min(1),
  childId: z.string().min(1),
  situationKindId: z.string().min(1),
  quickText: z.string().trim().min(1, "한 줄 메모를 적어주세요."),
  observedAt: z.coerce.date().optional(),
  locationLabel: z.string().optional(),
});

function toActionError(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      message: error.issues[0]?.message ?? "입력 내용을 다시 확인해주세요.",
    };
  }

  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: "저장하지 못했습니다. 다시 시도해주세요." };
}

export async function createQuickNote(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = quickNoteSchema.parse(Object.fromEntries(formData));
    const member = await requireFamilyMember(input.familyId);

    const [child, situationKind] = await Promise.all([
      prisma.child.findFirst({
        where: { id: input.childId, familyId: input.familyId },
        select: { id: true },
      }),
      prisma.situationKind.findFirst({
        where: {
          id: input.situationKindId,
          familyId: input.familyId,
          archivedAt: null,
        },
        select: { id: true },
      }),
    ]);

    if (!child || !situationKind) {
      return {
        ok: false,
        message: "이 가족 기록에 속한 항목만 저장할 수 있습니다.",
      };
    }

    await prisma.observationNote.create({
      data: {
        familyId: input.familyId,
        childId: input.childId,
        createdByMemberId: member.id,
        situationKindId: input.situationKindId,
        observedAt: input.observedAt ?? new Date(),
        locationLabel: input.locationLabel,
        quickText: input.quickText,
        status: "QUICK_ONLY",
      },
    });

    revalidatePath("/");

    return {
      ok: true,
      message: "저장했어요. 나중에 자세히 정리할 수 있습니다.",
    };
  } catch (error) {
    return toActionError(error);
  }
}

const detailSchema = z.object({
  familyId: z.string().min(1),
  noteId: z.string().min(1),
  situationKindId: z.string().min(1),
  cueRawText: z.string().trim().min(1, "그때 보인 것을 한 줄 적어주세요."),
  cueObservedText: z.string().optional(),
  childActionText: z.string().optional(),
  peerSpeechText: z.string().optional(),
  peerBodyText: z.string().optional(),
  endingText: z.string().optional(),
  parentThoughts: z.string().optional(),
  askExpert: z.coerce.boolean().optional(),
});

export async function saveDetailedObservation(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = detailSchema.parse(Object.fromEntries(formData));
    await requireFamilyMember(input.familyId);

    const note = await prisma.observationNote.findFirst({
      where: {
        id: input.noteId,
        familyId: input.familyId,
        situationKindId: { not: null },
      },
      select: { situationKindId: true },
    });

    if (!note?.situationKindId) {
      return {
        ok: false,
        message: "먼저 이 가족 기록에 있는 30초 메모를 선택해주세요.",
      };
    }

    const observationText = [
      input.cueRawText,
      input.cueObservedText,
      input.childActionText,
      input.peerSpeechText,
      input.peerBodyText,
      input.endingText,
      input.parentThoughts,
    ]
      .filter(Boolean)
      .join(" ");

    if (looksLikeMindReading(observationText)) {
      return {
        ok: false,
        message:
          "마음을 추측한 말일 수 있어요. 친구가 실제로 한 말, 표정, 몸 움직임, 자리를 떠났는지로 바꿔 적어주세요.",
      };
    }

    await saveObservationDetail({
      familyId: input.familyId,
      noteId: input.noteId,
      situationKindId: note.situationKindId,
      cueRawText: input.cueRawText,
      cueObservedText: input.cueObservedText,
      childActionText: input.childActionText,
      peerSpeechText: input.peerSpeechText,
      peerBodyText: input.peerBodyText,
      endingText: input.endingText,
      parentThoughts: input.parentThoughts,
      askExpert: input.askExpert,
    });

    revalidatePath("/");

    return { ok: true, message: "자세히 정리했어요." };
  } catch (error) {
    return toActionError(error);
  }
}
