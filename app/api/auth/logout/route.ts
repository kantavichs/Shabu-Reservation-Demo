// File: app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Clear Cookie (Example - depends on how you set the cookie)
    // You might need to set the cookie with Max-Age=0 or Expires in the past

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
