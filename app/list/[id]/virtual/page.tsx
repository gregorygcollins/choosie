"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VirtualNarrowingSession() {
  const params = useParams();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const pt = search.get("pt");
  const start = search.get("start");

  useEffect(() => {
    // Simulate loading session state, etc.
    setReady(true);
  }, []);

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Virtual Narrowing Session</h1>
      <div className="mb-2">List ID: <span className="font-mono">{params.id}</span></div>
      <div className="mb-2">Participant Index (pt): <span className="font-mono">{pt}</span></div>
      <div className="mb-2">Start flag: <span className="font-mono">{start}</span></div>
      {ready ? (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <strong>Ready!</strong> This is where the narrowing UI will go.<br />
          (Selections, turn logic, and real-time updates will be implemented here.)
        </div>
      ) : (
        <div>Loading session…</div>
      )}
    </div>
  );
}
