import { buildSearchWhere } from "./questions";

describe("buildSearchWhere", () => {
  it("标题模糊（忽略大小写）或 tag 精确命中", () => {
    expect(buildSearchWhere("hashmap")).toEqual({
      OR: [
        { title: { contains: "hashmap", mode: "insensitive" } },
        { tags: { has: "hashmap" } },
      ],
    });
  });
});
