import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import RecruitPostForm from "@/components/RecruitPostForm";
import { REACTION_LABELS, type ReactionType } from "@/lib/types";

export default async function NewRecruitPostPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roomId = Number(params.id);
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.status !== "APPROVED") notFound();

  const reactionCounts = await prisma.reaction.groupBy({
    by: ["type"],
    where: { toUserId: user.id },
    _count: { type: true },
  });
  const stamps = (Object.keys(REACTION_LABELS) as ReactionType[]).map((type) => ({
    type,
    label: REACTION_LABELS[type],
    value: reactionCounts.find((r) => r.type === type)?._count.type ?? 0,
  }));

  return (
    <RecruitPostForm
      roomId={room.id}
      roomName={room.name}
      organizer={{
        offlineMeetCount: publicUser(user).offlineMeetCount,
        stamps,
      }}
    />
  );
}
