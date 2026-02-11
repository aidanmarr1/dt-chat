export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
}

export const emojiCategories: EmojiCategory[] = [
  {
    name: "Design",
    icon: "✏️",
    emojis: [
      "✏️", "🖊️", "🖌️", "🖍️", "🎨", "📐", "📏", "✂️", "📝", "🔍",
    ],
  },
  {
    name: "Workshop",
    icon: "🔨",
    emojis: [
      "🔨", "🔧", "🪛", "🪚", "⚙️", "🔩", "🗜️", "🧰", "🛠️", "⛏️",
    ],
  },
  {
    name: "Tech",
    icon: "💻",
    emojis: [
      "💻", "🖥️", "🖨️", "⌨️", "🖱️", "🔌", "🔋", "💾", "📱", "📡",
    ],
  },
  {
    name: "Materials",
    icon: "🪵",
    emojis: [
      "🪵", "🧱", "🪨", "🧵", "🧶", "🔩", "📦", "♻️", "💧", "🔥",
    ],
  },
];

export const quickReactions = [
  "👍", "✅", "❌", "⚠️", "🔍", "💡", "⚙️", "🛠️",
];

export function searchEmojis(query: string): string[] {
  if (!query.trim()) return [];
  const all = emojiCategories.flatMap((c) => c.emojis);
  return all;
}
