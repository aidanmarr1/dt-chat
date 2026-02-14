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
                  text: `You are a writing assistant for a chat app. Check the following message for spelling errors, grammar mistakes, and rudeness/inappropriate tone.

If the message is fine (no issues), respond with exactly: OK

If there are issues, respond with ONLY the corrected version of the message. Do not add any explanation, prefix, or quotes — just the corrected text.

Message: ${message}`,
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
