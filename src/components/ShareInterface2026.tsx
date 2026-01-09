'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Link2, Share2, Check, User } from 'lucide-react';
import ValuesCard2026, { type CardFormat, type ValueWithDefinition, type ContentLevel } from './ValuesCard2026';
import { downloadCard, shareCard, copyToClipboard } from '@/lib/utils/imageGeneration';

interface ShareInterface2026Props {
  values: ValueWithDefinition[];
  shareUrl?: string;
}

const CONTENT_LEVELS: { id: ContentLevel; label: string }[] = [
  { id: 'values-only', label: 'Values Only' },
  { id: 'taglines', label: '+ Taglines' },
  { id: 'commitments', label: '+ Commitments' },
];

export default function ShareInterface2026({ values, shareUrl }: ShareInterface2026Props) {
  const format: CardFormat = 'story';
  const [contentLevel, setContentLevel] = useState<ContentLevel>('commitments');
  const [showName, setShowName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);

  const valueName = values[0]?.name || 'values';

  const handleDownload = useCallback(async () => {
    if (!exportCardRef.current) return;

    setIsDownloading(true);

    // Small delay to ensure export card is rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await downloadCard(exportCardRef.current, format, valueName);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [format, valueName]);

  const handleShare = useCallback(async () => {
    if (!exportCardRef.current) return;

    setIsSharing(true);

    // Small delay to ensure export card is rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const shared = await shareCard(
        exportCardRef.current,
        format,
        `My top 3 values for 2026: ${values.map(v => v.name).join(', ')}`,
        shareUrl
      );

      if (!shared) {
        // Fallback to download if sharing not supported
        await downloadCard(exportCardRef.current, format, valueName);
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  }, [format, valueName, values, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;

    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <div className="w-full">
      {/* Card Customization */}
      <div className="space-y-4 mb-6">
        {/* Name toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowName(!showName)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
              showName
                ? 'bg-prism-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User size={16} />
            Show my name
          </button>
          {showName && (
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-purple focus:border-transparent"
            />
          )}
        </div>

        {/* Content level selector */}
        <div className="flex gap-2">
          {CONTENT_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setContentLevel(level.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                contentLevel === level.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card preview */}
      <div className="flex justify-center mb-8">
        <motion.div
          key={`${format}-${contentLevel}-${showName}-${displayName}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="shadow-2xl rounded-2xl overflow-hidden"
        >
          <ValuesCard2026
            ref={cardRef}
            values={values}
            format={format}
            contentLevel={contentLevel}
            displayName={showName ? displayName : undefined}
          />
        </motion.div>
      </div>

      {/* Hidden export card - renders at exact export dimensions, no line-clamp */}
      <div
        className="fixed top-0 left-0 opacity-0 pointer-events-none"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      >
        <ValuesCard2026
          ref={exportCardRef}
          values={values}
          format={format}
          contentLevel={contentLevel}
          displayName={showName ? displayName : undefined}
          forExport={true}
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download size={20} />
          {isDownloading ? 'Generating...' : 'Download Image'}
        </button>

        {/* Share button (mobile) */}
        {'share' in navigator && (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full py-3.5 bg-white text-brand-600 font-semibold rounded-full border-2 border-brand-600 hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Share2 size={20} />
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        )}

        {/* Copy link button */}
        {shareUrl && (
          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={20} className="text-green-600" />
                <span className="text-green-600">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 size={20} />
                Copy profile link
              </>
            )}
          </button>
        )}
      </div>

      {/* URL display */}
      {shareUrl && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center truncate">{shareUrl}</p>
        </div>
      )}
    </div>
  );
}
