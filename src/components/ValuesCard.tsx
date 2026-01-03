'use client';

import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Value } from '@/lib/types';

interface ValueWithDefinition {
  value: Value;
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
}

type CardFormat = 'story' | 'landscape';

interface ValuesCardProps {
  values: ValueWithDefinition[];
  format: CardFormat;
  showDefinitions?: boolean;
  isExportMode?: boolean;
}

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

interface FlipValueCardProps {
  item: ValueWithDefinition;
  rank: number;
  isCompact: boolean;
  isExportMode?: boolean;
}

function FlipValueCard({ item, rank, isCompact, isExportMode = false }: FlipValueCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Don't flip in export mode or compact (landscape) mode
  const canFlip = !isExportMode && !isCompact;

  const getRankGradient = (r: number) => {
    switch (r) {
      case 1: return 'from-amber-400 to-amber-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-amber-600 to-amber-700';
      default: return 'from-gray-200 to-gray-300';
    }
  };

  const handleClick = () => {
    if (canFlip) setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`relative ${canFlip ? 'cursor-pointer' : ''} ${isCompact ? 'flex-1' : ''}`}
      style={{ perspective: 1000 }}
      onClick={handleClick}
    >
      <motion.div
        className="relative w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.6, type: 'spring' }
        }
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT - Tagline */}
        <div
          className={`bg-white/95 rounded-xl shadow-lg ${isCompact ? 'p-3' : 'p-4'}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r ${getRankGradient(rank)} text-white text-sm font-bold`}>
              {rank}
            </span>
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {item.value.name}
            </span>
          </div>
          <p className={`text-brand-700 font-medium italic ${isCompact ? 'text-xs' : 'text-base'}`}>
            &ldquo;{item.tagline}&rdquo;
          </p>
          {canFlip && (
            <p className="text-xs text-gray-400 mt-2">Tap to see more →</p>
          )}
        </div>

        {/* BACK - Full Definition + Anchors */}
        <div
          className={`absolute inset-0 bg-white/95 rounded-xl shadow-lg ${isCompact ? 'p-3' : 'p-4'} overflow-y-auto`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r ${getRankGradient(rank)} text-white text-sm font-bold`}>
              {rank}
            </span>
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {item.value.name}
            </span>
          </div>

          {/* Full Definition */}
          {item.definition && (
            <p className={`text-gray-700 leading-relaxed mb-3 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {item.definition}
            </p>
          )}

          {/* Behavioral Anchors */}
          {item.behavioralAnchors && item.behavioralAnchors.length > 0 && !isCompact && (
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Decision questions:</p>
              <ul className="space-y-1">
                {item.behavioralAnchors.slice(0, 3).map((anchor, i) => (
                  <li key={i} className="text-xs text-brand-600 italic">
                    • {anchor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">Tap to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}

const ValuesCard = forwardRef<HTMLDivElement, ValuesCardProps>(
  ({ values, format, isExportMode = false }, ref) => {
    const { width, height } = DIMENSIONS[format];
    const aspectRatio = width / height;

    const isCompact = format === 'landscape';
    const isVertical = format === 'story';

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          aspectRatio,
          width: '100%',
          maxWidth: format === 'landscape' ? '600px' : '360px',
        }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content */}
        <div
          className={`relative h-full flex flex-col ${
            isCompact ? 'p-6' : isVertical ? 'p-8 pt-16' : 'p-8'
          }`}
        >
          {/* Header */}
          <div className={`text-center ${isCompact ? 'mb-4' : 'mb-8'}`}>
            <h1
              className={`font-bold text-white tracking-wide ${
                isCompact ? 'text-xl' : isVertical ? 'text-3xl' : 'text-2xl'
              }`}
            >
              MY TOP 3 VALUES
            </h1>
          </div>

          {/* Value cards */}
          <div
            className={`flex-1 flex ${
              isCompact ? 'flex-row gap-4' : 'flex-col gap-4'
            } ${isCompact ? '' : 'justify-center'}`}
          >
            {values.slice(0, 3).map((item, index) => (
              <FlipValueCard
                key={item.value.id}
                item={item}
                rank={index + 1}
                isCompact={isCompact}
                isExportMode={isExportMode}
              />
            ))}
          </div>

          {/* Footer / CTA */}
          <div
            className={`text-center ${isCompact ? 'mt-4' : 'mt-8'} ${
              isVertical ? 'mb-8' : ''
            }`}
          >
            <p
              className={`text-white/80 font-medium ${
                isCompact ? 'text-xs' : 'text-sm'
              }`}
            >
              valueslens.com
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ValuesCard.displayName = 'ValuesCard';

export default ValuesCard;

export { DIMENSIONS };
export type { CardFormat, ValueWithDefinition };
