import Link from "next/link";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

const walkthrough = [
  {
    eyebrow: "Build",
    title: "Start with anything worth choosing.",
    body: "Add the options your group is actually considering, then keep the list tidy before anyone votes.",
    phone: <BuildPhone />,
  },
  {
    eyebrow: "Invite",
    title: "Choose how your group narrows.",
    body: "Run it in person, or share a virtual link so everyone can claim a role and take their turn.",
    phone: <InvitePhone />,
  },
  {
    eyebrow: "Narrow",
    title: "Roles keep the decision moving.",
    body: "Programmer, Selector, and Decider steps prevent endless debate and make each round clear.",
    phone: <NarrowPhone />,
  },
  {
    eyebrow: "Decide",
    title: "Land on the shared winner.",
    body: "Choosie celebrates the final pick and gives the Decider a simple way to share it with the group.",
    phone: <WinnerPhone />,
  },
];

export default function Home() {
  return (
    <main className="px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-10 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className={`${pacifico.className} text-6xl leading-relaxed tracking-normal text-brand [text-shadow:_2px_2px_8px_rgba(26,54,93,0.18)] sm:text-7xl`}>
            Choosie
          </h1>
          <div className="flex max-w-xl flex-col gap-4 text-lg font-normal text-slate-600 sm:text-xl">
            <p className="text-lg"><strong>Do only what you love, together.</strong></p>
            <p className="mt-2 text-sm italic text-slate-500"><strong>No scrolling. No bickering. No compromise.</strong></p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/new"
            className="flex h-14 items-center justify-center rounded-full bg-brand px-8 font-semibold text-white shadow-lg shadow-brand/20 transition hover:scale-105 hover:bg-brand-dark active:scale-100"
          >
            Be Choosie!
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl pb-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-consensus">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-brand sm:text-4xl">A cleaner path to a group decision.</h2>
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
        <div className="rounded-lg border border-[#DDE6F3] bg-white px-2 py-2 text-[0.68rem] text-slate-500">Movie night</div>
        {["Past Lives", "Arrival", "Chef"].map((item, index) => (
          <div key={item} className="flex items-center gap-2 rounded-lg bg-white px-2 py-2 shadow-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[0.62rem] font-semibold text-white">{index + 1}</span>
            <span className="text-[0.68rem] font-semibold text-brand">{item}</span>
          </div>
        ))}
        <div className="rounded-full bg-brand px-3 py-2 text-center text-[0.68rem] font-semibold text-white">Create list</div>
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
          <div className="text-[0.72rem] font-bold text-brand">How are you choosing?</div>
          <div className="mt-3 space-y-2">
            <div className="rounded-full bg-brand px-3 py-2 text-center text-[0.65rem] font-semibold text-white">In person</div>
            <div className="rounded-full bg-brand px-3 py-2 text-center text-[0.65rem] font-semibold text-white">Narrow virtually</div>
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
      <div className="space-y-2 p-3">
        <div className="text-[0.82rem] font-bold text-brand">Choosie 3 movies.</div>
        {["Arrival", "Chef", "Past Lives", "Moonstruck"].map((item, index) => {
          const selected = index < 3;
          return (
            <div
              key={item}
              className={`rounded-lg border px-2 py-2 text-[0.66rem] font-semibold ${
                selected ? "border-consensus bg-consensus/10 text-brand" : "border-[#DDE6F3] bg-white text-slate-500"
              }`}
            >
              {item}
            </div>
          );
        })}
        <div className="rounded-full bg-consensus px-3 py-2 text-center text-[0.68rem] font-bold text-brand-dark">Confirm</div>
      </div>
    </PhoneFrame>
  );
}

function WinnerPhone() {
  return (
    <PhoneFrame>
      <PhoneHeader title="Winner" />
      <div className="relative p-3 text-center">
        <div className="absolute left-4 top-8 text-sm text-consensus">✦</div>
        <div className="absolute right-5 top-12 text-sm text-sky-400">✦</div>
        <div className="mx-auto mt-4 grid h-12 w-12 place-items-center rounded-full bg-consensus text-lg shadow-sm">🎉</div>
        <div className="mt-4 text-[0.64rem] font-semibold uppercase tracking-wide text-slate-500">And the winner is...</div>
        <div className="mt-2 text-lg font-bold leading-tight text-brand">Past Lives</div>
        <div className="mx-auto mt-5 w-fit rounded-full bg-consensus px-3 py-2 text-[0.66rem] font-bold text-brand-dark">Share</div>
      </div>
    </PhoneFrame>
  );
}
