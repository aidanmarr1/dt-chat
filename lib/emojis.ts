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

