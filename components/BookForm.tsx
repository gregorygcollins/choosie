"use client";

import { useState, useEffect } from "react";
import type { BookSearchResult } from "../lib/googleBooks";

interface BookFormProps {
  onAddBook: (book: BookSearchResult) => void;
}

export default function BookForm({ onAddBook }: BookFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) {
          throw new Error("Failed to search books");
        }
        const data = await res.json();
        setResults(data.books || []);
      } catch (err) {
        setError("Failed to search books. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books..."
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-100 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center text-sm text-zinc-500">Searching...</div>
      )}

      {results.length > 0 && (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {results.map((book) => (
            <button
              key={book.id}
              onClick={() => {
                onAddBook(book);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full gap-3 rounded-lg border border-zinc-200 p-3 text-left transition-all hover:border-brand hover:bg-brand/5"
            >
              {book.thumbnail && (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="h-20 w-14 flex-shrink-0 rounded object-cover"
                />
              )}
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-zinc-900">{book.title}</div>
                <div className="text-sm text-zinc-600">
                  {book.authors.join(", ")}
                  {book.publishedYear && ` (${book.publishedYear})`}
                </div>
                {book.description && (
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {book.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
