import { ImageResponse } from 'next/og';
import { db, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.shareSlug, slug))
      .limit(1);

    if (!profile || !profile.profileJson) {
      // Return default OG image
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0268A0 0%, #0279AF 50%, #8FD932 100%)',
              padding: 60,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 20,
              }}
            >
              ValuesLens
            </div>
            <div
              style={{
                fontSize: 32,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Discover your core values
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 628,
        }
      );
    }

    const top3 = profile.profileJson.top3;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0268A0 0%, #0279AF 50%, #8FD932 100%)',
            padding: 60,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '0.05em',
              }}
            >
              MY TOP 3 VALUES
            </div>
          </div>

          {/* Value cards - horizontal layout */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              flex: 1,
            }}
          >
            {top3.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                {/* Rank and name */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background:
                        index === 0
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : index === 1
                          ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                          : 'linear-gradient(135deg, #b45309, #92400e)',
                      color: 'white',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#1a1a2e',
                    }}
                  >
                    {item.valueName}
                  </div>
                </div>

                {/* Tagline */}
                <div
                  style={{
                    fontSize: 18,
                    color: '#015E8C',
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{item.tagline}&rdquo;
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 40,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              valueslens.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 628,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);

    // Return fallback image
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0268A0 0%, #0279AF 50%, #8FD932 100%)',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            ValuesLens
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 628,
      }
    );
  }
}
