import { render } from "@testing-library/react";
import { DuckIcon } from "./duck-icon";

describe("DuckIcon", () => {
  it("渲染 SVG 且尺寸可配置", () => {
    const { container } = render(<DuckIcon size={64} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "64");
  });
});
