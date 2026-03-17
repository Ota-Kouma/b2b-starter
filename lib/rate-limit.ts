import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ログイン試行: 10回/1分
export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:login",
});

// 招待メール送信: 5回/1時間
export const inviteRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:invite",
});
