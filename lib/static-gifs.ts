// Curated static GIF library for D&T Chat
// All GIFs sourced from Giphy's public CDN (designed for embedding)

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

function gif(id: string, title: string, category: string, tags: string[]): StaticGif {
  return {
    id,
    title,
    tags: [...tags, category.toLowerCase()],
    category,
    preview: `https://media.giphy.com/media/${id}/200w.gif`,
    url: `https://media.giphy.com/media/${id}/giphy.gif`,
    width: 200,
    height: 200,
  };
}

export const CATEGORIES = [
  "All",
  "Reactions",
  "Funny",
  "Greetings",
  "Moods",
  "Party",
  "School",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const GIF_LIBRARY: StaticGif[] = [
  // ── Thumbs Up / Approval ──────────────────────────────────
  gif("iZbdDeGuIV0ZadYU7P", "Cartoon Thumbs Up", "Reactions", ["thumbs up", "approve", "yes", "good", "ok", "nice"]),
  gif("3o7abGQa0aRJUurpII", "Thumbs Up Animated", "Reactions", ["thumbs up", "approve", "great", "yes"]),
  gif("v9lMtd3uRbjWfz7Ppt", "Big Thumbs Up", "Reactions", ["thumbs up", "approve", "awesome"]),
  gif("VveUqz8KXwtTriXLHK", "Enthusiastic Thumbs Up", "Reactions", ["thumbs up", "yes", "approve", "love it"]),
  gif("3o7abKhOpu0NwenH3O", "Double Thumbs Up", "Reactions", ["thumbs up", "approve", "great job"]),
  gif("111ebonMs90YLu", "Thumbs Up Classic", "Reactions", ["thumbs up", "yes", "ok", "approve"]),
  gif("tIeCLkB8geYtW", "Cool Thumbs Up", "Reactions", ["thumbs up", "cool", "nice", "approve"]),
  gif("xT9DPvwdqWgLGeTTmE", "Cartoon Approve", "Reactions", ["thumbs up", "approve", "cartoon"]),

  // ── Laughing / Funny ──────────────────────────────────────
  gif("dtGIRL0FDp6nnOPGb5", "Cartoon Laughing", "Funny", ["laugh", "funny", "lol", "haha"]),
  gif("fUYhyT9IjftxrxJXcE", "Laughing Hard", "Funny", ["laugh", "funny", "lol", "rofl"]),
  gif("v2WITHMTmdIA0", "Can't Stop Laughing", "Funny", ["laugh", "funny", "haha", "lol"]),
  gif("1ZbnufnHeW0W4", "Rolling Laughing", "Funny", ["laugh", "funny", "rofl", "lmao"]),
  gif("11caEgnSDg0avS", "Giggling", "Funny", ["laugh", "giggle", "funny", "cute"]),
  gif("GpyS1lJXJYupG", "LOL", "Funny", ["laugh", "lol", "funny", "haha"]),
  gif("8JoGhnd5OJD5YDn76f", "Cracking Up", "Funny", ["laugh", "funny", "crack up", "haha"]),
  gif("l0ExayQDzrI2xOb8A", "Laugh Out Loud", "Funny", ["laugh", "loud", "funny", "lol"]),
  gif("yxtaHAcyHCE5lGSaqk", "Cartoon LOL", "Funny", ["laugh", "lol", "cartoon", "funny"]),

  // ── Wave / Hello / Goodbye ────────────────────────────────
  gif("8LVSoumYDFdo9jNEKs", "Cartoon Wave", "Greetings", ["wave", "hello", "hi", "hey"]),
  gif("tuvMgAPzxaQBq", "Friendly Wave", "Greetings", ["wave", "hello", "hi", "friendly"]),
  gif("xT9IgG50Fb7Mi0prBC", "Big Hello Wave", "Greetings", ["wave", "hello", "hi", "hey"]),
  gif("noyBeNjH4nbtXV5ZLA", "Cute Hello", "Greetings", ["hello", "hi", "cute", "wave"]),
  gif("IThjAlJnD9WNO", "Hello There", "Greetings", ["hello", "hi", "wave", "greeting"]),
  gif("0vcCfc5y3MXCHzpzRw", "Wave Hi", "Greetings", ["wave", "hi", "hello"]),
  gif("kaBU6pgv0OsPHz2yxy", "Goodbye Wave", "Greetings", ["goodbye", "bye", "wave", "see ya"]),
  gif("jUwpNzg9IcyrK", "Bye Bye", "Greetings", ["goodbye", "bye", "wave", "later"]),
  gif("LTFbyWuELIlqlXGLeZ", "See You Later", "Greetings", ["goodbye", "bye", "later", "see ya"]),

  // ── Happy / Excited ───────────────────────────────────────
  gif("108M7gCS1JSoO4", "Cartoon Happy", "Moods", ["happy", "excited", "joy", "yay"]),
  gif("d2ItDZZumUI6Y", "Super Happy", "Moods", ["happy", "excited", "joy", "cheerful"]),
  gif("YHO5djy6ZEXWU", "Happy Dance", "Moods", ["happy", "dance", "excited", "joy"]),
  gif("dvdcBNbAiNVT9Z0iwP", "Jumping Happy", "Moods", ["happy", "jumping", "excited", "yay"]),
  gif("EkPicGgIeyNAQ", "Cheerful", "Moods", ["happy", "cheerful", "joy", "smile"]),
  gif("7eAvzJ0SBBzHy", "Cartoon Excited", "Moods", ["excited", "happy", "cartoon", "wow"]),
  gif("Px2Zu55ofxfO0", "So Excited", "Moods", ["excited", "happy", "can't wait", "yay"]),
  gif("zetsDd1oSNd96", "Excited Bounce", "Moods", ["excited", "happy", "bounce", "yay"]),

  // ── Sad / Crying ──────────────────────────────────────────
  gif("qQdL532ZANbjy", "Cartoon Crying", "Moods", ["sad", "cry", "tears", "upset"]),
  gif("YyECUhkxzUTDI0I5bx", "So Sad", "Moods", ["sad", "cry", "upset", "tears"]),
  gif("GGcRBaRwdtmhNvLchh", "Cartoon Sad", "Moods", ["sad", "cartoon", "cry", "upset"]),
  gif("aFvULnr3fCDrW", "Crying Face", "Moods", ["cry", "sad", "tears", "upset"]),
  gif("9JLOGsEfPjpR1179HE", "Sad Tears", "Moods", ["sad", "tears", "cry"]),
  gif("bNMCo9ToYZoPK", "Boo Hoo", "Moods", ["sad", "cry", "boo hoo", "upset"]),
  gif("q2qxiBO5prG9i", "Feeling Sad", "Moods", ["sad", "feeling", "down", "blue"]),
  gif("mBaNKEmk9SUKs", "So Emotional", "Moods", ["sad", "emotional", "cry", "tears"]),

  // ── Thinking / Confused ───────────────────────────────────
  gif("d3mlE7uhX8KFgEmY", "Thinking Hard", "Reactions", ["think", "thinking", "hmm", "wonder"]),
  gif("a5viI92PAF89q", "Deep Thought", "Reactions", ["think", "thinking", "deep", "hmm"]),
  gif("CaiVJuZGvR8HK", "Confused Thinking", "Reactions", ["think", "confused", "hmm", "what"]),
  gif("lKXEBR8m1jWso", "Brain Working", "Reactions", ["think", "brain", "working", "hmm"]),
  gif("kPtv3UIPrv36cjxqLs", "Let Me Think", "Reactions", ["think", "wait", "hmm", "idea"]),
  gif("3oFzmmhQR6fi2iC7hm", "Cartoon Confused", "Reactions", ["confused", "what", "huh", "cartoon"]),
  gif("3oFzmerJ9kykSR92jm", "Very Confused", "Reactions", ["confused", "what", "huh", "lost"]),
  gif("nCDrmSFrCpPUI", "So Confused", "Reactions", ["confused", "what", "lost", "huh"]),

  // ── Facepalm / Eye Roll ───────────────────────────────────
  gif("XD4qHZpkyUFfq", "Facepalm", "Reactions", ["facepalm", "smh", "really", "ugh"]),
  gif("Ra1bmpxpsppNC", "Major Facepalm", "Reactions", ["facepalm", "smh", "oh no"]),
  gif("vwI4mYEHP8k0w", "Face Palm", "Reactions", ["facepalm", "disappointed", "smh"]),
  gif("WrP4rFrWxu4IE", "Double Facepalm", "Reactions", ["facepalm", "smh", "really"]),
  gif("AjYsTtVxEEBPO", "Cartoon Facepalm", "Reactions", ["facepalm", "cartoon", "smh"]),
  gif("B4ORVnBvJCVvq", "Eye Roll", "Reactions", ["eye roll", "whatever", "sure", "ugh"]),
  gif("Rhhr8D5mKSX7O", "Rolling Eyes", "Reactions", ["eye roll", "whatever", "bored"]),
  gif("eUrE2DuMKOE0g", "Big Eye Roll", "Reactions", ["eye roll", "whatever", "really"]),

  // ── Celebration / Dancing ─────────────────────────────────
  gif("l4KhWPNyLHiB3TjVe", "Celebration", "Party", ["celebrate", "party", "yay", "confetti"]),
  gif("ddHhhUBn25cuQ", "Party Time", "Party", ["party", "celebrate", "dance", "fun"]),
  gif("bIEzoZX0qJaG6s6frc", "Confetti", "Party", ["confetti", "celebrate", "party", "yay"]),
  gif("vmon3eAOp1WfK", "Woohoo", "Party", ["celebrate", "woohoo", "party", "excited"]),
  gif("blSTtZehjAZ8I", "Happy Dance", "Party", ["dance", "happy", "celebrate", "move"]),
  gif("13hxeOYjoTWtK8", "Dance Moves", "Party", ["dance", "moves", "groove", "fun"]),
  gif("K3Sbp8fOgKye4", "Dance Party", "Party", ["dance", "party", "fun", "groove"]),
  gif("o5srM4M3BTVfD7WQOt", "Victory Dance", "Party", ["dance", "victory", "win", "celebrate"]),
  gif("pAHAgWYYjWIE9DNLcC", "Groovy Dance", "Party", ["dance", "groovy", "fun", "party"]),

  // ── Mind Blown / Shocked ──────────────────────────────────
  gif("26ufdipQqU2lhNA4g", "Mind Blown", "Reactions", ["mind blown", "shocked", "whoa", "wow"]),
  gif("75ZaxapnyMp2w", "Explosion Mind", "Reactions", ["mind blown", "shocked", "whoa"]),
  gif("OK27wINdQS5YQ", "Brain Explode", "Reactions", ["mind blown", "brain", "shocked"]),
  gif("5VKbvrjxpVJCM", "Shocked Face", "Reactions", ["shocked", "surprised", "gasp", "omg"]),
  gif("OwXMyUBbXezpG75UTR", "So Shocked", "Reactions", ["shocked", "surprised", "omg"]),
  gif("ie4fEHT4krdDO", "Cartoon Shocked", "Reactions", ["shocked", "surprised", "cartoon"]),
  gif("1L5YuA6wpKkNO", "Whoa", "Reactions", ["whoa", "shocked", "surprised", "mind blown"]),

  // ── Good Job / Clapping ───────────────────────────────────
  gif("8ZblO3ZD5NMltPaFS2", "Good Job", "Reactions", ["good job", "well done", "nice", "bravo"]),
  gif("ely3apij36BJhoZ234", "Nice Work", "Reactions", ["good job", "nice work", "well done"]),
  gif("lFHtqqh6orvAhbiGmy", "Well Done", "Reactions", ["well done", "good job", "bravo"]),
  gif("kBZBlLVlfECvOQAVno", "Great Work", "Reactions", ["great", "good job", "awesome", "well done"]),
  gif("YRuFixSNWFVcXaxpmX", "Clapping", "Reactions", ["clap", "applause", "bravo", "good job"]),
  gif("31lPv5L3aIvTi", "Round of Applause", "Reactions", ["clap", "applause", "bravo"]),
  gif("doUu2ByZDbPYQ", "Slow Clap", "Reactions", ["clap", "slow clap", "bravo", "nice"]),
  gif("utAO8tteQGG2zGh9ic", "Bravo", "Reactions", ["bravo", "clap", "good job", "awesome"]),

  // ── Angry ─────────────────────────────────────────────────
  gif("lnBuZsAZ1wN3i", "Angry", "Moods", ["angry", "mad", "furious", "rage"]),
  gif("y1WDIwAZRSmru", "So Angry", "Moods", ["angry", "mad", "furious"]),
  gif("ZebTmyvw85gnm", "Cartoon Angry", "Moods", ["angry", "mad", "cartoon", "rage"]),
  gif("l1J9u3TZfpmeDLkD6", "Fuming", "Moods", ["angry", "fuming", "mad", "steam"]),
  gif("m8fyrgnXwXV5EHw6Lm", "Rage", "Moods", ["angry", "rage", "mad", "furious"]),

  // ── Deal With It / Cool ───────────────────────────────────
  gif("ZhmPbrADKRMuA", "Deal With It", "Funny", ["deal with it", "cool", "sunglasses"]),
  gif("R9cQo06nQBpRe", "Putting On Shades", "Funny", ["deal with it", "sunglasses", "cool"]),
  gif("BxmZYHS3WTpNS", "Cool Shades", "Funny", ["cool", "sunglasses", "deal with it"]),
  gif("Oa5op39YNH8QMAaEco", "Cartoon Cool", "Funny", ["cool", "cartoon", "awesome", "chill"]),
  gif("oKfcwzvTAL21n76QQh", "Too Cool", "Funny", ["cool", "too cool", "chill", "awesome"]),

  // ── High Five / Teamwork ──────────────────────────────────
  gif("WKdPOVCG5LPaM", "High Five", "Reactions", ["high five", "teamwork", "team", "friends"]),
  gif("s4VoCsFz8prlhSFCeS", "Epic High Five", "Reactions", ["high five", "epic", "teamwork"]),
  gif("5wWf7GW1AzV6pF3MaVW", "Team High Five", "Reactions", ["high five", "team", "together"]),
  gif("CW27AW0nlp5u0", "Teamwork", "Reactions", ["teamwork", "team", "together", "high five"]),

  // ── Studying / School ─────────────────────────────────────
  gif("vtFZ8O85q8g3MmXK51", "Studying Hard", "School", ["study", "studying", "school", "homework"]),
  gif("IPbS5R4fSUl5S", "Study Time", "School", ["study", "school", "homework", "books"]),
  gif("1hXY6iNdTFpTW4je85", "Doing Homework", "School", ["homework", "study", "school", "work"]),
  gif("fhAwk4DnqNgw8", "Study Mode", "School", ["study", "school", "focus", "homework"]),
  gif("WRQBXSCnEFJIuxktnw", "Big Brain Time", "School", ["brain", "smart", "thinking", "genius"]),
  gif("Hj7SSRD2lAeQ0", "Nerd Alert", "School", ["nerd", "smart", "glasses", "study"]),

  // ── Love / Heart ──────────────────────────────────────────
  gif("AQ7GWTm9iBxaU", "Cartoon Love", "Moods", ["love", "heart", "cute", "aww"]),
  gif("xinfnjlS9oOcTB62pd", "Heart Eyes", "Moods", ["love", "heart", "eyes", "cute"]),
  gif("LeAvvCD0YncNG", "Sending Love", "Moods", ["love", "heart", "send", "cute"]),
  gif("hxERQNWQudqSF1iDnr", "So Much Love", "Moods", ["love", "heart", "lots", "cute"]),

  // ── Bored / Sleepy ────────────────────────────────────────
  gif("P53TSsopKicrm", "Bored", "Moods", ["bored", "boring", "meh", "whatever"]),
  gif("Ty9Sg8oHghPWg", "So Bored", "Moods", ["bored", "boring", "meh", "sleepy"]),
  gif("l22ysLe54hZP0wubek", "Bored to Death", "Moods", ["bored", "sleepy", "tired"]),
  gif("fhLgA6nJec3Cw", "Yawning", "Moods", ["yawn", "sleepy", "tired", "bored"]),

  // ── Yes / No ──────────────────────────────────────────────
  gif("Jz4ijKk1eoIKvPqNq0", "Yes!", "Reactions", ["yes", "yeah", "yep", "approve", "agree"]),
  gif("ppCGsUCJhHVUZ9j8CN", "Oh Yeah", "Reactions", ["yes", "oh yeah", "definitely"]),
  gif("AWdSeBQgIwFj2r8JwJ", "Nodding Yes", "Reactions", ["yes", "nod", "agree", "yep"]),
  gif("3o7absbD7PbTFQa0c8", "Absolutely", "Reactions", ["yes", "absolutely", "definitely"]),
  gif("EPcvhM28ER9XW", "Nope", "Funny", ["no", "nope", "nah", "refuse"]),
  gif("GjR6RPcURgiL6", "No Way", "Funny", ["no", "no way", "nah", "refuse"]),
];

/** All unique categories in the library */
export function getCategories(): string[] {
  return [...CATEGORIES];
}

/** Get GIFs, optionally filtered by search query and/or category */
export function searchGifs(query?: string, category?: string): StaticGif[] {
  let results = GIF_LIBRARY;

  // Filter by category
  if (category && category !== "All") {
    results = results.filter((g) => g.category === category);
  }

  // Filter by search query (match against title and tags)
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
