"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SharedItem = {
  id: string;
  title: string;
  notes?: string | null;
  image?: string | null;
};

type SharedList = {
  id: string;
  title: string;
  moduleType: string;
  items: SharedItem[];
  winnerItemId?: string | null;
};

function getModuleLabel(module: string) {
  if (module === "books") return "Books";
  if (module === "food") return "Food";
  if (module === "music") return "Music";
  if (module === "anything") return "Anything";
  return "Movies";
}

function getModuleStyle(module: string) {
  if (module === "books") {
    return {
      badge: "bg-blue-100 text-blue-800",
      fallback: "bg-gradient-to-br from-blue-50 via-sky-100 to-slate-300 text-blue-800",
    };
  }

  if (module === "food") {
    return {
      badge: "bg-emerald-100 text-emerald-800",
      fallback: "bg-gradient-to-br from-emerald-50 via-teal-100 to-zinc-500 text-emerald-800",
    };
  }

  if (module === "music") {
    return {
      badge: "bg-violet-100 text-violet-800",
      fallback: "bg-gradient-to-br from-violet-50 via-fuchsia-100 to-zinc-600 text-violet-800",
    };
  }

  if (module === "anything") {
    return {
      badge: "bg-rose-100 text-rose-800",
      fallback: "bg-gradient-to-br from-rose-50 via-pink-100 to-zinc-500 text-rose-800",
    };
  }

  return {
    badge: "bg-consensus/35 text-brand-dark",
    fallback: "bg-gradient-to-br from-brand-light via-consensus/25 to-[#77d7c4] text-brand-dark",
  };
}

function getModuleTheme(module: string) {
  if (module === "books") {
    return {
      pageBg: "bg-gradient-to-b from-blue-50/65 via-white to-white",
      heading: "text-blue-900",
      cta: "bg-blue-600 text-white hover:bg-blue-700",
      toggleActive: "bg-blue-600 text-white shadow",
      toggleInactive: "text-blue-700 hover:bg-blue-50",
      shell: "bg-white border border-blue-100/80",
    };
  }
  if (module === "music") {
    return {
      pageBg: "bg-gradient-to-b from-violet-50/65 via-white to-white",
      heading: "text-violet-900",
      cta: "bg-violet-600 text-white hover:bg-violet-700",
      toggleActive: "bg-violet-600 text-white shadow",
      toggleInactive: "text-violet-700 hover:bg-violet-50",
      shell: "bg-white border border-violet-100/80",
    };
  }
  if (module === "food") {
    return {
      pageBg: "bg-gradient-to-b from-emerald-50/65 via-white to-white",
      heading: "text-emerald-900",
      cta: "bg-emerald-600 text-white hover:bg-emerald-700",
      toggleActive: "bg-emerald-600 text-white shadow",
      toggleInactive: "text-emerald-700 hover:bg-emerald-50",
      shell: "bg-white border border-emerald-100/80",
    };
  }
  if (module === "anything") {
    return {
      pageBg: "bg-gradient-to-b from-rose-50/65 via-white to-white",
      heading: "text-rose-900",
      cta: "bg-rose-600 text-white hover:bg-rose-700",
      toggleActive: "bg-rose-600 text-white shadow",
      toggleInactive: "text-rose-700 hover:bg-rose-50",
      shell: "bg-white border border-rose-100/80",
    };
  }
  return {
    pageBg: "bg-gradient-to-b from-consensus/30 via-white to-white",
    heading: "text-brand",
    cta: "bg-consensus text-brand-dark hover:bg-consensus-dark",
    toggleActive: "bg-consensus text-brand-dark shadow",
    toggleInactive: "text-brand hover:bg-brand-light",
    shell: "bg-white border border-consensus/45",
  };
}

function EmptyImage({ module, label }: { module: string; label: string }) {
  const style = getModuleStyle(module);

  return (
    <div className={["flex h-full w-full flex-col items-center justify-center gap-4 text-center", style.fallback].join(" ")}>
      <svg
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden
      >
        {module === "food" ? (
          <>
            <path d="M4 3v7" />
            <path d="M8 3v7" />
            <path d="M4 7h4" />
            <path d="M6 10v11" />
            <path d="M17 3c1.7 1.7 2.5 3.7 2.5 6 0 2.2-.8 4-2.5 5.5V21" />
          </>
        ) : module === "music" ? (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </>
        ) : module === "anything" ? (
          <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
        ) : module === "books" ? (
          <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
          </>
        ) : (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M7 5v14" />
            <path d="M17 5v14" />
            <path d="M3 9h4" />
            <path d="M17 9h4" />
            <path d="M3 15h4" />
            <path d="M17 15h4" />
          </>
        )}
      </svg>
      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

export default function SharedListClient({ listId, token }: { listId: string; token: string }) {
  const [list, setList] = useState<SharedList | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSharedList() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/choosie/public/getList", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId, token }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !data?.list) {
          throw new Error(data?.error || "This shared list is not available.");
        }
        if (!cancelled) setList(data.list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "This shared list is not available.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSharedList();
    return () => {
      cancelled = true;
    };
  }, [listId, token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-light p-6">
        <p className="text-lg font-semibold text-brand">Loading shared list...</p>
      </main>
    );
  }

  if (error || !list) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-light p-6">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-brand">List unavailable</h1>
          <p className="mt-3 text-sm text-zinc-600">{error || "This share link is invalid or has been turned off."}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Go home
          </Link>
        </section>
      </main>
    );
  }

  const moduleLabel = getModuleLabel(list.moduleType);
  const moduleStyle = getModuleStyle(list.moduleType);
  const moduleTheme = getModuleTheme(list.moduleType);

  return (
    <main className={["min-h-screen p-6 sm:p-8", moduleTheme.pageBg].join(" ")}>
      <section className={["mx-auto", viewMode === "grid" ? "max-w-7xl" : "max-w-4xl"].join(" ")}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-consensus-dark">Shared Choosie list</p>
            <h1 className={["mt-2 text-3xl font-semibold sm:text-4xl", moduleTheme.heading].join(" ")}>{list.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              <span className={["rounded-full px-2.5 py-1 text-xs font-semibold", moduleStyle.badge].join(" ")}>
                {moduleLabel}
              </span>
              <span>{list.items.length} {list.items.length === 1 ? "option" : "options"}</span>
            </div>
          </div>
          <Link
            href="/new"
            className={["inline-flex w-fit rounded-full px-5 py-2 text-sm font-semibold", moduleTheme.cta].join(" ")}
          >
            Create a list
          </Link>
        </div>

        <div className={["rounded-2xl p-6 shadow-soft", moduleTheme.shell].join(" ")}>
          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="List view"
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${viewMode === "list" ? moduleTheme.toggleActive : moduleTheme.toggleInactive}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 0 1 0 2.25H5.625a1.125 1.125 0 0 1 0-2.25Z" />
                </svg>
              </button>
              <button
                type="button"
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${viewMode === "grid" ? moduleTheme.toggleActive : moduleTheme.toggleInactive}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
            <ul className="space-y-4">
              {list.items.map((item, idx) => (
                <li
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
                >
                  <div className="relative h-36 shrink-0 overflow-hidden bg-zinc-100 sm:h-auto sm:w-36">
                    {item.image ? (
                      <img src={item.image} alt="" aria-hidden="true" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <EmptyImage module={list.moduleType} label={moduleLabel} />
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-brand">{item.title}</h2>
                      <span className={["rounded-full px-2 py-0.5 text-xs font-semibold", moduleStyle.badge].join(" ")}>
                        {moduleLabel}
                      </span>
                    </div>
                    {item.notes ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{item.notes}</p>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-zinc-400">No note provided.</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.items.map((item, idx) => (
                <article
                  key={item.id}
                  className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-950 shadow-lg ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
                >
                  {item.image ? (
                    <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <EmptyImage module={list.moduleType} label={moduleLabel} />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5 opacity-90 transition group-hover:opacity-100" />
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                    #{idx + 1}
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 z-10 flex flex-col gap-2 p-4">
                    <span className={["w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold", item.image ? "bg-white/85 text-zinc-900" : moduleStyle.badge].join(" ")}>
                      {moduleLabel}
                    </span>
                    <div>
                      <h2 className="line-clamp-2 text-base font-semibold leading-tight text-white drop-shadow">
                        {item.title}
                      </h2>
                      {item.notes && (
                        <p className="mt-1 truncate text-xs text-white/75">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
