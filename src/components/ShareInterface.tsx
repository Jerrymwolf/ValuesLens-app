'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Link2, Share2, Check, Smartphone, Monitor } from 'lucide-react';
import ValuesCard, { type CardFormat, type ValueWithDefinition } from './ValuesCard';
import { downloadCard, shareCard, copyToClipboard } from '@/lib/utils/imageGeneration';

interface ShareInterfaceProps {
  values: ValueWithDefinition[];
  shareUrl?: string;
}

const FORMAT_OPTIONS: { id: CardFormat; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'story', label: 'Story', icon: <Smartphone size={18} />, description: 'Instagram/TikTok' },
  { id: 'landscape', label: 'Wide', icon: <Monitor size={18} />, description: 'LinkedIn/Twitter' },
];

export default function ShareInterface({ values, shareUrl }: ShareInterfaceProps) {
  const [format, setFormat] = useState<CardFormat>('story');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const valueName = values[0]?.value.name || 'values';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    setIsDownloading(true);

    // Small delay to ensure React re-renders with isExportMode=true
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await downloadCard(cardRef.current, format, valueName);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
      setIsExporting(false);
    }
  }, [format, valueName]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    setIsSharing(true);

    // Small delay to ensure React re-renders with isExportMode=true
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const shared = await shareCard(
        cardRef.current,
        format,
        `My #1 value is ${valueName}`,
        shareUrl
      );

      if (!shared) {
        // Fallback to download if sharing not supported
        await downloadCard(cardRef.current, format, valueName);
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
      setIsExporting(false);
    }
  }, [format, valueName, shareUrl]);

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
      {/* Format selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {FORMAT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setFormat(option.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                format === option.id
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format description */}
      <p className="text-center text-sm text-gray-500 mb-6">
        {FORMAT_OPTIONS.find((o) => o.id === format)?.description}
      </p>

      {/* Card preview */}
      <div className="flex justify-center mb-8">
        <motion.div
          key={format}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="shadow-2xl rounded-2xl overflow-hidden"
        >
          <ValuesCard ref={cardRef} values={values} format={format} isExportMode={isExporting} />
        </motion.div>
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
