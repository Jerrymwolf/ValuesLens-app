'use client';

import { forwardRef } from 'react';

interface ValueWithDefinition {
  id: string;
  name: string;
  tagline: string;
  definition?: string;
  commitment?: string; // 2026 commitment / if-then plan
}

type CardFormat = 'story' | 'square' | 'landscape';
type ContentLevel = 'values-only' | 'taglines' | 'commitments';
type ContentDensity = 'normal' | 'medium' | 'dense' | 'compact';

interface ValuesCard2026Props {
  values: ValueWithDefinition[];
  format: CardFormat;
  contentLevel?: ContentLevel;
  displayName?: string;
  forExport?: boolean;
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
};

// Calculate content density based on total character count
function getContentDensity(
  values: ValueWithDefinition[],
  contentLevel: ContentLevel,
  displayName?: string
): ContentDensity {
  if (contentLevel === 'values-only') return 'normal';

  // Calculate total character count
  const totalChars = values.slice(0, 3).reduce((sum, v) => {
    let chars = v.name.length;
    if (contentLevel === 'taglines' || contentLevel === 'commitments') {
      chars += (v.tagline?.length || 0);
    }
    if (contentLevel === 'commitments') {
      chars += (v.commitment?.length || 0);
    }
    return sum + chars;
  }, 0) + (displayName?.length || 0);

  // Thresholds based on testing with actual content
  if (totalChars < 200) return 'normal';
  if (totalChars < 350) return 'medium';
  if (totalChars < 500) return 'dense';
  return 'compact';
}

// Unified font sizing - same for preview and export
function getSizes(density: ContentDensity, format: CardFormat) {
  const isStory = format === 'story';
  const isSquare = format === 'square';

  // Font size tiers based on content density
  const sizeTiers = {
    normal: {
      titleSize: isStory ? 'text-2xl' : isSquare ? 'text-xl' : 'text-2xl',
      valueTitleSize: isStory ? 'text-xl' : isSquare ? 'text-lg' : 'text-xl',
      taglineSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
      commitmentSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
      rankSize: isStory ? 'text-xl' : isSquare ? 'text-lg' : 'text-xl',
    },
    medium: {
      titleSize: isStory ? 'text-xl' : isSquare ? 'text-lg' : 'text-xl',
      valueTitleSize: isStory ? 'text-lg' : isSquare ? 'text-base' : 'text-lg',
      taglineSize: isStory ? 'text-sm' : isSquare ? 'text-sm' : 'text-sm',
      commitmentSize: isStory ? 'text-sm' : isSquare ? 'text-sm' : 'text-sm',
      rankSize: isStory ? 'text-lg' : isSquare ? 'text-base' : 'text-lg',
    },
    dense: {
      titleSize: isStory ? 'text-lg' : isSquare ? 'text-base' : 'text-lg',
      valueTitleSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
      taglineSize: isStory ? 'text-sm' : isSquare ? 'text-xs' : 'text-sm',
      commitmentSize: isStory ? 'text-sm' : isSquare ? 'text-xs' : 'text-sm',
      rankSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
    },
    compact: {
      titleSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
      valueTitleSize: isStory ? 'text-sm' : isSquare ? 'text-sm' : 'text-sm',
      taglineSize: isStory ? 'text-xs' : isSquare ? 'text-xs' : 'text-xs',
      commitmentSize: isStory ? 'text-xs' : isSquare ? 'text-xs' : 'text-xs',
      rankSize: isStory ? 'text-sm' : isSquare ? 'text-sm' : 'text-sm',
    },
  };

  return sizeTiers[density];
}

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName, forExport = false }, ref) => {
    const { width, height } = DIMENSIONS[format];
    const aspectRatio = width / height;

    const isStory = format === 'story';
    const isSquare = format === 'square';
    const isLandscape = format === 'landscape';

    // Content level flags
    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    // Calculate content density and get appropriate sizes
    const density = getContentDensity(values, contentLevel, displayName);
    const sizes = getSizes(density, format);

    // Layout spacing
    const padding = isStory ? 'p-8' : isSquare ? 'p-5' : 'p-8';
    const gap = isStory ? 'gap-4' : isSquare ? 'gap-3' : 'gap-4';
    const prismBarHeight = isStory ? 'h-16' : isSquare ? 'h-10' : 'h-12';

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          width: forExport ? `${width}px` : '100%',
          height: forExport ? `${height}px` : 'auto',
          aspectRatio: forExport ? undefined : aspectRatio,
          maxWidth: forExport ? undefined : (isLandscape ? '700px' : isSquare ? '400px' : '360px'),
        }}
      >
        {/* Top Prism Gradient Bar - inline style for html-to-image compatibility */}
        <div
          className={`absolute top-0 left-0 right-0 ${prismBarHeight}`}
          style={{ background: 'linear-gradient(90deg, #8B5CF6, #F97316, #EC4899)' }}
        />

        {/* Content Container */}
        <div
          className={`relative h-full flex ${isLandscape ? 'flex-row' : 'flex-col'} ${padding}`}
          style={{ paddingTop: isStory ? '80px' : isSquare ? '56px' : '64px' }}
        >
          {/* Title Section - Story/Square */}
          {!isLandscape && (
            <div className="text-center mb-3 flex-shrink-0">
              {/* Display Name */}
              {displayName && (
                <p className={`${sizes.valueTitleSize} font-semibold text-prism-purple mb-1 break-words`}>
                  {displayName}
                </p>
              )}
              <h1 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide`}>
                {displayName ? 'MY VALUES FOR 2026' : 'THREE VALUES I\'M LIVING'}
              </h1>
              {!displayName && (
                <h2 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide`}>
                  BY IN 2026
                </h2>
              )}
              <div className="w-full h-px bg-gray-200 mt-3" />
            </div>
          )}

          {/* Values Container */}
          <div
            className={`flex-1 flex ${isLandscape ? 'flex-row' : 'flex-col'} ${gap} ${
              isLandscape ? 'items-stretch' : ''
            } overflow-hidden`}
          >
            {/* Landscape: Title on left */}
            {isLandscape && (
              <div className="flex flex-col justify-center pr-6 border-r border-gray-200 min-w-[140px] max-w-[180px] flex-shrink-0">
                {displayName && (
                  <p className={`${sizes.valueTitleSize} font-semibold text-prism-purple mb-1 break-words`}>
                    {displayName}
                  </p>
                )}
                <h1 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide`}>
                  {displayName ? 'MY VALUES' : 'THREE VALUES'}
                </h1>
                <h2 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide`}>
                  {displayName ? 'FOR 2026' : 'I\'M LIVING BY'}
                </h2>
                {!displayName && (
                  <h3 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide`}>
                    IN 2026
                  </h3>
                )}
              </div>
            )}

            {/* Value Cards */}
            {values.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className={`${isLandscape ? 'flex-1 px-4 border-r border-gray-100 last:border-r-0 overflow-hidden' : 'flex-shrink-0'}`}
              >
                {/* Rank + Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`${sizes.rankSize} font-bold text-prism-coral flex-shrink-0`}>
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span className={`${sizes.valueTitleSize} font-bold text-brand-900 uppercase tracking-wide break-words`}>
                    {item.name}
                  </span>
                </div>

                {/* Tagline */}
                {showTaglines && item.tagline && (
                  <p className={`${sizes.taglineSize} text-gray-600 italic leading-snug mb-1 break-words`}>
                    {item.tagline}
                  </p>
                )}

                {/* 2026 Commitment */}
                {showCommitments && item.commitment && (
                  <p className={`${sizes.commitmentSize} text-prism-purple font-medium break-words`}>
                    {item.commitment}
                  </p>
                )}

                {/* Divider (not on last item, not in landscape) */}
                {!isLandscape && index < 2 && (
                  <div className="w-full h-px bg-gray-100 mt-2" />
                )}
              </div>
            ))}
          </div>

          {/* Footer - Minimal branding */}
          <div className={`text-center flex-shrink-0 ${isLandscape ? 'self-end' : 'mt-3'}`}>
            <div className="w-full h-px bg-gray-200 mb-2" />
            <span className="text-xs text-gray-400 tracking-wide">valueslensapp.netlify.app</span>
          </div>
        </div>

        {/* Bottom Prism Gradient Bar - inline style for html-to-image compatibility */}
        <div
          className={`absolute bottom-0 left-0 right-0 ${isStory ? 'h-12' : 'h-8'}`}
          style={{ background: 'linear-gradient(90deg, #8B5CF6, #F97316, #EC4899)' }}
        />
      </div>
    );
  }
);

ValuesCard2026.displayName = 'ValuesCard2026';

export default ValuesCard2026;

export { DIMENSIONS };
export type { CardFormat, ValueWithDefinition, ContentLevel };
