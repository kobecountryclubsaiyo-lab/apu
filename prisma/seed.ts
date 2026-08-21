import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const themeSeeds = [
    { slug: "game", name: "ゲーム", icon: "gamepad2", accentColor: "amber", sortOrder: 0 },
    { slug: "reading", name: "読書", icon: "book-open", accentColor: "teal", sortOrder: 1 },
    { slug: "camera", name: "カメラ", icon: "camera", accentColor: "clay", sortOrder: 2 },
    { slug: "anime", name: "アニメ", icon: "sparkles", accentColor: "amber", sortOrder: 3 },
    { slug: "programming", name: "プログラミング", icon: "code2", accentColor: "teal", sortOrder: 4 },
    { slug: "cooking", name: "料理", icon: "chef-hat", accentColor: "clay", sortOrder: 5 },
  ];

  const themes: Record<string, { id: number }> = {};
  for (const t of themeSeeds) {
    themes[t.slug] = await prisma.theme.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "運営",
      headline: "コミュニティ運営チーム",
      avatarInitial: "運",
      avatarColor: "teal",
      isAdmin: true,
    },
  });

  const haruka = await prisma.user.upsert({
    where: { email: "haruka@example.com" },
    update: {},
    create: {
      email: "haruka@example.com",
      passwordHash,
      name: "はるか",
      headline: "週末は大体レイドかボドゲ。初心者歓迎！",
      avatarInitial: "春",
      avatarColor: "amber",
      offlineMeetCount: 12,
    },
  });

  const yuki = await prisma.user.upsert({
    where: { email: "yuki@example.com" },
    update: {},
    create: {
      email: "yuki@example.com",
      passwordHash,
      name: "ゆうき",
      avatarInitial: "ゆ",
      avatarColor: "amber",
      offlineMeetCount: 4,
    },
  });

  const rin = await prisma.user.upsert({
    where: { email: "rin@example.com" },
    update: {},
    create: {
      email: "rin@example.com",
      passwordHash,
      name: "りん",
      avatarInitial: "り",
      avatarColor: "teal",
      offlineMeetCount: 6,
    },
  });

  const taku = await prisma.user.upsert({
    where: { email: "taku@example.com" },
    update: {},
    create: {
      email: "taku@example.com",
      passwordHash,
      name: "たく",
      avatarInitial: "た",
      avatarColor: "clay",
      offlineMeetCount: 2,
    },
  });

  const roomSeeds = [
    { slug: "game", name: "モンハン部屋", description: "今夜はレイドの話で盛り上がり中" },
    { slug: "reading", name: "積読を崩す会", description: "今週の話題: ミステリー小説のおすすめ" },
    { slug: "camera", name: "光と影を撮る部屋", description: "週末: 紅葉スポットの共有会" },
    { slug: "anime", name: "今期アニメ実況部屋", description: "今夜: 新作の感想で盛り上がり中" },
    { slug: "programming", name: "もくもく会ルーム", description: "今日: 詰まってるバグの相談中" },
    { slug: "cooking", name: "おうちごはん部屋", description: "今週: 時短レシピを共有中" },
  ];

  const rooms: Record<string, { id: number }> = {};
  for (const r of roomSeeds) {
    const existing = await prisma.room.findFirst({ where: { name: r.name } });
    rooms[r.slug] = existing
      ? existing
      : await prisma.room.create({
          data: {
            themeId: themes[r.slug].id,
            name: r.name,
            description: r.description,
            createdById: haruka.id,
            status: "APPROVED",
          },
        });
  }

  const monhanRoomId = rooms.game.id;
  for (const u of [haruka, yuki, rin, taku]) {
    await prisma.roomMembership.upsert({
      where: { userId_roomId: { userId: u.id, roomId: monhanRoomId } },
      update: {},
      create: { userId: u.id, roomId: monhanRoomId },
    });
  }

  const existingMessages = await prisma.message.count({ where: { roomId: monhanRoomId } });
  if (existingMessages === 0) {
    const today = new Date();
    const at = (h: number, m: number) => {
      const d = new Date(today);
      d.setHours(h, m, 0, 0);
      return d;
    };
    await prisma.message.createMany({
      data: [
        { roomId: monhanRoomId, userId: yuki.id, text: "今日のレイド強すぎた…w", createdAt: at(20, 14) },
        { roomId: monhanRoomId, userId: rin.id, text: "ほんとそれ、また行きたい", createdAt: at(21, 15) },
        { roomId: monhanRoomId, userId: taku.id, text: "週末またやりません？空いてる人いるかな", createdAt: at(21, 16) },
        { roomId: monhanRoomId, userId: yuki.id, text: "自分は土曜の夜なら行けます！", createdAt: at(21, 18) },
      ],
    });
  }

  const reactionSeeds: { from: { id: number }; to: { id: number }; type: string }[] = [];
  const reactionTypes = ["AGAIN", "FUN", "INTERESTING"];
  const reactionCounts = { AGAIN: 3, FUN: 2, INTERESTING: 1 };
  const reactors = [yuki, rin, taku];
  for (const type of reactionTypes) {
    for (let i = 0; i < reactionCounts[type as keyof typeof reactionCounts]; i++) {
      reactionSeeds.push({ from: reactors[i % reactors.length], to: haruka, type });
    }
  }
  for (const r of reactionSeeds) {
    await prisma.reaction.upsert({
      where: {
        fromUserId_toUserId_recruitPostId_type: {
          fromUserId: r.from.id,
          toUserId: r.to.id,
          recruitPostId: 0,
          type: r.type,
        },
      },
      update: {},
      create: { fromUserId: r.from.id, toUserId: r.to.id, type: r.type },
    });
  }

  // Give a lower-trust user (たく) a room creation pending approval, so the
  // admin approval queue has something to review out of the box.
  const pendingExists = await prisma.room.findFirst({ where: { name: "初心者ボドゲ会" } });
  if (!pendingExists) {
    await prisma.room.create({
      data: {
        themeId: themes.game.id,
        name: "初心者ボドゲ会",
        description: "ボドゲ初心者同士でゆるく集まりたいです",
        createdById: taku.id,
        status: "PENDING",
      },
    });
  }

  console.log("Seed complete. Demo login: haruka@example.com / " + DEMO_PASSWORD);
  console.log("Admin login: admin@example.com / " + DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
