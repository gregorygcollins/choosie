import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Choosie. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-zinc-600 hover:text-zinc-900 transition-colors">
              Terms
            </Link>
            <a 
              href="mailto:hello@choosie.app" 
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
