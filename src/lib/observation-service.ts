import type {
  CueKind,
  HelpLevel,
  PriorAgreement,
} from "@/generated/prisma/enums";
import { assertCueText, normalizeCueText } from "@/lib/cue-normalize";
import { prisma } from "@/lib/prisma";

type SaveObservationDetailInput = {
  familyId: string;
  noteId: string;
  situationKindId: string;
  cueRawText: string;
  cueKind?: CueKind;
  cueObservedText?: string;
  childActionText?: string;
  peerSpeechText?: string;
  peerBodyText?: string;
  endingText?: string;
  helpLevel?: HelpLevel;
  askExpert?: boolean;
  parentThoughts?: string;
  priorAgreement?: PriorAgreement;
  priorAgreementQuote?: string;
};

function isUniqueConstraintRace(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function saveObservationDetail(input: SaveObservationDetailInput) {
  const normalizedText = assertCueText(input.cueRawText);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const note = await tx.observationNote.findFirstOrThrow({
          where: {
            id: input.noteId,
            familyId: input.familyId,
            situationKindId: input.situationKindId,
          },
          select: { id: true },
        });

        const alias = await tx.cueAlias.findUnique({
          where: {
            familyId_situationKindId_aliasNormalizedText: {
              familyId: input.familyId,
              situationKindId: input.situationKindId,
              aliasNormalizedText: normalizedText,
            },
          },
        });

        const cueKey = alias
          ? await tx.cueKey.findUniqueOrThrow({
              where: { id: alias.canonicalCueKeyId },
            })
          : await tx.cueKey.upsert({
              where: {
                familyId_situationKindId_normalizedText: {
                  familyId: input.familyId,
                  situationKindId: input.situationKindId,
                  normalizedText,
                },
              },
              create: {
                familyId: input.familyId,
                situationKindId: input.situationKindId,
                normalizedText,
                displayText: input.cueRawText.trim(),
                review: {
                  create: {},
                },
              },
              update: {
                lastSeenAt: new Date(),
              },
            });

        const detail = await tx.observationDetail.upsert({
          where: { noteId: note.id },
          create: {
            noteId: note.id,
            cueKeyId: cueKey.id,
            priorAgreement: input.priorAgreement ?? "UNKNOWN",
            priorAgreementQuote: input.priorAgreementQuote,
            cueRawText: input.cueRawText.trim(),
            cueKind: input.cueKind,
            cueObservedText: input.cueObservedText,
            childActionText: input.childActionText,
            peerSpeechText: input.peerSpeechText,
            peerBodyText: input.peerBodyText,
            endingText: input.endingText,
            helpLevel: input.helpLevel,
            askExpert: input.askExpert ?? false,
            parentThoughts: input.parentThoughts,
          },
          update: {
            cueKeyId: cueKey.id,
            priorAgreement: input.priorAgreement ?? "UNKNOWN",
            priorAgreementQuote: input.priorAgreementQuote,
            cueRawText: input.cueRawText.trim(),
            cueKind: input.cueKind,
            cueObservedText: input.cueObservedText,
            childActionText: input.childActionText,
            peerSpeechText: input.peerSpeechText,
            peerBodyText: input.peerBodyText,
            endingText: input.endingText,
            helpLevel: input.helpLevel,
            askExpert: input.askExpert ?? false,
            parentThoughts: input.parentThoughts,
          },
        });

        await tx.observationNote.update({
          where: { id: note.id },
          data: { status: "DETAILED" },
        });

        return detail;
      });
    } catch (error) {
      if (attempt === 0 && isUniqueConstraintRace(error)) {
        continue;
      }

      throw error;
    }
  }
}

export async function createCueAlias(input: {
  familyId: string;
  situationKindId: string;
  aliasText: string;
  canonicalCueKeyId: string;
  note?: string;
}) {
  const aliasNormalizedText = assertCueText(input.aliasText);

  return prisma.cueAlias.upsert({
    where: {
      familyId_situationKindId_aliasNormalizedText: {
        familyId: input.familyId,
        situationKindId: input.situationKindId,
        aliasNormalizedText,
      },
    },
    create: {
      familyId: input.familyId,
      situationKindId: input.situationKindId,
      aliasText: input.aliasText.trim(),
      aliasNormalizedText,
      canonicalCueKeyId: input.canonicalCueKeyId,
      note: input.note,
    },
    update: {
      canonicalCueKeyId: input.canonicalCueKeyId,
      aliasText: input.aliasText.trim(),
      note: input.note,
    },
  });
}

export function previewNormalizedCue(input: string) {
  return normalizeCueText(input);
}
