"use client";

import { ChoosieList } from "../components/ListForm";

const STORAGE_KEY = "choosie_lists_v1";

export function loadLists(): ChoosieList[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLists(lists: ChoosieList[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

export function upsertList(list: ChoosieList) {
  const lists = loadLists();
  const existingIndex = lists.findIndex((l) => l.id === list.id);
  if (existingIndex >= 0) lists[existingIndex] = list;
  else lists.push(list);
  saveLists(lists);
}

export function getList(id: string): ChoosieList | undefined {
  return loadLists().find((l) => l.id === id);
}

export function removeList(id: string) {
  const lists = loadLists().filter((l) => l.id !== id);
  saveLists(lists);
}