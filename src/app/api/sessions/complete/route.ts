import { NextResponse } from 'next/server';
import { db, sessions, sorts, rankings, definitions, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface ValueDefinition {
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
  userEdited: boolean;
}

interface RequestBody {
  sessionId: string;
  consentResearch: boolean;
  sortedValues: {
    very: string[];
    somewhat: string[];
    less: string[];
  };
  rankedValues: string[];
  transcript?: string;
  definitions: Record<string, ValueDefinition>;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const {
      sessionId,
      consentResearch,
      sortedValues,
      rankedValues,
      transcript,
      definitions: valueDefinitions,
    } = body;

    // Validate required fields
    if (!sessionId || !sortedValues || !rankedValues || !valueDefinitions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if session already exists
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    let dbSessionId: string;

    if (existingSession.length > 0) {
      // Update existing session
      await db
        .update(sessions)
        .set({
          completedAt: new Date(),
          consentResearch,
        })
        .where(eq(sessions.id, sessionId));
      dbSessionId = sessionId;
    } else {
      // Create new session
      const [newSession] = await db
        .insert(sessions)
        .values({
          id: sessionId as `${string}-${string}-${string}-${string}-${string}`,
          completedAt: new Date(),
          consentResearch,
        })
        .returning();
      dbSessionId = newSession.id;
    }

    // Delete existing sorts, rankings, definitions for this session (in case of re-completion)
    await Promise.all([
      db.delete(sorts).where(eq(sorts.sessionId, dbSessionId)),
      db.delete(rankings).where(eq(rankings.sessionId, dbSessionId)),
      db.delete(definitions).where(eq(definitions.sessionId, dbSessionId)),
    ]);

    // Insert all sorts
    const sortInserts = [
      ...sortedValues.very.map((valueName) => ({
        sessionId: dbSessionId,
        valueName,
        category: 'very' as const,
      })),
      ...sortedValues.somewhat.map((valueName) => ({
        sessionId: dbSessionId,
        valueName,
        category: 'somewhat' as const,
      })),
      ...sortedValues.less.map((valueName) => ({
        sessionId: dbSessionId,
        valueName,
        category: 'less' as const,
      })),
    ];

    if (sortInserts.length > 0) {
      await db.insert(sorts).values(sortInserts);
    }

    // Insert rankings
    const rankingInserts = rankedValues.map((valueName, index) => ({
      sessionId: dbSessionId,
      valueName,
      rank: index + 1,
    }));

    if (rankingInserts.length > 0) {
      await db.insert(rankings).values(rankingInserts);
    }

    // Insert definitions for top 3
    const top3Values = rankedValues.slice(0, 3);
    const definitionInserts = top3Values.map((valueName, index) => {
      const def = valueDefinitions[valueName];
      return {
        sessionId: dbSessionId,
        valueName,
        rank: index + 1,
        rawTranscript: index === 0 ? transcript || null : null,
        refinedDefinition: def
          ? {
              tagline: def.tagline,
              definition: def.definition || '',
            }
          : null,
        userEdited: def?.userEdited || false,
      };
    });

    if (definitionInserts.length > 0) {
      await db.insert(definitions).values(definitionInserts);
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.sessionId, dbSessionId))
      .limit(1);

    let profileSlug: string;

    if (existingProfile.length > 0) {
      profileSlug = existingProfile[0].shareSlug!;

      // Update profile
      await db
        .update(profiles)
        .set({
          profileJson: {
            top3: top3Values.map((valueName, index) => ({
              rank: index + 1,
              valueName,
              tagline: valueDefinitions[valueName]?.tagline || '',
              definition: valueDefinitions[valueName]?.definition,
              behavioralAnchors: valueDefinitions[valueName]?.behavioralAnchors,
            })),
            createdAt: new Date().toISOString(),
          },
        })
        .where(eq(profiles.sessionId, dbSessionId));
    } else {
      // Create new profile
      profileSlug = nanoid(10);
      await db.insert(profiles).values({
        sessionId: dbSessionId,
        shareSlug: profileSlug,
        profileJson: {
          top3: top3Values.map((valueName, index) => ({
            rank: index + 1,
            valueName,
            tagline: valueDefinitions[valueName]?.tagline || '',
            definition: valueDefinitions[valueName]?.definition,
            behavioralAnchors: valueDefinitions[valueName]?.behavioralAnchors,
          })),
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: dbSessionId,
      profileSlug,
    });
  } catch (error) {
    console.error('Session completion error:', error);
    return NextResponse.json(
      { error: 'Failed to save session data' },
      { status: 500 }
    );
  }
}
