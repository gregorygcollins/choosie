import Link from "next/link";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

const walkthrough = [
  {
    eyebrow: "Build",
    title: "Make a list.",
    body: <>Add the things <strong>you</strong> want to do with a group of person.</>,
    phone: <BuildPhone />,
  },
  {
    eyebrow: "Invite",
    title: "Invite others.",
    body: "Pass the phone around the room or send out a link.",
    phone: <InvitePhone />,
  },
  {
    eyebrow: "Narrow",
    title: "Start narrowing.",
    body: <>Each person narrows toward what <strong>they</strong> want to do.</>,
    phone: <NarrowPhone />,
  },
  {
    eyebrow: "Decide",
    title: "Uncover the overlap...",
    body: "And enjoy!",
    phone: <WinnerPhone />,
  },
];

export default function Home() {
  return (
    <main className="px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-10 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className="sr-only">Choosie</h1>
          <img
            src="/choosie-wordmark-home.png"
            alt=""
            aria-hidden="true"
            className="h-auto w-full max-w-[34rem] object-contain sm:max-w-[42rem]"
          />
          <div className="flex max-w-xl flex-col gap-4 text-lg font-normal text-slate-600 sm:text-xl">
            <p className="text-lg"><strong>Do only what you love, together.</strong></p>
            <p className="mt-2 text-sm italic text-slate-500"><strong>No scrolling. No bickering. No compromise.</strong></p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/new"
            className="flex h-14 items-center justify-center rounded-full bg-consensus px-8 font-semibold text-brand-dark shadow-lg shadow-consensus/25 transition hover:scale-105 hover:bg-consensus-dark active:scale-100"
          >
            Be Choosie!
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl pb-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">
            Turn reluctant consensus into <span className="text-consensus-dark">passionate overlap.</span>
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {walkthrough.map((step, index) => (
            <article
              key={step.title}
              className="card panel-tier-2 flex min-h-[31rem] flex-col overflow-hidden rounded-2xl bg-white/85 text-left"
            >
              <div className="flex justify-center bg-gradient-to-b from-white to-brand-light px-5 py-6">
                {step.phone}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-consensus text-sm font-bold text-brand-dark">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{step.eyebrow}</span>
                </div>
                <h3 className="text-lg font-bold leading-tight text-brand">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-brand/10 bg-white p-6 text-center shadow-soft">
          <div className="mx-auto mb-3 inline-flex rounded-full bg-consensus/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
            Pro
          </div>
          <h3 className="text-xl font-bold text-brand">Want to choosie more than movies?</h3>
          <p className="mx-auto mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            <span className="block">Free lets you make a movie list. Pro lets you make and save unlimited movie, book, music, food, and anything lists. Perfect for book clubs, karaoke nights, and deciding what or where to eat. Choosie <strong>passionate overlap</strong> every time.</span>
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex rounded-full bg-consensus px-5 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-consensus-dark"
          >
            Explore Pro
          </Link>
        </div>
      </section>
    </main>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[17rem] w-[8.75rem] rounded-[1.65rem] bg-brand p-1.5 shadow-depth">
      <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-brand-dark/70" />
      <div className="h-full overflow-hidden rounded-[1.35rem] bg-[#F8F9FF] pt-5">
        {children}
      </div>
    </div>
  );
}

function PhoneHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-[#DDE6F3] bg-white px-3 pb-2">
      <div className={`${pacifico.className} text-base text-brand`}>Choosie</div>
      <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
    </div>
  );
}

function BuildPhone() {
  return (
    <PhoneFrame>
      <PhoneHeader title="Create list" />
      <div className="space-y-2 p-3">
        <div className="rounded-lg border border-[#DDE6F3] bg-white px-2 py-2 text-[0.68rem] text-slate-500">Thanksgiving watchlist</div>
        <div className="h-[7.35rem] space-y-2 overflow-hidden">
          {["The Odyssey", "Toy Story", "Bridesmaids", "Clueless"].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-consensus bg-consensus/10 px-2 py-1.5 text-[0.66rem] font-semibold text-brand"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

function InvitePhone() {
  return (
    <PhoneFrame>
      <PhoneHeader title="Narrowing" />
      <div className="space-y-3 p-3">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="text-[0.72rem] font-bold text-brand">How are you narrowing?</div>
          <div className="mt-3 space-y-2">
            <div className="rounded-full bg-brand px-3 py-2 text-center text-[0.65rem] font-semibold text-white">In person</div>
            <div className="rounded-full bg-brand px-3 py-2 text-center text-[0.65rem] font-semibold text-white">Virtually</div>
          </div>
        </div>
        <div className="rounded-xl border border-[#DDE6F3] bg-white p-3">
          <div className="text-[0.62rem] uppercase tracking-wide text-slate-500">Share link</div>
          <div className="mt-2 h-2 rounded-full bg-[#DDE6F3]" />
          <div className="mt-1 h-2 w-2/3 rounded-full bg-[#DDE6F3]" />
        </div>
      </div>
    </PhoneFrame>
  );
}

function NarrowPhone() {
  return (
    <PhoneFrame>
      <PhoneHeader title="Selector's turn" />
      <div className="p-3">
        <div className="text-[0.82rem] font-bold text-brand">Choosie 3 movies.</div>
        <div className="mt-2 h-[8.15rem] space-y-2 overflow-hidden">
          {["Out of Africa", "City of God", "Moonstruck", "The Godfather"].map((item) => {
            return (
              <div
                key={item}
                className="rounded-lg border border-consensus bg-consensus/10 px-2 py-1.5 text-[0.66rem] font-semibold text-brand"
              >
                {item}
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 grid h-9 w-9 place-items-center rounded-full bg-consensus text-brand-dark shadow-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </PhoneFrame>
  );
}

function WinnerPhone() {
  return (
    <PhoneFrame>
      <PhoneHeader title="Winner" />
      <div className="relative flex h-[12.4rem] -translate-y-3 flex-col items-center justify-center px-3 py-4 text-center">
        <div className="absolute left-5 top-4 h-1.5 w-1.5 rounded-full bg-consensus" />
        <div className="absolute right-5 top-5 text-xs text-sky-400">✦</div>
        <div className="absolute bottom-12 left-6 text-xs text-consensus-dark">✦</div>
        <div className="relative z-10 text-[0.64rem] font-semibold uppercase tracking-wide text-slate-500">And the winner is...</div>
        <div className="relative z-10 mt-2 text-xl font-bold leading-tight text-brand">The Godfather</div>
        <div className="relative z-0 mt-3 grid h-12 w-12 place-items-center rounded-full bg-consensus text-xl font-bold text-brand-dark shadow-sm">
          <span>🎉</span>
          <span className="absolute -right-2 top-0 text-xs text-sky-400">✦</span>
          <span className="absolute -left-2 bottom-1 h-1.5 w-1.5 rounded-full bg-brand" />
        </div>
      </div>
    </PhoneFrame>
  );
}
