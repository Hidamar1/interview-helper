import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "./markdown-content";

describe("MarkdownContent", () => {
  it("渲染标题、表格与高亮代码块", () => {
    const source = "## 触发条件\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```java\nint a = 1;\n```";
    render(<MarkdownContent source={source} />);
    expect(screen.getByRole("heading", { level: 2, name: "触发条件" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(document.querySelector("pre.shiki")).toBeInTheDocument();
  });
});
