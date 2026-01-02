// app/api/annict/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ANNICT_API = 'https://api.annict.com/graphql';
const ANNICT_TOKEN = process.env.ANNICT_TOKEN;

export async function POST(request: NextRequest) {
  if (!ANNICT_TOKEN) {
    return NextResponse.json(
      { error: 'Annict API token is not configured' },
      { status: 500 }
    );
  }

  try {
    const { query, variables } = await request.json();

    const response = await fetch(ANNICT_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANNICT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Annict API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Annict API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

