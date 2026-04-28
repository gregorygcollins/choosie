"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VirtualRedirectPage() {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => {
    if (id) router.replace(`/list/${id}/virtual/roles`);
  }, [id, router]);
  return <div className="p-8 text-center">Redirecting to role selection…</div>;
}
