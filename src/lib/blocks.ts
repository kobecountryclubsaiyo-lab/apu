import { prisma } from "@/lib/prisma";

/**
 * ブロックは方向を記録するが、可視性は常に双方向。
 * ブロックした相手・ブロックされた相手のどちらのidも含むSetを返す
 * （report-block-prototype.jsx: 「お互いの投稿・メッセージ・プロフィールが表示されなくなります」）。
 */
export async function getBlockedUserIds(userId: number): Promise<Set<number>> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<number>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  return ids;
}
