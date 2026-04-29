"use client";
import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function VirtualInvitesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const listId = String(params?.id ?? "");
  const queryString = searchParams.toString();

  const [result, setResult] = useState<string>("");

  async function testApi() {
    setResult("Loading...");

    try {
      const res = await fetch("/api/choosie/narrow/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId,
          query: queryString,
        }),
      });

      const text = await res.text();

      setResult(
        JSON.stringify(
          {
            status: res.status,
            ok: res.ok,
            body: text,
          },
          null,
          2
        )
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
          : String(error)
      );
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-4 text-3xl font-bold">
          Virtual narrowing diagnostic page
        </h1>

        <div className="space-y-2 text-sm">
          <p>
            <strong>List ID:</strong> {listId || "Missing"}
          </p>
          <p>
            <strong>Search params:</strong> {queryString || "None"}
          </p>
        </div>

        <button
          type="button"
          onClick={testApi}
          className="mt-6 rounded-lg bg-black px-4 py-2 text-white"
        >
          Test API
        </button>

        {result && (
          <pre className="mt-6 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
