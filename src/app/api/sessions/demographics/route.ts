import { NextResponse } from 'next/server';
import { db, sessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface RequestBody {
  sessionId: string;
  demographics: {
    ageRange?: string;
    industry?: string;
    leadershipRole?: boolean;
    country?: string;
  };
}

export async function PATCH(request: Request) {
  try {
    const { sessionId, demographics }: RequestBody = await request.json();

    if (!sessionId || !demographics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await db
      .update(sessions)
      .set({ demographics })
      .where(eq(sessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demographics update error:', error);
    return NextResponse.json(
      { error: 'Failed to update demographics' },
      { status: 500 }
    );
  }
}
