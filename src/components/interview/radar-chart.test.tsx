import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RadarChart } from "./radar-chart";

describe("RadarChart", () => {
  it("应渲染 SVG", () => {
    const data = { knowledge: 80, depth: 70, expression: 90, logic: 75, adaptability: 85 };
    const { container } = render(<RadarChart data={data} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
