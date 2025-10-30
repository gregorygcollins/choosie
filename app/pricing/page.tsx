export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-brand-light p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white/80 p-6">
        <h1 className="text-3xl font-bold">Choosie Pro</h1>
        <p className="mt-2 text-zinc-700">Upgrade for premium modules and smarter suggestions.</p>
        <ul className="mt-4 list-disc list-inside text-zinc-800">
          <li>Books, Recipes, and Anything modules</li>
          <li>Advanced suggestions and filtering</li>
          <li>Priority improvements</li>
        </ul>
        <div className="mt-6">
          <a href="/account" className="rounded-full bg-amber-300 px-4 py-2 font-semibold text-black">Upgrade on Account</a>
        </div>
      </div>
    </main>
  );
}
