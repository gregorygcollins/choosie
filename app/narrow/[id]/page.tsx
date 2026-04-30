
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NarrowingPanel } from "@/components/NarrowingPanel";
import { initializeNarrowing } from "@/lib/narrowing";

function DiagnosticPanel({ id, endpoint, apiResponse, error }: { id: string, endpoint: string, apiResponse: any, error: string | null }) {
	return (
		<div style={{ background: '#fffbe6', color: '#222', fontSize: 13, padding: 12, border: '2px solid #eab308', borderRadius: 8, margin: 16, maxWidth: 600 }}>
			<div><b>Diagnostic Panel</b></div>
			<div><b>Route id:</b> {id}</div>
			<div><b>API endpoint:</b> {endpoint}</div>
			<div><b>Raw API response:</b> <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, maxHeight: 120, overflow: 'auto', background: '#f3f4f6', padding: 4 }}>{JSON.stringify(apiResponse, null, 2)}</pre></div>
			<div><b>List exists:</b> {apiResponse?.state ? 'Yes' : 'No'}</div>
			<div><b>Number of items:</b> {Array.isArray(apiResponse?.items) ? apiResponse.items.length : 0}</div>
			<div><b>API error message:</b> {apiResponse?.error || error || ''}</div>
		</div>
	);
}

export default function NarrowPage() {
	const { id } = useParams();
	const [data, setData] = useState<any>(null);
	const [rawApiResponse, setRawApiResponse] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function fetchData() {
			setLoading(true);
			setError(null);
			try {
				const endpoint = "/api/choosie/narrow/state";
				const res = await fetch(endpoint, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ listId: id }),
					cache: "no-store"
				});
				if (!res.ok) throw new Error("Not found");
				const json = await res.json();
				if (!cancelled) {
					setData(json);
					setRawApiResponse(json);
				}
			} catch (e: any) {
				if (!cancelled) setError("Failed to load narrowing state");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchData();
		return () => { cancelled = true; };
	}, [id]);

	const endpoint = "/api/choosie/narrow/state";
	if (loading) return <div className="p-8 text-center">Loading...<DiagnosticPanel id={id as string} endpoint={endpoint} apiResponse={rawApiResponse} error={error} /></div>;
	if (error || !data?.state || !data?.items) return <div className="p-8 text-center">Not found<DiagnosticPanel id={id as string} endpoint={endpoint} apiResponse={rawApiResponse} error={error} /></div>;

	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const narrowing = initializeNarrowing(data.items, data.state.plan);

	const handleToggleItem = (itemId: string) => {
		setSelectedIds((prev) =>
			prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
		);
	};

	const handleConfirm = () => {
		// In a real app, submit selection to backend here
		// For now, just reset selection for demo
		setSelectedIds([]);
	};

	return (
		<>
			<DiagnosticPanel id={id as string} endpoint={endpoint} apiResponse={rawApiResponse} error={error} />
			<NarrowingPanel
				items={data.items}
				state={narrowing}
				selectedIds={selectedIds}
				onToggleItem={handleToggleItem}
				onConfirm={handleConfirm}
				mode="in-person"
			/>
		</>
	);
}
