import { promises as fs } from "fs";
import path from "path";
import { ChoosieList, ChoosieItem } from "./types";

const DATA_FILE = process.env.CHOOSIE_DATA_FILE || path.join(process.cwd(), "data", "choosie-store.json");
const DATA_DIR = path.dirname(DATA_FILE);

type Store = {
  lists: ChoosieList[];
};

async function ensureStore(): Promise<Store> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    const initial: Store = { lists: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
  }
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(raw) as Store;
  } catch {
    const fallback: Store = { lists: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function saveStore(store: Store): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export async function createList(title: string, items?: Array<Partial<ChoosieItem>>): Promise<ChoosieList> {
  const store = await ensureStore();
  const newList: ChoosieList = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    title: title.trim(),
    items: (items || []).map((it) => ({
      id: Math.random().toString(36).slice(2),
      title: (it.title || "Untitled").toString(),
      notes: it.notes,
      image: it.image ?? null,
    })),
    createdAt: new Date().toISOString(),
  };
  store.lists.push(newList);
  await saveStore(store);
  return newList;
}

export async function getListById(id: string): Promise<ChoosieList | undefined> {
  const store = await ensureStore();
  return store.lists.find((l) => l.id === id);
}

export async function upsertList(list: ChoosieList): Promise<void> {
  const store = await ensureStore();
  const idx = store.lists.findIndex((l) => l.id === list.id);
  if (idx >= 0) store.lists[idx] = list;
  else store.lists.push(list);
  await saveStore(store);
}

export async function addMovieToList(listId: string, item: { title: string; notes?: string; image?: string | null }): Promise<ChoosieItem | undefined> {
  const store = await ensureStore();
  const list = store.lists.find((l) => l.id === listId);
  if (!list) return undefined;
  // prevent duplicates by case-insensitive title
  const dup = list.items.find((i) => i.title.toLowerCase() === item.title.toLowerCase());
  if (dup) return dup;
  const newItem: ChoosieItem = {
    id: Math.random().toString(36).slice(2),
    title: item.title.trim(),
    notes: item.notes,
    image: item.image ?? null,
  };
  list.items.push(newItem);
  await saveStore(store);
  return newItem;
}

export async function deleteList(id: string): Promise<boolean> {
  const store = await ensureStore();
  const idx = store.lists.findIndex((l) => l.id === id);
  if (idx < 0) return false;
  store.lists.splice(idx, 1);
  await saveStore(store);
  return true;
}
