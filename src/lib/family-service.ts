import crypto from "node:crypto";
import { DEFAULT_SITUATION_KINDS } from "@/lib/default-situation-kinds";
import { prisma } from "@/lib/prisma";

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
