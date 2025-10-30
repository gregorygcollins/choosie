// Spotify API integration for karaoke song search

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  album?: string;
  albumArt?: string;
  releaseYear?: string;
  previewUrl?: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the token (expires in 1 hour, we'll refresh 5 minutes early)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

export async function searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const token = await getAccessToken();

    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: String(limit),
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Spotify search failed:", response.statusText);
      return [];
    }

    const data = await response.json();
    const tracks = data.tracks?.items || [];

    return tracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists?.map((a: any) => a.name) || [],
      album: track.album?.name,
      albumArt: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url,
      releaseYear: track.album?.release_date?.split("-")[0],
      previewUrl: track.preview_url,
    }));
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return [];
  }
}

export async function getTrackById(trackId: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getAccessToken();

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Spotify track fetch failed:", response.statusText);
      return null;
    }

    const track = await response.json();

    return {
      id: track.id,
      name: track.name,
      artists: track.artists?.map((a: any) => a.name) || [],
      album: track.album?.name,
      albumArt: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url,
      releaseYear: track.album?.release_date?.split("-")[0],
      previewUrl: track.preview_url,
    };
  } catch (error) {
    console.error("Error fetching Spotify track:", error);
    return null;
  }
}
