"use client";
import { useParams } from "next/navigation";

export default function DebugCatchAll() {
  const params = useParams();
  return (
    <div style={{ padding: 40 }}>
      <h1>Catch-all route hit!</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}
