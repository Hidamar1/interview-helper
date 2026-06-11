import { z } from "zod";
import { CATEGORIES } from "./constants";

// 单条追问：问题与提示
export const followUpSchema = z.object({
  question: z.string().min(5),
  hint: z.string().min(10),
});
// 追问链：2-4 条，供题目详情页解析数据库 Json 字段
export const followUpsSchema = z.array(followUpSchema).min(2).max(4);

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export type Difficulty = z.infer<typeof difficultySchema>;
export type FollowUp = z.infer<typeof followUpSchema>;

// 种子题目：slug 须为小写英文连字符
export const seedQuestionSchema = z.object({
  title: z.string().min(5),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 须为小写英文连字符"),
  answerBrief: z.string().min(20).max(300),
  answerDetail: z.string().min(200),
  followUps: followUpsSchema,
  difficulty: difficultySchema,
  tags: z.array(z.string().min(1)).min(1).max(6),
});

// 种子文件：题库元信息 + 至少 30 道题目
export const seedFileSchema = z.object({
  bank: z.object({
    name: z.string().min(2),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    description: z.string().min(4),
    icon: z.string().min(1),
    category: z.enum(CATEGORIES),
    sortOrder: z.number().int().min(0),
  }),
  questions: z.array(seedQuestionSchema).min(30),
});
export type SeedFile = z.infer<typeof seedFileSchema>;
