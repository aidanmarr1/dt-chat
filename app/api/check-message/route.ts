import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You fix spelling and grammar in chat messages. Rules:
- If the message has NO errors, reply with exactly: OK
- If it HAS errors, reply with ONLY the fixed message. Nothing else. No quotes, no explanation, no prefixes.
- Keep the same tone and casualness. Only fix real misspellings and broken grammar.
- Do NOT change slang or abbreviations like "u", "ur", "lol", "brb", "ngl", etc.
- Do NOT add punctuation that wasn't there.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply || reply === "OK") {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, corrected: reply });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
