"use client";

import { ChoosieList } from "../components/ListForm";

const STORAGE_KEY = "choosie_lists_v1";
const STORAGE_USER_KEY = "choosie_lists_user_v1";
const ANONYMOUS_SCOPE = "anonymous";

function storageKey(userId?: string | null) {
  const scope = userId || getListStorageUserId() || ANONYMOUS_SCOPE;
  return `${STORAGE_KEY}:${scope}`;
}

export function getListStorageUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_USER_KEY);
}

export function setListStorageUserId(userId?: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(STORAGE_USER_KEY, userId);
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
}

export function loadLists(userId?: string | null): ChoosieList[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey(userId));
  return raw ? JSON.parse(raw) : [];
}

export function saveLists(lists: ChoosieList[], userId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(lists));
}

export function upsertList(list: ChoosieList, userId?: string | null) {
  const lists = loadLists(userId);
  const existingIndex = lists.findIndex((l) => l.id === list.id);
  if (existingIndex >= 0) lists[existingIndex] = list;
  else lists.push(list);
  saveLists(lists, userId);
}

export function getList(id: string, userId?: string | null): ChoosieList | undefined {
  return loadLists(userId).find((l) => l.id === id);
}

export function removeList(id: string, userId?: string | null) {
  const lists = loadLists(userId).filter((l) => l.id !== id);
  saveLists(lists, userId);
}
