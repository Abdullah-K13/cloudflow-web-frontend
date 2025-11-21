import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, get text instead
      const text = await response.text();
      console.error("Backend returned non-JSON response:", text);
      return NextResponse.json(
        { 
          detail: `Backend error: ${response.status} ${response.statusText}`,
          message: text || "Invalid response from backend"
        },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      // Forward the error details from backend
      return NextResponse.json(
        { 
          detail: data.detail || data.error || data.message || "Google authentication failed",
          message: data.message || data.detail || "Google authentication failed"
        },
        { status: response.status }
      );
    }

    // Return the response from backend
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Google OAuth proxy error:", error);
    return NextResponse.json(
      { 
        detail: error.message || "Internal server error",
        message: error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

