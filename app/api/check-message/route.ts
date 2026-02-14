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
            content: `You fix spelling AND grammar in chat messages. If the message has no errors, reply with exactly: OK. If it has errors, reply with ONLY the corrected message — no quotes, no explanation, no prefixes, just the fixed text. Fix misspellings, wrong words (there/they're/their, your/you're, no/know, etc.), missing apostrophes, and bad grammar. Keep the casual tone.`,
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
