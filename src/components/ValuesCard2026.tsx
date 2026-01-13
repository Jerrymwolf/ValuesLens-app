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
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  'index-card': { width: 1500, height: 900 },
  'business-card': { width: 1050, height: 600 },
};

// Font sizes scale proportionally to card width
// Base sizes are for 1500px (index card), business card scales at 0.7
function getSizesForCard(
  format: CardFormat,
  contentLevel: ContentLevel
): { title: number; value: number; tagline: number; commitment: number; rank: number; displayName: number } {
  const { width } = DIMENSIONS[format];
  const scale = width / 1500;

  // Larger base sizes to fill the card better
  const baseSizes = {
    'values-only': {
      title: 52,
      value: 64,
      tagline: 0,
      commitment: 0,
      rank: 56,
      displayName: 44,
    },
    'taglines': {
      title: 44,
      value: 48,
      tagline: 28,
      commitment: 0,
      rank: 40,
      displayName: 36,
    },
    'commitments': {
      title: 36,
      value: 40,
      tagline: 20,
      commitment: 18,
      rank: 32,
      displayName: 28,
    },
  };

  const base = baseSizes[contentLevel];
  return {
    title: Math.round(base.title * scale),
    value: Math.round(base.value * scale),
    tagline: Math.round(base.tagline * scale),
    commitment: Math.round(base.commitment * scale),
    rank: Math.round(base.rank * scale),
    displayName: Math.round(base.displayName * scale),
  };
}

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName }, ref) => {
    const { width, height } = DIMENSIONS[format];

    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    const sizes = getSizesForCard(format, contentLevel);

    // Proportional sizing based on card dimensions
    const gradientBarWidth = Math.round(24 * (width / 1500));
    const contentPadding = Math.round(32 * (width / 1500));
    const verticalPaddingTop = Math.round(28 * (height / 900));
    const verticalPaddingBottom = Math.round(24 * (height / 900));
    const columnGap = Math.round(24 * (width / 1500));
    const titleMarginBottom = Math.round(16 * (height / 900));
    const valueNameMarginBottom = Math.round(8 * (height / 900));
    const taglineMarginBottom = Math.round(8 * (height / 900));
    const footerPaddingTop = Math.round(16 * (height / 900));
    const dividerMargin = Math.round(12 * (height / 900));
    const footerFontSize = Math.round(16 * (width / 1500));

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Left Prism Gradient Bar */}
        <div
          className="absolute top-0 left-0 bottom-0"
          style={{
            width: `${gradientBarWidth}px`,
            background: 'linear-gradient(180deg, #8B5CF6, #F97316, #EC4899)',
          }}
        />

        {/* Right Prism Gradient Bar */}
        <div
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: `${gradientBarWidth}px`,
            background: 'linear-gradient(180deg, #8B5CF6, #F97316, #EC4899)',
          }}
        />

        {/* Content Container */}
        <div
          className="relative h-full flex flex-col"
          style={{
            paddingLeft: `${gradientBarWidth + contentPadding}px`,
            paddingRight: `${gradientBarWidth + contentPadding}px`,
            paddingTop: `${verticalPaddingTop}px`,
            paddingBottom: `${verticalPaddingBottom}px`,
          }}
        >
          {/* Title Section */}
          <div className="text-center flex-shrink-0" style={{ marginBottom: `${titleMarginBottom}px` }}>
            {displayName && (
              <p
                className="font-semibold text-prism-purple"
                style={{ fontSize: `${sizes.displayName}px`, marginBottom: `${Math.round(4 * (height / 900))}px` }}
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
                height: `${Math.max(1, Math.round(1.5 * (height / 900)))}px`,
                marginTop: `${dividerMargin}px`
              }}
            />
          </div>

          {/* Values Container - Horizontal 3-column layout */}
          <div className="flex-1 flex flex-row" style={{ gap: `${columnGap}px` }}>
            {values.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="flex-1 flex flex-col"
                style={{
                  borderRight: index < 2 ? `${Math.max(1, Math.round(1 * (width / 1500)))}px solid #e5e7eb` : 'none',
                  paddingRight: index < 2 ? `${columnGap}px` : '0',
                }}
              >
                {/* Rank + Name */}
                <div className="flex items-center" style={{ gap: `${Math.round(6 * (width / 1500))}px`, marginBottom: `${valueNameMarginBottom}px` }}>
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
                      marginBottom: showCommitments ? `${taglineMarginBottom}px` : '0',
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
          <div className="text-center flex-shrink-0" style={{ marginTop: 'auto', paddingTop: `${footerPaddingTop}px` }}>
            <div
              className="w-full bg-gray-200"
              style={{
                height: `${Math.max(1, Math.round(1.5 * (height / 900)))}px`,
                marginBottom: `${Math.round(10 * (height / 900))}px`
              }}
            />
            <span
              className="text-gray-500 font-medium tracking-wide"
              style={{ fontSize: `${footerFontSize}px` }}
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

export { DIMENSIONS };
export type { CardFormat, ValueWithDefinition, ContentLevel };
