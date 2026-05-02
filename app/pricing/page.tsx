import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-brand-light ring-1 ring-brand/10">
          <img src="/choosie-logo-badge.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Pro</p>
        <h1 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">Upgrade to Choosie Pro</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Free is perfect for making and using a movie list. Pro is for saving every list your group wants to build.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-xl">
        <article className="rounded-2xl border border-consensus bg-white p-6 shadow-soft ring-2 ring-consensus/30">
          <div className="mb-4 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
            Pro
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-brand">$2.99</span>
            <span className="pb-1 text-sm font-semibold text-slate-500">/mo</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Build a library of saved lists for movies, books, music, meals, trips, gifts, and anything else your group keeps choosing together.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-700">
            <li>Unlimited saved lists across every module</li>
            <li>Movie, book, food, music, and anything lists</li>
            <li>Virtual narrowing links for remote groups</li>
            <li>Newer modules and early features</li>
          </ul>
          <Link
            href="/signup?plan=pro"
            className="mt-6 inline-flex w-full justify-center rounded-full bg-consensus px-4 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-consensus-dark"
          >
            Upgrade
          </Link>
        </article>
      </section>
    </main>
  );
}
