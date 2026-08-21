// Safety rules from app-specification.md, centralized so UI and API validation
// (client + server) stay in sync.

/** 募集の定員は3人以上を必須とする（1対1の出会いを防ぐ） */
export const MIN_RECRUIT_CAPACITY = 3;
export const MAX_RECRUIT_CAPACITY = 20;

/**
 * 信頼スタンプが一定貯まったユーザーは、部屋作成の運営承認が不要になる。
 * オフラインで会った回数 + もらったリアクション合計がこのしきい値以上で自動承認。
 */
export const AUTO_APPROVE_TRUST_THRESHOLD = 10;

export function canAutoApproveRoom(offlineMeetCount: number, totalReactions: number): boolean {
  return offlineMeetCount + totalReactions >= AUTO_APPROVE_TRUST_THRESHOLD;
}
