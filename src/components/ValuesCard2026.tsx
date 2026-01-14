'use client';

import { forwardRef } from 'react';

interface ValueWithDefinition {
  id: string;
  name: string;
  tagline: string;
  definition?: string;
  commitment?: string;
}

type CardFormat = 'index-card' | 'business-card';
type ContentLevel = 'values-only' | 'taglines' | 'commitments';

interface ValuesCard2026Props {
  values: ValueWithDefinition[];
  format: CardFormat;
  contentLevel?: ContentLevel;
  displayName?: string;
  containerWidth: number; // Key prop - determines all sizing
}

// Export dimensions for use in ShareInterface (for hidden export card)
const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  'index-card': { width: 1500, height: 900 },
  'business-card': { width: 1050, height: 600 },
};

// Aspect ratios for calculating height from width
const ASPECT_RATIOS: Record<CardFormat, number> = {
  'index-card': 1500 / 900,     // 1.667
  'business-card': 1050 / 600,  // 1.75
};

// ALL sizes as percentages of containerWidth
// Tuned to FILL the card optimally at each content level
function getSizes(width: number, contentLevel: ContentLevel) {
  const percentages = {
    'values-only': {
      title: 0.035,        // 52.5px at 1500w, 12.25px at 350w
      value: 0.060,        // 90px at 1500w, 21px at 350w
      rank: 0.050,         // 75px at 1500w, 17.5px at 350w
      tagline: 0,
      commitment: 0,
      displayName: 0.030,  // 45px at 1500w
    },
    'taglines': {
      title: 0.030,        // 45px at 1500w
      value: 0.045,        // 67.5px at 1500w
      rank: 0.038,         // 57px at 1500w
      tagline: 0.022,      // 33px at 1500w
      commitment: 0,
      displayName: 0.024,  // 36px at 1500w
    },
    'commitments': {
      title: 0.026,        // 39px at 1500w
      value: 0.035,        // 52.5px at 1500w
      rank: 0.028,         // 42px at 1500w
      tagline: 0.017,      // 25.5px at 1500w
      commitment: 0.016,   // 24px at 1500w
      displayName: 0.019,  // 28.5px at 1500w
    },
  };

  const p = percentages[contentLevel];
  return {
    // Font sizes
    title: width * p.title,
    value: width * p.value,
    rank: width * p.rank,
    tagline: width * p.tagline,
    commitment: width * p.commitment,
    displayName: width * p.displayName,
    // Spacing (also percentage-based)
    gradientBar: width * 0.016,      // 24px at 1500w
    padding: width * 0.032,          // 48px at 1500w
    columnGap: width * 0.016,        // 24px at 1500w
    titleMargin: width * 0.012,      // 18px at 1500w
    valueNameMargin: width * 0.006,  // 9px at 1500w
    taglineMargin: width * 0.006,    // 9px at 1500w
    footerPadding: width * 0.012,    // 18px at 1500w
    dividerMargin: width * 0.008,    // 12px at 1500w
    footer: width * 0.011,           // 16.5px at 1500w
  };
}

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName, containerWidth }, ref) => {
    // Calculate height from containerWidth and aspect ratio
    const aspectRatio = ASPECT_RATIOS[format];
    const height = containerWidth / aspectRatio;

    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    // All sizes calculated from containerWidth using percentages
    const sizes = getSizes(containerWidth, contentLevel);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          width: `${containerWidth}px`,
          height: `${height}px`,
        }}
      >
        {/* Left Prism Gradient Bar */}
        <div
          className="absolute top-0 left-0 bottom-0"
          style={{
            width: `${sizes.gradientBar}px`,
            background: 'linear-gradient(180deg, #8B5CF6, #F97316, #EC4899)',
          }}
        />

        {/* Right Prism Gradient Bar */}
        <div
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: `${sizes.gradientBar}px`,
            background: 'linear-gradient(180deg, #8B5CF6, #F97316, #EC4899)',
          }}
        />

        {/* Content Container */}
        <div
          className="relative h-full flex flex-col"
          style={{
            paddingLeft: `${sizes.gradientBar + sizes.padding}px`,
            paddingRight: `${sizes.gradientBar + sizes.padding}px`,
            paddingTop: `${sizes.padding * 0.6}px`,
            paddingBottom: `${sizes.padding * 0.5}px`,
          }}
        >
          {/* Title Section */}
          <div className="text-center flex-shrink-0" style={{ marginBottom: `${sizes.titleMargin}px` }}>
            {displayName && (
              <p
                className="font-semibold text-prism-purple"
                style={{ fontSize: `${sizes.displayName}px`, marginBottom: `${containerWidth * 0.003}px` }}
              >
                {displayName}
              </p>
            )}
            <h1
              className="font-bold text-brand-900 tracking-wide"
              style={{ fontSize: `${sizes.title}px` }}
            >
              MY VALUES FOR 2026
            </h1>
            <div
              className="w-full bg-gray-200"
              style={{
                height: `${Math.max(1, containerWidth * 0.001)}px`,
                marginTop: `${sizes.dividerMargin}px`
              }}
            />
          </div>

          {/* Values Container - Horizontal 3-column layout */}
          <div className="flex-1 flex flex-row" style={{ gap: `${sizes.columnGap}px` }}>
            {values.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="flex-1 flex flex-col"
                style={{
                  borderRight: index < 2 ? `${Math.max(1, containerWidth * 0.0007)}px solid #e5e7eb` : 'none',
                  paddingRight: index < 2 ? `${sizes.columnGap}px` : '0',
                }}
              >
                {/* Rank + Name */}
                <div className="flex items-center" style={{ gap: `${containerWidth * 0.004}px`, marginBottom: `${sizes.valueNameMargin}px` }}>
                  <span
                    className="font-bold text-prism-coral flex-shrink-0"
                    style={{ fontSize: `${sizes.rank}px` }}
                  >
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span
                    className="font-bold text-brand-900 uppercase tracking-wide"
                    style={{ fontSize: `${sizes.value}px`, lineHeight: 1.1 }}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Tagline - No truncation, let it flow */}
                {showTaglines && item.tagline && (
                  <p
                    className="text-gray-600 italic leading-snug"
                    style={{
                      fontSize: `${sizes.tagline}px`,
                      marginBottom: showCommitments ? `${sizes.taglineMargin}px` : '0',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.tagline}
                  </p>
                )}

                {/* 2026 Commitment - No truncation, let it flow */}
                {showCommitments && item.commitment && (
                  <p
                    className="text-prism-purple font-medium"
                    style={{
                      fontSize: `${sizes.commitment}px`,
                      lineHeight: 1.35,
                    }}
                  >
                    {item.commitment}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center flex-shrink-0" style={{ marginTop: 'auto', paddingTop: `${sizes.footerPadding}px` }}>
            <div
              className="w-full bg-gray-200"
              style={{
                height: `${Math.max(1, containerWidth * 0.001)}px`,
                marginBottom: `${containerWidth * 0.007}px`
              }}
            />
            <span
              className="text-gray-500 font-medium tracking-wide"
              style={{ fontSize: `${sizes.footer}px` }}
            >
              valueslensapp.netlify.app
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ValuesCard2026.displayName = 'ValuesCard2026';

export default ValuesCard2026;

export { DIMENSIONS, ASPECT_RATIOS };
export type { CardFormat, ValueWithDefinition, ContentLevel };
