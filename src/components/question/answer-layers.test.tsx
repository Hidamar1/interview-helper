import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerLayers } from "./answer-layers";

const followUps = [
  { question: "为什么扩容是 2 倍？", hint: <p>位运算提示</p> },
  { question: "1.7 和 1.8 有何区别？", hint: <p>红黑树提示</p> },
];

function setup() {
  render(<AnswerLayers brief="速记内容" detail={<p>详解内容</p>} followUps={followUps} />);
  return userEvent.setup();
}

describe("AnswerLayers 三层答案", () => {
  it("速记默认可见，详解与追问提示默认不可见（原生 details 折叠）", () => {
    setup();
    expect(screen.getByText("速记内容")).toBeVisible();
    expect(screen.getByText("详解内容")).not.toBeVisible();
    expect(screen.getByText("位运算提示")).not.toBeVisible();
  });

  it("点击详解 summary 展开详解，再点收起", async () => {
    const user = setup();
    await user.click(screen.getByText(/详解版/));
    expect(screen.getByText("详解内容")).toBeVisible();
    await user.click(screen.getByText(/详解版/));
    expect(screen.getByText("详解内容")).not.toBeVisible();
  });

  it("追问逐个翻开，互不影响且各自保持展开", async () => {
    const user = setup();
    await user.click(screen.getByText(/追问 1/));
    expect(screen.getByText("位运算提示")).toBeVisible();
    expect(screen.getByText("红黑树提示")).not.toBeVisible();
    await user.click(screen.getByText(/追问 2/));
    expect(screen.getByText("位运算提示")).toBeVisible();
    expect(screen.getByText("红黑树提示")).toBeVisible();
  });
});
