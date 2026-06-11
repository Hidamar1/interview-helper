import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heatmap } from "./heatmap";

describe("Heatmap", () => {
  it("应渲染图例（少 / 多）", () => {
    const today = new Date().toISOString().slice(0, 10);
    render(<Heatmap data={[{ date: today, count: 3 }]} />);
    expect(screen.getByText("少")).toBeInTheDocument();
    expect(screen.getByText("多")).toBeInTheDocument();
  });

  it("空数据时不报错", () => {
    render(<Heatmap data={[]} />);
    expect(screen.getByText("少")).toBeInTheDocument();
  });
});
