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
  forExport?: boolean;
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  'index-card': { width: 1500, height: 900 },
  'business-card': { width: 1050, height: 600 },
};

// Font sizes based on format and content level for optimal card fill
function getSizesForCard(
  format: CardFormat,
  contentLevel: ContentLevel
): { title: number; value: number; tagline: number; commitment: number; rank: number } {
  const isBusinessCard = format === 'business-card';
  const scale = isBusinessCard ? 0.7 : 1;

  const baseSizes = {
    'values-only': { title: 42, value: 48, tagline: 0, commitment: 0, rank: 40 },
    'taglines': { title: 32, value: 36, tagline: 20, commitment: 0, rank: 28 },
    'commitments': { title: 26, value: 26, tagline: 15, commitment: 13, rank: 20 },
  };

  const base = baseSizes[contentLevel];
  return {
    title: Math.round(base.title * scale),
    value: Math.round(base.value * scale),
    tagline: Math.round(base.tagline * scale),
    commitment: Math.round(base.commitment * scale),
    rank: Math.round(base.rank * scale),
  };
}

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName, forExport = false }, ref) => {
    const { width, height } = DIMENSIONS[format];
    const aspectRatio = width / height;

    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    const sizes = getSizesForCard(format, contentLevel);
    const gradientBarWidth = format === 'business-card' ? 16 : 24;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          width: forExport ? `${width}px` : '100%',
          height: forExport ? `${height}px` : 'auto',
          aspectRatio: forExport ? undefined : aspectRatio,
          maxWidth: forExport ? undefined : '500px',
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
            paddingLeft: `${gradientBarWidth + 24}px`,
            paddingRight: `${gradientBarWidth + 24}px`,
            paddingTop: format === 'business-card' ? '16px' : '24px',
            paddingBottom: format === 'business-card' ? '12px' : '20px',
          }}
        >
          {/* Title Section */}
          <div className="text-center flex-shrink-0" style={{ marginBottom: format === 'business-card' ? '8px' : '12px' }}>
            {displayName && (
              <p
                className="font-semibold text-prism-purple break-words"
                style={{ fontSize: `${Math.round(sizes.value * 0.7)}px`, marginBottom: '2px' }}
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
            <div className="w-full h-px bg-gray-200" style={{ marginTop: format === 'business-card' ? '6px' : '10px' }} />
          </div>

          {/* Values Container - Horizontal 3-column layout */}
          <div className="flex-1 flex flex-row" style={{ gap: format === 'business-card' ? '12px' : '20px' }}>
            {values.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="flex-1 flex flex-col overflow-hidden"
                style={{
                  borderRight: index < 2 ? '1px solid #e5e7eb' : 'none',
                  paddingRight: index < 2 ? (format === 'business-card' ? '12px' : '20px') : '0',
                }}
              >
                {/* Rank + Name */}
                <div className="flex items-center gap-1 min-w-0" style={{ marginBottom: format === 'business-card' ? '4px' : '6px' }}>
                  <span
                    className="font-bold text-prism-coral flex-shrink-0"
                    style={{ fontSize: `${sizes.rank}px` }}
                  >
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span
                    className="font-bold text-brand-900 uppercase tracking-wide truncate"
                    style={{ fontSize: `${sizes.value}px` }}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Tagline */}
                {showTaglines && item.tagline && (
                  <p
                    className="text-gray-600 italic leading-snug overflow-hidden"
                    style={{
                      fontSize: `${sizes.tagline}px`,
                      marginBottom: showCommitments ? (format === 'business-card' ? '4px' : '6px') : '0',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.tagline}
                  </p>
                )}

                {/* 2026 Commitment */}
                {showCommitments && item.commitment && (
                  <p
                    className="text-prism-purple font-medium overflow-hidden"
                    style={{
                      fontSize: `${sizes.commitment}px`,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.commitment}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center flex-shrink-0" style={{ marginTop: 'auto', paddingTop: format === 'business-card' ? '8px' : '12px' }}>
            <div className="w-full h-px bg-gray-200" style={{ marginBottom: format === 'business-card' ? '4px' : '8px' }} />
            <span
              className="text-gray-500 font-medium tracking-wide"
              style={{ fontSize: format === 'business-card' ? '10px' : '14px' }}
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
