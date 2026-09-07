import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'GRAVOZ Storefront Frontend API',
    timestamp: new Date().toISOString(),
  });
}
