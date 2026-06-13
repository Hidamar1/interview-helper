import { createOpenAI } from "@ai-sdk/openai";

// 使用 DeepSeek 的 OpenAI 兼容接口
// 文档：https://platform.deepseek.com/api-docs
const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/** LLM 模型：通过 AI_PROVIDER 环境变量切换 deepseek / mock */
export function getModel() {
  switch (process.env.AI_PROVIDER) {
    case "mock":
      return null;
    case "deepseek":
    default:
      return deepseek("deepseek-chat");
  }
}

/** 是否使用 mock 模式（跳过真实 API 调用） */
export function isMock() {
  return process.env.AI_PROVIDER === "mock";
}
