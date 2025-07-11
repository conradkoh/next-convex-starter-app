import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Google auth test route is working!' });
}
