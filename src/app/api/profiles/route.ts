import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { VALUES_BY_ID } from '@/lib/data/values';
import { getFallbackTagline } from '@/lib/data/fallbackTaglines';

interface ValueDefinition {
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
  userEdited: boolean;
}

interface RequestBody {
  sessionId: string;
  rankedValues: string[];
  definitions: Record<string, ValueDefinition>;
}

// POST: Create a new profile
export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { sessionId, rankedValues, definitions } = body;

    if (!sessionId || !rankedValues || rankedValues.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique, URL-safe slug
    const shareSlug = nanoid(10);

    // Build profile JSON
    const top3 = rankedValues.slice(0, 3).map((id, index) => {
      const value = VALUES_BY_ID[id];
      const def = definitions[id];
      return {
        rank: index + 1,
        valueName: value?.name || id,
        tagline: def?.tagline || getFallbackTagline(value?.name || ''),
        definition: def?.definition,
        behavioralAnchors: def?.behavioralAnchors,
      };
    });

    // Try to insert or update profile
    try {
      // Check if profile already exists for this session
      const existingProfile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.sessionId, sessionId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Return existing profile slug
        return NextResponse.json({
          slug: existingProfile[0].shareSlug,
          url: `/p/${existingProfile[0].shareSlug}`,
          existing: true,
        });
      }

      // Create new profile
      const [newProfile] = await db
        .insert(profiles)
        .values({
          sessionId,
          shareSlug,
          profileJson: {
            top3,
            createdAt: new Date().toISOString(),
          },
        })
        .returning();

      return NextResponse.json({
        slug: newProfile.shareSlug,
        url: `/p/${newProfile.shareSlug}`,
      });
    } catch (dbError) {
      // If DB fails, return a client-only slug
      console.error('Database error:', dbError);
      return NextResponse.json({
        slug: shareSlug,
        url: `/p/${shareSlug}`,
        clientOnly: true,
      });
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

// GET: Retrieve a profile by slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.shareSlug, slug))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug: profile.shareSlug,
      profile: profile.profileJson,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
