'use client';

import { forwardRef } from 'react';

interface ValueWithDefinition {
  id: string;
  name: string;
  tagline: string;
  definition?: string;
  commitment?: string;
}

type CardFormat = 'story';
type ContentLevel = 'values-only' | 'taglines' | 'commitments';

interface ValuesCard2026Props {
  values: ValueWithDefinition[];
  format: CardFormat;
  contentLevel?: ContentLevel;
  displayName?: string;
  forExport?: boolean;
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
};

// Font sizes based on content density
function getSizes(contentLevel: ContentLevel, displayName?: string, values?: ValueWithDefinition[]) {
  // Calculate total character count for density
  const totalChars = (values?.slice(0, 3) || []).reduce((sum, v) => {
    let chars = v.name.length;
    if (contentLevel === 'taglines' || contentLevel === 'commitments') {
      chars += (v.tagline?.length || 0);
    }
    if (contentLevel === 'commitments') {
      chars += (v.commitment?.length || 0);
    }
    return sum + chars;
  }, 0) + (displayName?.length || 0);

  // Story format has plenty of room - use generous sizes
  if (contentLevel === 'values-only' || totalChars < 200) {
    return {
      titleSize: 'text-2xl',
      valueTitleSize: 'text-xl',
      taglineSize: 'text-base',
      commitmentSize: 'text-base',
      rankSize: 'text-xl',
    };
  }
  if (totalChars < 350) {
    return {
      titleSize: 'text-xl',
      valueTitleSize: 'text-lg',
      taglineSize: 'text-sm',
      commitmentSize: 'text-sm',
      rankSize: 'text-lg',
    };
  }
  if (totalChars < 500) {
    return {
      titleSize: 'text-lg',
      valueTitleSize: 'text-base',
      taglineSize: 'text-sm',
      commitmentSize: 'text-sm',
      rankSize: 'text-base',
    };
  }
  return {
    titleSize: 'text-base',
    valueTitleSize: 'text-sm',
    taglineSize: 'text-xs',
    commitmentSize: 'text-xs',
    rankSize: 'text-sm',
  };
}

const ValuesCard2026 = forwardRef<HTMLDivElement, ValuesCard2026Props>(
  ({ values, format, contentLevel = 'taglines', displayName, forExport = false }, ref) => {
    const { width, height } = DIMENSIONS[format];
    const aspectRatio = width / height;

    const showTaglines = contentLevel === 'taglines' || contentLevel === 'commitments';
    const showCommitments = contentLevel === 'commitments';

    const sizes = getSizes(contentLevel, displayName, values);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden bg-white"
        style={{
          width: forExport ? `${width}px` : '100%',
          height: forExport ? `${height}px` : 'auto',
          aspectRatio: forExport ? undefined : aspectRatio,
          maxWidth: forExport ? undefined : '360px',
        }}
      >
        {/* Top Prism Gradient Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-16"
          style={{ background: 'linear-gradient(90deg, #8B5CF6, #F97316, #EC4899)' }}
        />

        {/* Content Container */}
        <div
          className="relative h-full flex flex-col p-8"
          style={{ paddingTop: '80px' }}
        >
          {/* Title Section */}
          <div className="text-center mb-3 flex-shrink-0">
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

          {/* Values Container */}
          <div className="flex-1 flex flex-col gap-4">
            {values.slice(0, 3).map((item, index) => (
              <div key={item.id} className="overflow-hidden">
                {/* Rank + Name */}
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <span className={`${sizes.rankSize} font-bold text-prism-coral flex-shrink-0`}>
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span className={`${sizes.valueTitleSize} font-bold text-brand-900 uppercase tracking-wide`}>
                    {item.name}
                  </span>
                </div>

                {/* Tagline */}
                {showTaglines && item.tagline && (
                  <p className={`${sizes.taglineSize} text-gray-600 italic leading-snug mb-1`}>
                    {item.tagline}
                  </p>
                )}

                {/* 2026 Commitment */}
                {showCommitments && item.commitment && (
                  <p className={`${sizes.commitmentSize} text-prism-purple font-medium`}>
                    {item.commitment}
                  </p>
                )}

                {/* Divider (not on last item) */}
                {index < 2 && (
                  <div className="w-full h-px bg-gray-100 mt-2" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center flex-shrink-0 mt-auto mb-16">
            <div className="w-full h-px bg-gray-200 mb-3" />
            <span className="text-sm text-gray-500 font-medium tracking-wide">valueslensapp.netlify.app</span>
          </div>
        </div>

        {/* Bottom Prism Gradient Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
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
