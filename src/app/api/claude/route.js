import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Se tiver imagem, comprime o base64 limitando tamanho
    if (body.messages) {
      for (const msg of body.messages) {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'image' && block.source?.data) {
              // Limita base64 a ~1MB (imagens maiores causam erro de memória)
              const maxBase64Length = 1400000;
              if (block.source.data.length > maxBase64Length) {
                block.source.data = block.source.data.substring(0, maxBase64Length);
              }
            }
          }
        }
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        ...body,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
