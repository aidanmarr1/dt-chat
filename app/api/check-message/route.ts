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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // If no API key configured, just pass through
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Fix any spelling or grammar errors in the message below. Rules:
- If the message has NO errors, reply with exactly: OK
- If the message HAS errors, reply with ONLY the fixed message. Nothing else. No quotes, no explanation, no commentary, no prefixes like "Corrected:" — just the raw fixed message text.
- Keep the same tone, slang, and casualness. Only fix actual misspellings and broken grammar.
- Do NOT change intentional abbreviations like "u", "ur", "lol", "brb", etc.
- Do NOT add punctuation to casual chat messages that don't need it.

${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!res.ok) {
      // API error — let the message through
      return NextResponse.json({ ok: true });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!reply || reply === "OK") {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, corrected: reply });
  } catch {
    // On any error, let the message through
    return NextResponse.json({ ok: true });
  }
}
