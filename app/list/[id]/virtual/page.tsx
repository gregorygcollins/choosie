"use client";

export default function VirtualInvitesPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Narrow Virtually (coming soon)</h1>
        <p className="text-lg text-zinc-700 mb-6">This feature is coming soon!</p>
        <p className="text-zinc-500 mb-8">We’re working hard to bring virtual narrowing to Choosie. Stay tuned for updates.</p>
        <button
          onClick={() => window.history.back()}
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-colors"
        >
          Back
        </button>
      </div>
    </main>
  );
}
