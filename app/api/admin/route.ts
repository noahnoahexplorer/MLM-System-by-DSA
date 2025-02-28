import { withRoleCheck } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

async function handler() {
  // Admin-only logic here
  return NextResponse.json({ message: 'Admin API accessed successfully' });
}

export const GET = withRoleCheck(handler, ['admin']); 