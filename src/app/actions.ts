"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireFamilyMember } from "@/lib/access-control";
import { looksLikeMindReading } from "@/lib/cue-normalize";
import { prisma } from "@/lib/prisma";
import { saveObservationDetail } from "@/lib/observation-service";

const quickNoteSchema = z.object({
  familyId: z.string().min(1),
  childId: z.string().min(1),
  situationKindId: z.string().min(1),
  quickText: z.string().trim().min(1, "한 줄 메모를 적어주세요."),
  observedAt: z.coerce.date(),
  locationLabel: z.string().optional(),
});

export async function createQuickNote(formData: FormData) {
  const input = quickNoteSchema.parse(Object.fromEntries(formData));
  const member = await requireFamilyMember(input.familyId);

  await prisma.observationNote.create({
    data: {
      familyId: input.familyId,
      childId: input.childId,
      createdByMemberId: member.id,
      situationKindId: input.situationKindId,
      observedAt: input.observedAt,
      locationLabel: input.locationLabel,
      quickText: input.quickText,
      status: "QUICK_ONLY",
    },
  });

  revalidatePath("/");
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

export async function saveDetailedObservation(formData: FormData) {
  const input = detailSchema.parse(Object.fromEntries(formData));
  await requireFamilyMember(input.familyId);

  const observationText = [
    input.cueObservedText,
    input.childActionText,
    input.peerSpeechText,
    input.peerBodyText,
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
    situationKindId: input.situationKindId,
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

  return { ok: true };
}
