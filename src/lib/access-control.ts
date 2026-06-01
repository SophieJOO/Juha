import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireFamilyMember(familyId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const member = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId,
      },
    },
  });

  if (!member) {
    throw new Error("이 가족 기록에 접근할 권한이 없습니다.");
  }

  return member;
}
