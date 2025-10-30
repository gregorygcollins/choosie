"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ListForm from "../../components/ListForm";
import { upsertList, getList } from "../../lib/storage";
import type { ChoosieList } from "../../components/ListForm";
import UpsellModal from "../../components/UpsellModal";

export default function NewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [existingList, setExistingList] = useState<ChoosieList | null>(null);
  const [me, setMe] = useState<{ isPro?: boolean } | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    if (editId) {
      const list = getList(editId);
      if (list) {
        setExistingList(list);
      }
    }
  }, [editId]);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setMe(data?.user || null);
      } catch {
        if (!cancelled) setMe(null);
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  function handleSave(list: any) {
    upsertList(list);
    router.push(`/list/${list.id}`);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          Premium modules <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 text-xs font-semibold text-black">Pro</span>
        </div>
        {!me?.isPro && (
          <button onClick={() => setUpsellOpen(true)} className="text-sm rounded-full bg-amber-300 px-3 py-1 font-semibold text-black">
            Unlock Pro
          </button>
        )}
      </div>

      <ListForm onSave={handleSave} existingList={existingList} />
      <UpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </>
  );
}