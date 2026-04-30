"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NarrowingPanel } from "@/components/NarrowingPanel";
import { initializeNarrowing } from "@/lib/narrowing";

export default function NarrowPage() {
	const { id } = useParams();
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function fetchData() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/choosie/narrow/state?id=${id}`, { cache: "no-store" });
				if (!res.ok) throw new Error("Not found");
				const json = await res.json();
				if (!cancelled) setData(json);
			} catch (e: any) {
				if (!cancelled) setError("Failed to load narrowing state");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchData();
		return () => { cancelled = true; };
	}, [id]);

	if (loading) return <div className="p-8 text-center">Loading...</div>;
	if (error || !data?.state || !data?.items) return <div className="p-8 text-center">Not found</div>;

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
		<NarrowingPanel
			items={data.items}
			state={narrowing}
			selectedIds={selectedIds}
			onToggleItem={handleToggleItem}
			onConfirm={handleConfirm}
			mode="in-person"
		/>
	);
}
