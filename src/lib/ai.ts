import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/** LLM 模型：通过 AI_PROVIDER 环境变量切换 deepseek / mock */
export function getModel() {
  switch (process.env.AI_PROVIDER) {
    case "mock":
      return null; // 测试环境，由测试注入 mock provider
    case "deepseek":
    default:
      return deepseek("deepseek-chat");
  }
}

/** 是否使用 mock 模式（跳过真实 API 调用） */
export function isMock() {
  return process.env.AI_PROVIDER === "mock";
}
