import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/banks" }));

describe("SiteHeader", () => {
  it("渲染 logo 与三个主导航", () => {
    render(<SiteHeader />);
    expect(screen.getByText("突击鸭")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "题库" })).toHaveAttribute("href", "/banks");
    expect(screen.getByRole("link", { name: "开始面试" })).toHaveAttribute("href", "/interview");
    expect(screen.getByRole("link", { name: "刷题记录" })).toHaveAttribute("href", "/profile");
  });
  it("当前路由导航高亮", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "题库" })).toHaveClass("text-primary");
  });
});
