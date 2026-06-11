import { render, screen } from "@testing-library/react";
import { BankCard } from "./bank-card";

describe("BankCard", () => {
  const bank = { name: "MySQL", slug: "mysql", description: "索引 · 事务", icon: "🗄️", questionCount: 38, viewTotal: 15600 };

  it("渲染名称、题数与格式化浏览量，并链接到详情", () => {
    render(<BankCard bank={bank} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/banks/mysql");
    expect(screen.getByText("MySQL")).toBeInTheDocument();
    expect(screen.getByText("38 题")).toBeInTheDocument();
    expect(screen.getByText(/15\.6k/)).toBeInTheDocument();
  });
});
