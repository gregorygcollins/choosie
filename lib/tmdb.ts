export async function searchMovies(query: string) {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) throw new Error("TMDB API key missing");

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
      query
    )}&api_key=${key}`
  );
  if (!res.ok) throw new Error("TMDB request failed");

  const data = await res.json();

  return data.results.map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) || "",
    overview: movie.overview,
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
      : null,
  }));
}

export type DiscoverParams = {
  with_genres?: string; // comma-separated TMDB genre ids
  sort_by?: string; // e.g., 'popularity.desc'
  'vote_average.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
};

export async function discoverMovies(params: DiscoverParams = {}) {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) throw new Error("TMDB API key missing");
  const usp = new URLSearchParams({ api_key: key });
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });
  const url = `https://api.themoviedb.org/3/discover/movie?${usp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB discover failed");
  const data = await res.json();
  return (data.results || []).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) || "",
    overview: movie.overview,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
    vote: movie.vote_average,
    popularity: movie.popularity,
  }));
}

export async function trendingMovies() {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key) throw new Error("TMDB API key missing");
  const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${key}`);
  if (!res.ok) throw new Error("TMDB trending failed");
  const data = await res.json();
  return (data.results || []).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4) || "",
    overview: movie.overview,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
    vote: movie.vote_average,
    popularity: movie.popularity,
  }));
}