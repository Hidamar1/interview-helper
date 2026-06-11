import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "./difficulty-badge";

describe("DifficultyBadge", () => {
  it.each([
    ["EASY", "简单", "text-emerald-600"],
    ["MEDIUM", "中等", "text-orange-600"],
    ["HARD", "困难", "text-red-500"],
  ] as const)("%s 显示「%s」", (difficulty, label, cls) => {
    render(<DifficultyBadge difficulty={difficulty} />);
    expect(screen.getByText(label)).toHaveClass(cls);
  });
});
