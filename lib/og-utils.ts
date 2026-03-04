export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<]+/g;
  const matches = text.match(urlRegex) || [];
  // Strip trailing punctuation that gets captured when URLs appear mid-sentence
  return matches
    .map(url => url.replace(/[.,;:!?)]+$/, ''))
    // Filter out Tenor GIF URLs since those render inline
    .filter((url) => !url.includes("tenor.com/") && !url.includes("media.tenor.com/"));
}

export function isUrlSafe(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    // Block localhost and common metadata endpoints
    if (host === "localhost" || host === "metadata.google.internal") return false;
    // Block any IPv6 address (wrapped in brackets in URLs)
    if (host.startsWith("[") || host.includes(":")) return false;
    // Block private/reserved IPv4 ranges (including decimal/octal/hex representations)
    // First reject anything that looks like a numeric-only hostname (catches 2130706433, 0x7f000001, etc.)
    if (/^[\d.x]+$/i.test(host) || /^0[0-7]/.test(host)) {
      // Only allow standard dotted-decimal with 4 octets
      const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!ipv4) return false; // Not standard dotted-decimal = block
      const [, a, b] = ipv4.map(Number);
      if (a === 10) return false;                      // 10.0.0.0/8
      if (a === 127) return false;                     // 127.0.0.0/8
      if (a === 169 && b === 254) return false;        // 169.254.0.0/16 (link-local / cloud metadata)
      if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
      if (a === 192 && b === 168) return false;        // 192.168.0.0/16
      if (a === 0) return false;                       // 0.0.0.0/8
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchOpenGraph(url: string): Promise<{
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
} | null> {
  if (!isUrlSafe(url)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let currentUrl = url;
    let res: Response | null = null;

    // Follow up to 3 redirects, validating each hop
    for (let i = 0; i < 4; i++) {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const resolved = new URL(location, currentUrl).href;
        if (!isUrlSafe(resolved)) return null;
        currentUrl = resolved;
        continue;
      }
      break;
    }

    clearTimeout(timeout);

    if (!res || !res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();

    // Extract all <meta> tags from the full HTML (sites like YouTube put OG tags 600k+ chars deep)
    const metaTags = html.match(/<meta[^>]*(?:property|name|content)=[^>]*>/gi) || [];
    const metaBlock = metaTags.join("\n");

    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i"
      );
      const match = metaBlock.match(regex);
      return match?.[1] || match?.[2] || undefined;
    };

    const title = getMetaContent("og:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    const description = getMetaContent("og:description") || getMetaContent("description");
    const rawImageUrl = getMetaContent("og:image");
    const siteName = getMetaContent("og:site_name") || getMetaContent("og:sitename");

    if (!title && !description) return null;

    // Validate OG image URL - only allow https URLs that pass safety checks
    let imageUrl: string | undefined;
    if (rawImageUrl) {
      try {
        const imgUrl = new URL(rawImageUrl, currentUrl);
        if (imgUrl.protocol === "https:" && isUrlSafe(imgUrl.href)) {
          imageUrl = imgUrl.href;
        }
      } catch {
        // Invalid image URL, skip it
      }
    }

    return { title, description, imageUrl, siteName };
  } catch {
    return null;
  }
}
