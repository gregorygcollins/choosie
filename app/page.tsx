import Link from "next/link";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-brand-light px-6 dark:from-zinc-900 dark:to-black">
      <main className="flex flex-col items-center gap-12 text-center">
        {/* Brand and taglines */}
        <div className="flex flex-col items-center gap-6">
          <h1 className={`${pacifico.className} text-6xl leading-relaxed tracking-normal text-brand [text-shadow:_2px_2px_8px_rgba(74,85,104,0.3)] sm:text-7xl`}>
            Choosie
          </h1>
          <div className="flex flex-col gap-4 text-lg font-normal text-zinc-600 dark:text-zinc-300 sm:text-xl max-w-xl">
            <p className="text-lg"><strong>Do only what you love — together.</strong></p>
            <p className="mt-2 text-sm italic text-zinc-500"><strong>No scrolling. No bickering. No compromise.</strong></p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/new"
            className="flex h-14 items-center justify-center rounded-full bg-brand px-8 font-semibold text-white shadow-lg shadow-brand/20 transition hover:scale-105 hover:bg-brand-dark active:scale-100 dark:shadow-brand/40"
          >
            be choosie!
          </Link>
        </div>
      </main>
    </div>
  );
}
