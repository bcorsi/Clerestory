import { NextResponse } from 'next/server';

export async function GET(request) {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return NextResponse.json({ error: 'GOOGLE_MAPS_KEY not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=18&size=640x400&maptype=satellite&key=${key}`;
  
  return NextResponse.json({ url });
}
