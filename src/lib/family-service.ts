import crypto from "node:crypto";
import { DEFAULT_SITUATION_KINDS } from "@/lib/default-situation-kinds";
import { prisma } from "@/lib/prisma";

export async function syncDefaultSituationKinds(familyId: string) {
  const defaultCodes = DEFAULT_SITUATION_KINDS.map((kind) => kind.code);

  await prisma.$transaction(
    [
      ...DEFAULT_SITUATION_KINDS.map((kind, index) =>
        prisma.situationKind.upsert({
          where: {
            familyId_code: {
              familyId,
              code: kind.code,
            },
          },
          create: {
            familyId,
            code: kind.code,
            label: kind.label,
            userFacingLabel: kind.userFacingLabel,
            expertCheckDefault: kind.expertCheckDefault,
            sortOrder: index,
          },
          update: {
            label: kind.label,
            userFacingLabel: kind.userFacingLabel,
            expertCheckDefault: kind.expertCheckDefault,
            sortOrder: index,
            archivedAt: null,
          },
        }),
      ),
      prisma.situationKind.updateMany({
        where: {
          familyId,
          archivedAt: null,
          code: { notIn: defaultCodes },
        },
        data: { archivedAt: new Date() },
      }),
    ],
  );
}

export function needsDefaultSituationKindSync(
  situationKinds: Array<{
    code: string;
    userFacingLabel: string;
    sortOrder: number;
    archivedAt: Date | null;
  }>,
) {
  const currentByCode = new Map(
    situationKinds.map((kind) => [kind.code, kind]),
  );
  const defaultCodes = new Set<string>(
    DEFAULT_SITUATION_KINDS.map((kind) => kind.code),
  );

  const hasMissingOrChangedDefault = DEFAULT_SITUATION_KINDS.some((kind, index) => {
    const current = currentByCode.get(kind.code);

    return (
      !current ||
      current.userFacingLabel !== kind.userFacingLabel ||
      current.sortOrder !== index ||
      current.archivedAt !== null
    );
  });

  const hasExtraActiveKind = situationKinds.some(
    (kind) => kind.archivedAt === null && !defaultCodes.has(kind.code),
  );

  return hasMissingOrChangedDefault || hasExtraActiveKind;
}

export async function createFamilyWithDefaults(input: {
  ownerUserId: string;
  ownerName: string;
  familyName: string;
  childName: string;
}) {
  return prisma.$transaction(async (tx) => {
    const family = await tx.family.create({
      data: {
        name: input.familyName,
        members: {
          create: {
            userId: input.ownerUserId,
            name: input.ownerName,
            role: "OWNER",
          },
        },
        children: {
          create: {
            displayName: input.childName,
          },
        },
      },
    });

    await tx.situationKind.createMany({
      data: DEFAULT_SITUATION_KINDS.map((kind, index) => ({
        familyId: family.id,
        code: kind.code,
        label: kind.label,
        userFacingLabel: kind.userFacingLabel,
        expertCheckDefault: kind.expertCheckDefault,
        sortOrder: index,
      })),
      skipDuplicates: true,
    });

    return family;
  });
}

export async function createFamilyInvite(input: {
  familyId: string;
  email: string;
  expiresInHours?: number;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(
    Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000,
  );

  await prisma.familyInvite.create({
    data: {
      familyId: input.familyId,
      email: input.email.toLowerCase(),
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function acceptFamilyInvite(input: {
  token: string;
  userId: string;
  displayName: string;
}) {
  const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");

  return prisma.$transaction(async (tx) => {
    const invite = await tx.familyInvite.findUniqueOrThrow({
      where: { tokenHash },
    });

    if (invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new Error("초대 링크가 만료되었거나 이미 사용되었습니다.");
    }

    const member = await tx.familyMember.upsert({
      where: {
        familyId_userId: {
          familyId: invite.familyId,
          userId: input.userId,
        },
      },
      create: {
        familyId: invite.familyId,
        userId: input.userId,
        name: input.displayName,
        role: "PARENT",
      },
      update: {
        name: input.displayName,
      },
    });

    await tx.familyInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return member;
  });
}
