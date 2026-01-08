import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Force dynamic rendering - this page queries the database at runtime
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.shareSlug, slug))
      .limit(1);

    if (!profile || !profile.profileJson) {
      return {
        title: 'Profile Not Found | ValuesLens',
      };
    }

    const top1 = profile.profileJson.top3[0];
    const title = `My #1 Value: ${top1?.valueName} | ValuesLens`;
    const description = `"${top1?.tagline}" - Discover your core values at ValuesLens`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        images: [`/api/og/${slug}`],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og/${slug}`],
      },
    };
  } catch {
    return {
      title: 'ValuesLens',
    };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;

  let profile;
  try {
    const [result] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.shareSlug, slug))
      .limit(1);
    profile = result;
  } catch (error) {
    console.error('Database error:', error);
    notFound();
  }

  if (!profile || !profile.profileJson) {
    notFound();
  }

  const { top3 } = profile.profileJson;

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-600 to-amber-700';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide mb-2">
            MY TOP 3 VALUES
          </h1>
          <p className="text-white/70 text-sm">
            Discover yours at valueslens.com
          </p>
        </div>

        {/* Value cards */}
        <div className="space-y-4 mb-12">
          {top3.map((item, index) => (
            <div
              key={index}
              className="bg-white/95 rounded-xl shadow-lg p-5"
            >
              {/* Rank badge and name */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r ${getRankGradient(
                    item.rank
                  )} text-white font-bold`}
                >
                  {item.rank}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {item.valueName}
                </span>
              </div>

              {/* Tagline */}
              <p className="text-brand-700 font-medium italic text-lg">
                &ldquo;{item.tagline}&rdquo;
              </p>

              {/* Definition */}
              {item.definition && (
                <p className="text-gray-600 mt-3 leading-relaxed">
                  {item.definition}
                </p>
              )}

              {/* Behavioral Anchors */}
              {item.behavioralAnchors && item.behavioralAnchors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">When making decisions:</p>
                  <ul className="space-y-1">
                    {item.behavioralAnchors.slice(0, 3).map((anchor, i) => (
                      <li key={i} className="text-sm text-brand-600 italic">
                        {anchor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-white text-brand-600 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            Discover Your Values
          </Link>
          <p className="text-white/60 text-sm mt-4">
            Free 7-minute assessment
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-white/50 text-sm">valueslens.com</p>
          <a
            href="https://buymeacoffee.com/thew0lf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {/* Coffee icon inline SVG (server-safe) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v2"/>
              <path d="M14 2v2"/>
              <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>
              <path d="M6 2v2"/>
            </svg>
            Support the creator
          </a>
        </div>
      </div>
    </div>
  );
}
