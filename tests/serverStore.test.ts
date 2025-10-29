import { describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { promises as fs } from "fs";

// Set a temp data file for these tests
const TMP_FILE = path.join(process.cwd(), "data", "choosie-store-test.json");
process.env.CHOOSIE_DATA_FILE = TMP_FILE;

import { createList, getListById, addMovieToList, upsertList } from "../lib/serverStore";

async function cleanup() {
  try { await fs.unlink(TMP_FILE); } catch {}
}

beforeEach(async () => {
  await cleanup();
});

describe("serverStore", () => {
  it("creates a list and retrieves it", async () => {
    const list = await createList("Test Night", [{ title: "Inception" }]);
    expect(list.id).toBeTruthy();
    const fetched = await getListById(list.id);
    expect(fetched?.title).toBe("Test Night");
    expect(fetched?.items.length).toBe(1);
  });

  it("adds a movie and prevents duplicates", async () => {
    const list = await createList("Movies");
    const item1 = await addMovieToList(list.id, { title: "Soul" });
    const item2 = await addMovieToList(list.id, { title: "Soul" });
    expect(item1?.id).toBeTruthy();
    expect(item2?.id).toBe(item1?.id);
    const updated = await getListById(list.id);
    expect(updated?.items.length).toBe(1);
  });

  it("persists winnerId on finalize", async () => {
    const list = await createList("Finale", [{ title: "Parasite" }, { title: "Moonlight" }]);
    const chosen = (await getListById(list.id))!.items[1];
    const updated = { ...(await getListById(list.id))!, winnerId: chosen.id };
    await upsertList(updated);
    const fetched = await getListById(list.id);
    expect(fetched?.winnerId).toBe(chosen.id);
  });
});
