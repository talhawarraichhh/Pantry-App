import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { item } = await req.json();

    if (!item) {
      return NextResponse.json({ error: "Item is required" }, { status: 400 });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "If applicable give a recipe to make the item, keep it short 50 words or less",
        },
        {
          role: "user",
          content: `Give me a recipe using ${item}`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null,
    });

    return NextResponse.json({
      recipe: chatCompletion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}
