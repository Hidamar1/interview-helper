import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Heatmap } from "@/components/profile/heatmap";
import { FavoriteList } from "@/components/profile/favorite-list";
import { getHeatmapData, getStudyCount } from "@/lib/actions/study";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  const user = session.user;
  const [heatmapData, studyCount] = await Promise.all([
    getHeatmapData(),
    getStudyCount(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* 用户信息 */}
      <section className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
        {user.image ? (
          <img src={user.image} alt="" className="size-16 rounded-full" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink">{user.name ?? "未设置昵称"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-sm">
            累计刷题 <span className="font-semibold text-primary">{studyCount}</span> 次
          </p>
        </div>
      </section>

      {/* 热力图 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">刷题热力图</h2>
        <div className="rounded-xl border border-border-warm bg-white p-4">
          <Heatmap data={heatmapData} />
        </div>
      </section>

      {/* 收藏列表 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">我的收藏</h2>
        <FavoriteList />
      </section>
    </div>
  );
}
