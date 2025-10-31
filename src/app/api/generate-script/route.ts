import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

const API_URL = 'https://sb-u864.onrender.com/generate-script';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authHeader = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API Error:', errorText); // Log the full error
      let errorMessage = 'Failed to generate script due to an external API error.';
      try {
        const errorJson = JSON.parse(errorText);
        // Prefer a more specific error message if available
        errorMessage = errorJson.detail || errorJson.error || errorMessage;
      } catch {
        // If the error is not JSON, use the raw text if it's not too long
        if (errorText.length < 500) {
          errorMessage = errorText;
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
