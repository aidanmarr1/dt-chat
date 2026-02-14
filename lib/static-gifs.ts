// Hand-picked GIF library for D&T Chat
// All GIFs sourced from Giphy's public CDN

export interface StaticGif {
  id: string;
  title: string;
  tags: string[];
  category: string;
  preview: string;
  url: string;
  width: number;
  height: number;
}

function gif(id: string, title: string, tags: string[]): StaticGif {
  return {
    id,
    title,
    tags,
    category: "All",
    preview: `https://media.giphy.com/media/${id}/200w.gif`,
    url: `https://media.giphy.com/media/${id}/giphy.gif`,
    width: 200,
    height: 200,
  };
}

export const CATEGORIES = ["All"] as const;

export type Category = (typeof CATEGORIES)[number];

export const GIF_LIBRARY: StaticGif[] = [
  gif("PSmdtiaq55XECrAREF", "GIF 1", ["reaction", "response"]),
  gif("9yb8chZaCeXezI9WBy", "GIF 2", ["reaction", "response"]),
  gif("WPZtLOs089PjwTgzaU", "GIF 3", ["reaction", "response"]),
  gif("hcXkLPGzssDZrLwlFX", "GIF 4", ["reaction", "response"]),
  gif("QLwj7f0rHASDfag3E3", "GIF 5", ["reaction", "response"]),
  gif("0NYGiq0lZeiV4B3S3R", "GIF 6", ["reaction", "response"]),
  gif("2uEFw9d8haFdufRAhH", "GIF 7", ["reaction", "response"]),
  gif("Ee1mckycOyXBSKo82G", "GIF 8", ["reaction", "response"]),
  gif("ZAfV0mibUi1TDo2QEV", "GIF 9", ["reaction", "response"]),
  gif("na4b2WyQDuamZEoV6v", "GIF 10", ["reaction", "response"]),
  gif("BB9Mz3PDDAmGFZjHRd", "GIF 11", ["reaction", "response"]),
  gif("JVJEQrf8HsgFt9yM88", "GIF 12", ["reaction", "response"]),
  gif("lcrHCIpEAJRy6wTwxl", "GIF 13", ["reaction", "response"]),
  gif("lgRPue6jqdfv5TTRJG", "GIF 14", ["reaction", "response"]),
  gif("yourSU5awDfx6a7zFY", "GIF 15", ["reaction", "response"]),
  gif("Z7kSRnErqNfx4yVl0k", "GIF 16", ["reaction", "response"]),
  gif("71ChNt0AYKWz9juZsL", "GIF 17", ["reaction", "response"]),
  gif("LYisJbvOeEEXCkk5zn", "GIF 18", ["reaction", "response"]),
  gif("ZYVDfzsK1Xg2yKIRS9", "GIF 19", ["reaction", "response"]),
  gif("YwHteeSUH6mzW7Gjqg", "GIF 20", ["reaction", "response"]),
  gif("vcjoDECCxV8sbD8nNv", "GIF 21", ["reaction", "response"]),
  gif("2brPOThdZ2P9x9OdBR", "GIF 22", ["reaction", "response"]),
  gif("bm4isQOlV13W6Ogx9b", "GIF 23", ["reaction", "response"]),
];

/** All unique categories in the library */
export function getCategories(): string[] {
  return [...CATEGORIES];
}

/** Get GIFs, optionally filtered by search query and/or category */
export function searchGifs(query?: string, category?: string): StaticGif[] {
  let results = GIF_LIBRARY;

  if (category && category !== "All") {
    results = results.filter((g) => g.category === category);
  }

  if (query) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.tags.some((t) => t.includes(q))
    );
  }

  return results;
}
