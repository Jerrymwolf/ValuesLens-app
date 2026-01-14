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

// Hybrid sizing: percentage-based with minimum floors for readability
// At small widths (preview), minimums ensure readable text
// At large widths (export), percentages fill the card optimally
function getSizes(width: number, contentLevel: ContentLevel) {
  // Font size config: { pct: percentage of width, min: minimum pixels }
  const config = {
    'values-only': {
      title:       { pct: 0.035, min: 14 },  // 52px@1500, 14px min
      value:       { pct: 0.032, min: 14 },  // 48px@1500, 14px min (was 90px)
      rank:        { pct: 0.032, min: 12 },  // 48px@1500, 12px min (was 75px)
      tagline:     { pct: 0, min: 0 },
      commitment:  { pct: 0, min: 0 },
      displayName: { pct: 0.026, min: 12 },  // 39px@1500, 12px min (was 45px)
    },
    'taglines': {
      title:       { pct: 0.030, min: 13 },  // 45px@1500, 13px min
      value:       { pct: 0.045, min: 16 },  // 68px@1500, 16px min
      rank:        { pct: 0.038, min: 14 },  // 57px@1500, 14px min
      tagline:     { pct: 0.022, min: 12 },  // 33px@1500, 12px min
      commitment:  { pct: 0, min: 0 },
      displayName: { pct: 0.024, min: 12 },  // 36px@1500, 12px min
    },
    'commitments': {
      title:       { pct: 0.026, min: 12 },  // 39px@1500, 12px min
      value:       { pct: 0.035, min: 14 },  // 52px@1500, 14px min
      rank:        { pct: 0.028, min: 12 },  // 42px@1500, 12px min
      tagline:     { pct: 0.017, min: 12 },  // 26px@1500, 12px min
      commitment:  { pct: 0.016, min: 12 },  // 24px@1500, 12px min
      displayName: { pct: 0.019, min: 12 },  // 28px@1500, 12px min
    },
  };

  // Spacing config (also with minimums)
  const spacing = {
    gradientBar:     { pct: 0.016, min: 4 },   // 24px@1500, 4px min
    padding:         { pct: 0.032, min: 10 },  // 48px@1500, 10px min
    columnGap:       { pct: 0.016, min: 6 },   // 24px@1500, 6px min
    titleMargin:     { pct: 0.012, min: 4 },   // 18px@1500
    valueNameMargin: { pct: 0.006, min: 3 },   // 9px@1500
    taglineMargin:   { pct: 0.006, min: 3 },   // 9px@1500
    footerPadding:   { pct: 0.012, min: 4 },   // 18px@1500
    dividerMargin:   { pct: 0.008, min: 3 },   // 12px@1500
    footer:          { pct: 0.011, min: 8 },   // 16px@1500
  };

  const c = config[contentLevel];

  // Helper: apply percentage with minimum floor
  const calc = (cfg: { pct: number; min: number }) =>
    Math.max(width * cfg.pct, cfg.min);

  return {
    // Font sizes
    title: calc(c.title),
    value: calc(c.value),
    rank: calc(c.rank),
    tagline: calc(c.tagline),
    commitment: calc(c.commitment),
    displayName: calc(c.displayName),
    // Spacing
    gradientBar: calc(spacing.gradientBar),
    padding: calc(spacing.padding),
    columnGap: calc(spacing.columnGap),
    titleMargin: calc(spacing.titleMargin),
    valueNameMargin: calc(spacing.valueNameMargin),
    taglineMargin: calc(spacing.taglineMargin),
    footerPadding: calc(spacing.footerPadding),
    dividerMargin: calc(spacing.dividerMargin),
    footer: calc(spacing.footer),
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
                    className="font-bold text-brand-900 uppercase tracking-wide break-words"
                    style={{ fontSize: `${sizes.value}px`, lineHeight: 1.1, wordBreak: 'break-word' }}
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
