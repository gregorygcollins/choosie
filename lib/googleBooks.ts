// Google Books API integration
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "AIzaSyCF60LL9SF1LIOQ9OhLABCIIMRbnnWpQyg";
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
  };
}

export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  publishedYear?: string;
  thumbnail?: string;
  description?: string;
  isbn?: string;
}

export async function searchBooks(query: string, maxResults: number = 20): Promise<BookSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const url = new URL(GOOGLE_BOOKS_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", maxResults.toString());
    url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: GoogleBook) => {
      const { volumeInfo } = item;
      const isbn = volumeInfo.industryIdentifiers?.find(
        (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
      )?.identifier;

      return {
        id: item.id,
        title: volumeInfo.title || "Unknown Title",
        authors: volumeInfo.authors || ["Unknown Author"],
        publishedYear: volumeInfo.publishedDate?.split("-")[0],
        thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
        description: volumeInfo.description,
        isbn,
      };
    });
  } catch (error) {
    console.error("Error searching Google Books:", error);
    throw error;
  }
}

export async function getBookById(bookId: string): Promise<BookSearchResult | null> {
  try {
    const url = `${GOOGLE_BOOKS_BASE_URL}/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const item: GoogleBook = await response.json();
    const { volumeInfo } = item;
    const isbn = volumeInfo.industryIdentifiers?.find(
      (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
    )?.identifier;

    return {
      id: item.id,
      title: volumeInfo.title || "Unknown Title",
      authors: volumeInfo.authors || ["Unknown Author"],
      publishedYear: volumeInfo.publishedDate?.split("-")[0],
      thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
      description: volumeInfo.description,
      isbn,
    };
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    return null;
  }
}
