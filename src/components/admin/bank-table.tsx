"use client";

import { useState } from "react";
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
import { createBank, updateBank, deleteBank } from "@/lib/actions/admin/bank";

const CATEGORIES = [
  "Java",
  "前端",
  "Python",
  "数据库",
  "网络",
  "操作系统",
  "AI 大模型",
] as const;
type Category = (typeof CATEGORIES)[number];

type BankRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  sortOrder: number;
  questionCount: number;
};

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: Category;
  sortOrder: number;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  category: "Java" as Category,
  sortOrder: 0,
};

function BankDialog({
  bank,
  trigger,
}: {
  bank?: BankRow;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>(
    bank
      ? {
          name: bank.name,
          slug: bank.slug,
          description: bank.description,
          icon: bank.icon,
          category: bank.category as Category,
          sortOrder: bank.sortOrder,
        }
      : { ...EMPTY_FORM },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (bank) {
        await updateBank(bank.id, form);
      } else {
        await createBank(form);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bank ? "编辑题库" : "新建题库"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="bank-name">名称</Label>
            <Input
              id="bank-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bank-slug">Slug</Label>
            <Input
              id="bank-slug"
              required
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="java-basics"
            />
          </div>
          <div>
            <Label htmlFor="bank-desc">描述</Label>
            <Textarea
              id="bank-desc"
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bank-icon">图标（Emoji）</Label>
              <Input
                id="bank-icon"
                required
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="📚"
              />
            </div>
            <div>
              <Label htmlFor="bank-sort">排序序号</Label>
              <Input
                id="bank-sort"
                type="number"
                min={0}
                required
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bank-cat">分类</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as Category })}
            >
              <SelectTrigger id="bank-cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      await deleteBank(id);
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
          确定要删除这个题库吗？此操作不可撤销。
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

export function BankTable({ banks }: { banks: BankRow[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">题库管理</h1>
        <BankDialog trigger={<Button size="sm">新建题库</Button>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-warm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-warm text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">题目数</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr
                key={bank.id}
                className="border-b border-border-warm last:border-0"
              >
                <td className="px-4 py-3">
                  {bank.icon} {bank.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{bank.slug}</td>
                <td className="px-4 py-3">{bank.category}</td>
                <td className="px-4 py-3">{bank.questionCount}</td>
                <td className="px-4 py-3">{bank.sortOrder}</td>
                <td className="flex gap-2 px-4 py-3">
                  <BankDialog
                    bank={bank}
                    trigger={<Button size="sm">编辑</Button>}
                  />
                  <DeleteConfirm
                    id={bank.id}
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
