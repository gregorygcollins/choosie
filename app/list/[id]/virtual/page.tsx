"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualInvitesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = String(params?.id ?? "");
  const queryString = searchParams.toString();
  // Read participantToken from ?pt=... in the URL
  const participantToken = searchParams.get("pt") || "";

  // State for narrowing session
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");


  // Fetch narrowing state on mount
  useEffect(() => {
    fetchState();
    // eslint-disable-next-line
  }, [listId]);

  // Redirect to winner page if winnerItemId is present
  useEffect(() => {
    if (session?.winnerItemId && listId) {
      router.replace(`/final/${listId}?winner=${session.winnerItemId}`);
    }
