import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import oneLight from "@shikijs/themes/one-light";
import java from "@shikijs/langs/java";
import javascript from "@shikijs/langs/javascript";
import typescript from "@shikijs/langs/typescript";
import python from "@shikijs/langs/python";
import sql from "@shikijs/langs/sql";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";

// 同步 highlighter 单例：RSC 中同步渲染 Markdown，避免重复创建实例
const globalForShiki = globalThis as unknown as { shiki?: HighlighterCore };

export const highlighter =
  globalForShiki.shiki ??
  createHighlighterCoreSync({
    themes: [oneLight],
    langs: [java, javascript, typescript, python, sql, bash, json],
    engine: createJavaScriptRegexEngine(),
  });

globalForShiki.shiki = highlighter;
