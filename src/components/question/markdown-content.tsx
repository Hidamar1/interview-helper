import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { highlighter } from "@/lib/shiki";

export function MarkdownContent({ source }: { source: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none prose-headings:text-ink prose-a:text-primary prose-code:font-mono">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeShikiFromHighlighter,
            highlighter,
            { theme: "one-light", defaultLanguage: "text", fallbackLanguage: "text" },
          ],
        ]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
