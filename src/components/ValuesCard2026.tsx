'use client';

import { forwardRef } from 'react';
import Logo from './Logo';

interface ValueWithDefinition {
  id: string;
  name: string;
  tagline: string;
  definition?: string;
  commitment?: string; // 2026 commitment / if-then plan
}

type CardFormat = 'story' | 'square' | 'landscape';
type ContentLevel = 'values-only' | 'taglines' | 'commitments';

interface ValuesCard2026Props {
  values: ValueWithDefinition[];
  format: CardFormat;
  contentLevel?: ContentLevel;
  displayName?: string;
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
};

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName }, ref) => {
    const { width, height } = DIMENSIONS[format];
    const aspectRatio = width / height;

    const isStory = format === 'story';
    const isSquare = format === 'square';
    const isLandscape = format === 'landscape';

    // Content level flags
    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    // Sizing based on content level - more content = smaller fonts
    const getSizes = () => {
      if (contentLevel === 'values-only') {
        return {
          titleSize: isStory ? 'text-2xl' : isSquare ? 'text-xl' : 'text-2xl',
          valueTitleSize: isStory ? 'text-2xl' : isSquare ? 'text-xl' : 'text-2xl',
          taglineSize: '',
          commitmentSize: '',
        };
      }
      if (contentLevel === 'taglines') {
        return {
          titleSize: isStory ? 'text-xl' : isSquare ? 'text-lg' : 'text-xl',
          valueTitleSize: isStory ? 'text-xl' : isSquare ? 'text-lg' : 'text-xl',
          taglineSize: isStory ? 'text-base' : isSquare ? 'text-sm' : 'text-base',
          commitmentSize: '',
        };
      }
      // commitments - smallest fonts
      return {
        titleSize: isStory ? 'text-lg' : isSquare ? 'text-base' : 'text-lg',
        valueTitleSize: isStory ? 'text-lg' : isSquare ? 'text-base' : 'text-lg',
        taglineSize: isStory ? 'text-sm' : isSquare ? 'text-xs' : 'text-sm',
        commitmentSize: isStory ? 'text-sm' : isSquare ? 'text-xs' : 'text-sm',
      };
    };

    const sizes = getSizes();
    const padding = isStory ? 'p-8' : isSquare ? 'p-6' : 'p-10';
    const gap = isStory ? 'gap-5' : isSquare ? 'gap-3' : 'gap-5';
    const prismBarHeight = isStory ? 'h-16' : isSquare ? 'h-10' : 'h-12';

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          aspectRatio,
          width: '100%',
          maxWidth: isLandscape ? '700px' : isSquare ? '400px' : '360px',
        }}
      >
        {/* Top Prism Gradient Bar */}
        <div className={`absolute top-0 left-0 right-0 ${prismBarHeight} bg-prism`} />

        {/* Content Container */}
        <div
          className={`relative h-full flex ${isLandscape ? 'flex-row' : 'flex-col'} ${padding}`}
          style={{ paddingTop: isStory ? '80px' : isSquare ? '56px' : '64px' }}
        >
          {/* Title Section */}
          {!isLandscape && (
            <div className="text-center mb-4">
              {/* Display Name */}
              {displayName && (
                <p className={`${sizes.valueTitleSize} font-semibold text-prism-purple mb-2 line-clamp-1`}>
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
              <div className="w-full h-px bg-gray-200 mt-4" />
            </div>
          )}

          {/* Values - Vertical or Horizontal layout */}
          <div
            className={`flex-1 flex ${isLandscape ? 'flex-row' : 'flex-col'} ${gap} ${
              isLandscape ? 'items-stretch' : 'justify-center'
            }`}
          >
            {/* Landscape: Title on left */}
            {isLandscape && (
              <div className="flex flex-col justify-center pr-6 border-r border-gray-200">
                {displayName && (
                  <p className={`${sizes.valueTitleSize} font-semibold text-prism-purple mb-2 line-clamp-1`}>
                    {displayName}
                  </p>
                )}
                <h1 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide whitespace-nowrap`}>
                  {displayName ? 'MY VALUES' : 'THREE VALUES'}
                </h1>
                <h2 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide whitespace-nowrap`}>
                  {displayName ? 'FOR 2026' : 'I\'M LIVING BY'}
                </h2>
                {!displayName && (
                  <h3 className={`${sizes.titleSize} font-bold text-brand-900 tracking-wide whitespace-nowrap`}>
                    IN 2026
                  </h3>
                )}
              </div>
            )}

            {/* Value Cards */}
            {values.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className={`${isLandscape ? 'flex-1 px-4 border-r border-gray-100 last:border-r-0' : ''}`}
              >
                {/* Rank + Name */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-prism-coral">
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span className={`${sizes.valueTitleSize} font-bold text-brand-900 uppercase tracking-wide line-clamp-1`}>
                    {item.name}
                  </span>
                </div>

                {/* Tagline */}
                {showTaglines && item.tagline && (
                  <p className={`${sizes.taglineSize} text-gray-600 italic leading-snug mb-1 line-clamp-2`}>
                    {item.tagline}
                  </p>
                )}

                {/* 2026 Commitment */}
                {showCommitments && item.commitment && (
                  <p className={`${sizes.commitmentSize} text-prism-purple font-medium line-clamp-3`}>
                    {item.commitment}
                  </p>
                )}

                {/* Divider (not on last item, not in landscape) */}
                {!isLandscape && index < 2 && (
                  <div className="w-full h-px bg-gray-100 mt-3" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={`text-center ${isLandscape ? 'self-end' : 'mt-4'}`}>
            <div className="w-full h-px bg-gray-200 mb-3" />
            <div className="flex items-center justify-center gap-1">
              <Logo size="sm" showText={false} animate={false} />
              <span className="text-xs text-gray-400">valueslens.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Prism Gradient Bar */}
        <div className={`absolute bottom-0 left-0 right-0 ${isStory ? 'h-12' : 'h-8'} bg-prism`} />
      </div>
    );
  }
);

ValuesCard2026.displayName = 'ValuesCard2026';

export default ValuesCard2026;

export { DIMENSIONS };
export type { CardFormat, ValueWithDefinition, ContentLevel };
