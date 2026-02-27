import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://n8n-automation-test3.iohealth.com/webhook/nlq-marsad/chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, message, audio } = body;

    if (!session_id || (!message && !audio)) {
      return NextResponse.json(
        { status: "error", message: "Missing session_id or message/audio" },
        { status: 400 },
      );
    }

    const payload: Record<string, string> = { session_id };
    if (audio) {
      payload.audio = audio;
      payload.message = message || "";
    } else {
      payload.message = message;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: "Failed to get response from server" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
