import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://n8n-automation-test3.iohealth.com/webhook/nlq-marsad/sessions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");
    const deleteSession = searchParams.get("delete");

    let url = API_URL;
    if (sessionId) {
      url = `${API_URL}?id=${sessionId}`;
      if (deleteSession === "true") {
        url += "&delete=true";
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: "Failed to process request" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
