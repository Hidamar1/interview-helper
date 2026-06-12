"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/lib/actions/admin/question";
import type { Difficulty } from "@/lib/question-schema";

type QuestionRow = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  viewCount: number;
  bankId: string;
  bankName: string;
  answerBrief: string;
  answerDetail: string;
  followUps: { question: string; hint: string }[];
};

interface FollowUp {
  question: string;
  hint: string;
}

interface FormData {
  title: string;
  slug: string;
  answerBrief: string;
  answerDetail: string;
  followUps: FollowUp[];
  difficulty: Difficulty;
  tags: string;
  bankId: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  slug: "",
  answerBrief: "",
  answerDetail: "",
  followUps: [
    { question: "", hint: "" },
    { question: "", hint: "" },
  ],
  difficulty: "MEDIUM",
  tags: "",
  bankId: "",
};

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

function QuestionDialog({
  question,
  banks,
  trigger,
}: {
  question?: QuestionRow;
  banks: { id: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });

  // 编辑模式时，打开弹窗自动填充已有数据
  useEffect(() => {
    if (open && question) {
      const t = setTimeout(() => {
        setForm({
          title: question.title,
          slug: question.slug,
          answerBrief: question.answerBrief,
          answerDetail: question.answerDetail,
          followUps:
            question.followUps.length >= 2
              ? question.followUps
              : [
                  { question: "", hint: "" },
                  { question: "", hint: "" },
                ],
          difficulty: question.difficulty,
          tags: question.tags.join(", "),
          bankId: question.bankId,
        });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open, question]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.followUps.length < 2 || form.followUps.length > 4) {
      setError("追问链需要 2-4 条");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = {
        ...form,
        followUps: form.followUps.filter((f) => f.question && f.hint),
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (data.followUps.length < 2) {
        throw new Error("请填写至少 2 条追问（每题 + 提示）");
      }
      if (question) {
        await updateQuestion(question.id, data);
      } else {
        await createQuestion(data);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  function updateFollowUp(idx: number, field: "question" | "hint", value: string) {
    setForm((prev) => {
      const next = [...prev.followUps];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, followUps: next };
    });
  }

  function addFollowUp() {
    if (form.followUps.length >= 4) return;
    setForm((prev) => ({
      ...prev,
      followUps: [...prev.followUps, { question: "", hint: "" }],
    }));
  }

  function removeFollowUp(idx: number) {
    if (form.followUps.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      followUps: prev.followUps.filter((_, i) => i !== idx),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{question ? "编辑题目" : "新建题目"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="q-title">标题</Label>
            <Input
              id="q-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="q-slug">Slug</Label>
              <Input
                id="q-slug"
                required
                pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="java-hashmap-resize"
              />
            </div>
            <div>
              <Label htmlFor="q-diff">难度</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  setForm({ ...form, difficulty: v as Difficulty })
                }
              >
                <SelectTrigger id="q-diff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === "EASY"
                        ? "简单"
                        : d === "MEDIUM"
                          ? "中等"
                          : "困难"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="q-tags">标签（逗号分隔）</Label>
            <Input
              id="q-tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Java, 集合, 高频"
            />
          </div>
          <div>
            <Label htmlFor="q-bank">所属题库</Label>
            <Select
              value={form.bankId}
              onValueChange={(v) => setForm({ ...form, bankId: v })}
            >
              <SelectTrigger id="q-bank">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="q-brief">速记版（30 秒概括，20-300 字）</Label>
            <Input
              id="q-brief"
              required
              minLength={20}
              maxLength={300}
              value={form.answerBrief}
              onChange={(e) =>
                setForm({ ...form, answerBrief: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="q-detail">详解版（Markdown，≥200 字）</Label>
            <Textarea
              id="q-detail"
              required
              rows={6}
              minLength={200}
              value={form.answerDetail}
              onChange={(e) =>
                setForm({ ...form, answerDetail: e.target.value })
              }
            />
          </div>

          {/* 追问链 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>追问链（{form.followUps.length} 条）</Label>
              {form.followUps.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFollowUp}
                >
                  + 新增追问
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {form.followUps.map((f, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border-warm bg-cream/50 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      追问 #{i + 1}
                    </span>
                    {form.followUps.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs text-red-500"
                        onClick={() => removeFollowUp(i)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  <Input
                    required
                    className="mb-2"
                    placeholder="追问题目"
                    value={f.question}
                    onChange={(e) =>
                      updateFollowUp(i, "question", e.target.value)
                    }
                  />
                  <Textarea
                    required
                    rows={2}
                    placeholder="追问提示（≥10 字）"
                    value={f.hint}
                    onChange={(e) =>
                      updateFollowUp(i, "hint", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({
  id,
  trigger,
}: {
  id: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      await deleteQuestion(id);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          确定要删除这道题目吗？此操作不可撤销。
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button variant="destructive" disabled={loading} onClick={handleDelete}>
            确定删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuestionTable({
  questions,
  banks,
}: {
  questions: QuestionRow[];
  banks: { id: string; name: string }[];
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">题目管理</h1>
        <QuestionDialog
          banks={banks}
          trigger={<Button size="sm">新建题目</Button>}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-warm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-warm text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">难度</th>
              <th className="px-4 py-3 font-medium">题库</th>
              <th className="px-4 py-3 font-medium">标签</th>
              <th className="px-4 py-3 font-medium">浏览量</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q.id}
                className="border-b border-border-warm last:border-0"
              >
                <td className="max-w-[200px] truncate px-4 py-3">{q.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      q.difficulty === "EASY"
                        ? "bg-green-100 text-green-700"
                        : q.difficulty === "MEDIUM"
                          ? "bg-orange-100 text-[#B4690E]"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {q.difficulty === "EASY"
                      ? "简单"
                      : q.difficulty === "MEDIUM"
                        ? "中等"
                        : "困难"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {q.bankName}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {q.tags.slice(0, 3).join(" · ")}
                  </span>
                </td>
                <td className="px-4 py-3">{q.viewCount}</td>
                <td className="flex gap-2 px-4 py-3">
                  <QuestionDialog
                    question={q}
                    banks={banks}
                    trigger={<Button size="sm">编辑</Button>}
                  />
                  <DeleteConfirm
                    id={q.id}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                      >
                        删除
                      </Button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
