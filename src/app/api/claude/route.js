import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured',
        detail: 'ANTHROPIC_API_KEY não configurada no Vercel'
      }, { status: 500 });
    }

    // Comprime imagens grandes antes de enviar
    if (body.messages) {
      for (const msg of body.messages) {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'image' && block.source?.data) {
              const maxLen = 1200000;
              if (block.source.data.length > maxLen) {
                block.source.data = block.source.data.substring(0, maxLen);
              }
              // Força sempre jpeg
              block.source.media_type = 'image/jpeg';
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
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        ...body,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return NextResponse.json({ 
        error: `Anthropic API error: ${response.status}`,
        detail: errText
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Route error:', error.message);
    return NextResponse.json({ 
      error: error.message,
      detail: 'Erro interno na rota /api/claude'
    }, { status: 500 });
  }
}
