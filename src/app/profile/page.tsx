import { redirect } from "next/navigation";
import { MapPin, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/serialize";
import { REACTION_LABELS, type ReactionType } from "@/lib/types";
import NavBar from "@/components/NavBar";
import { ICONS_BY_KEY } from "@/components/theme-icons";
import ProfileHero from "@/components/ProfileHero";
import { Heart, Smile, Star } from "lucide-react";
import { getBlockedUserIds } from "@/lib/blocks";

const REACTION_ICONS: Record<ReactionType, typeof Heart> = { AGAIN: Heart, FUN: Smile, INTERESTING: Star };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const blockedIds = await getBlockedUserIds(user.id);

  const [reactionCounts, memberThemes, joinedActivity, organizedActivity] = await Promise.all([
    prisma.reaction.groupBy({
      by: ["type"],
      where: { toUserId: user.id, fromUserId: { notIn: Array.from(blockedIds) } },
      _count: { type: true },
    }),
    prisma.theme.findMany({
      where: { rooms: { some: { memberships: { some: { userId: user.id } } } } },
      take: 6,
    }),
    prisma.recruitParticipant.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "desc" },
      take: 5,
      include: { recruitPost: true },
    }),
    prisma.recruitPost.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const reactions = (Object.keys(REACTION_LABELS) as ReactionType[]).map((type) => ({
    type,
    label: REACTION_LABELS[type],
    value: reactionCounts.find((r) => r.type === type)?._count.type ?? 0,
    icon: REACTION_ICONS[type],
  }));

  const activity = [
    ...joinedActivity.map((a) => ({
      date: a.joinedAt,
      text: `「${a.recruitPost.title}」に参加`,
    })),
    ...organizedActivity.map((a) => ({
      date: a.createdAt,
      text: `「${a.title}」を主催`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const publicUserData = publicUser(user);

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-night">
      <NavBar user={publicUserData} />
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper text-ink shadow-2xl">
        <ProfileHero user={publicUserData} />

        <div className="px-6 pt-5">
          <div className="rounded-xl px-5 py-4 flex items-center justify-between bg-night text-paper">
            <div>
              <p className="text-xs tracking-wide flex items-center gap-1.5 text-[#C9C3B4]">
                <MapPin size={12} className="text-amber" />
                オフラインで会った回数
              </p>
              <p className="text-[11px] mt-0.5 text-[#8D87A0]">安心して人と会えている実績です</p>
            </div>
            <p className="text-4xl shrink-0 pl-3 font-mono font-semibold text-amber">
              {publicUserData.offlineMeetCount}
              <span className="text-base ml-0.5 text-[#C9C3B4]">回</span>
            </p>
          </div>
          <p className="text-[11px] text-center mt-2 text-stone">
            フォロワー数・性別は、ここでは表示されません。
          </p>
        </div>

        {memberThemes.length > 0 && (
          <div className="px-6 pt-5">
            <p className="text-xs font-semibold mb-2 text-stone">興味のあるテーマ</p>
            <div className="flex flex-wrap gap-2">
              {memberThemes.map((theme) => {
                const Icon = ICONS_BY_KEY[theme.icon] ?? ICONS_BY_KEY.default;
                return (
                  <span
                    key={theme.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#EAE2CF] text-ink"
                  >
                    <Icon size={13} className="text-teal" />
                    {theme.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 pt-5">
          <p className="text-xs font-semibold mb-2 text-stone">もらったリアクション</p>
          <div className="grid grid-cols-3 gap-2.5">
            {reactions.map(({ type, value, label, icon: Icon }) => (
              <div
                key={type}
                className="rounded-lg px-2.5 py-3 flex flex-col items-center text-center gap-1 bg-[#EFE8D8] border border-[#DFD5BC]"
              >
                <Icon size={15} className="text-teal" />
                <p className="text-lg leading-none mt-0.5 font-mono font-semibold">{value}</p>
                <p className="text-[10.5px] leading-snug text-stone">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-xs font-semibold mb-2 text-stone">最近の活動</p>
          <div className="space-y-2">
            {activity.length === 0 && <p className="text-xs text-stone">まだ活動がありません</p>}
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-teal shrink-0">
                  {a.date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                </span>
                <span className="leading-snug text-ink">{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5">
          <div className="h-3 w-full bg-[radial-gradient(circle,_#1E2340_2.5px,_transparent_2.5px)] bg-[length:14px_14px]" />
          <div className="px-6 py-3 flex items-center justify-between bg-[#EAE2CF]">
            <div className="flex items-center gap-1.5">
              <MessageCircle size={12} className="text-teal" />
              <span className="text-[10.5px] text-stone">
                初参加:{" "}
                {publicUserData.createdAt
                  ? new Date(publicUserData.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                    })
                  : ""}
              </span>
            </div>
            <span className="text-[10.5px] font-mono text-stone">MEMBER NO. {publicUserData.memberNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
