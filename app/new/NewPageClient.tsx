"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ListForm from "../../components/ListForm";
import { upsertList, getList } from "../../lib/storage";
import type { ChoosieList } from "../../components/ListForm";

export default function NewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [existingList, setExistingList] = useState<ChoosieList | null>(null);

  useEffect(() => {
    if (editId) {
      const list = getList(editId);
      if (list) {
        setExistingList(list);
      }
    }
  }, [editId]);

  function handleSave(list: any) {
    upsertList(list);
    router.push(`/list/${list.id}`);
  }

  return <ListForm onSave={handleSave} existingList={existingList} />;
}