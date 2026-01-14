'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Link2, Share2, Check, User, Loader2 } from 'lucide-react';
import ValuesCard2026, { DIMENSIONS, type CardFormat, type ValueWithDefinition, type ContentLevel } from './ValuesCard2026';
import { downloadCard, shareCard, copyToClipboard } from '@/lib/utils/imageGeneration';

interface ShareInterface2026Props {
  values: ValueWithDefinition[];
  shareUrl?: string;
  onUpdateValue?: (valueId: string, updates: { tagline?: string; commitment?: string }) => void;
}

const CONTENT_LEVELS: { id: ContentLevel; label: string }[] = [
  { id: 'values-only', label: 'Values Only' },
  { id: 'taglines', label: '+ Taglines' },
  { id: 'commitments', label: '+ Commitments' },
];

const CARD_FORMATS: { id: CardFormat; label: string }[] = [
  { id: 'index-card', label: 'Index Card (3×5)' },
  { id: 'business-card', label: 'Business Card' },
];

// Max width for the preview on screen
const PREVIEW_MAX_WIDTH = 500;

export default function ShareInterface2026({ values, shareUrl, onUpdateValue }: ShareInterface2026Props) {
  const [format, setFormat] = useState<CardFormat>('index-card');
  const [contentLevel, setContentLevel] = useState<ContentLevel>('commitments');
  const [showName, setShowName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(350);

  // Edit state
  const [editingValue, setEditingValue] = useState<ValueWithDefinition | null>(null);
  const [editTagline, setEditTagline] = useState('');
  const [editCommitment, setEditCommitment] = useState('');

  // Measure preview container width using ResizeObserver
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setPreviewWidth(Math.min(width, PREVIEW_MAX_WIDTH));
    });

    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Export dimensions (exact pixels for print-ready output)
  const exportWidth = DIMENSIONS[format].width;

  const startEditing = (value: ValueWithDefinition) => {
    setEditingValue(value);
    setEditTagline(value.tagline || '');
    setEditCommitment(value.commitment || '');
  };

  const cancelEditing = () => {
    setEditingValue(null);
    setEditTagline('');
    setEditCommitment('');
  };

  const saveEditing = () => {
    if (!editingValue || !onUpdateValue) return;
    onUpdateValue(editingValue.id, {
      tagline: editTagline,
      commitment: editCommitment,
    });
    cancelEditing();
  };

  const valueName = values[0]?.name || 'values';

  const handleDownload = useCallback(async () => {
    if (!exportCardRef.current) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    // Small delay to ensure export card is rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await downloadCard(exportCardRef.current, format, valueName);
      // Show success message with print tip
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
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
        {/* Card size selector */}
        <div className="flex gap-2" role="radiogroup" aria-label="Card format">
          {CARD_FORMATS.map((cardFormat) => (
            <button
              key={cardFormat.id}
              onClick={() => setFormat(cardFormat.id)}
              role="radio"
              aria-checked={format === cardFormat.id}
              aria-label={cardFormat.id === 'index-card' ? 'Index Card, 5 by 3 inches' : 'Business Card, 3.5 by 2 inches'}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                format === cardFormat.id
                  ? 'bg-prism-purple text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cardFormat.label}
            </button>
          ))}
        </div>

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
        <div className="flex gap-2" role="radiogroup" aria-label="Content to show on card">
          {CONTENT_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setContentLevel(level.id)}
              role="radio"
              aria-checked={contentLevel === level.id}
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

      {/* Card preview - Uses hybrid sizing (percentage + minimums) for readable preview */}
      <div ref={previewContainerRef} className="flex flex-col items-center mb-6" style={{ maxWidth: PREVIEW_MAX_WIDTH, width: '100%', margin: '0 auto' }}>
        <motion.div
          key={`${format}-${contentLevel}-${showName}-${displayName}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="shadow-2xl rounded-2xl overflow-hidden"
        >
          <ValuesCard2026
            values={values}
            format={format}
            contentLevel={contentLevel}
            displayName={showName ? displayName : undefined}
            containerWidth={previewWidth}
          />
        </motion.div>
        {/* Preview disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-3">
          Preview optimized for screen · Download for full print quality
        </p>
      </div>

      {/* Edit values list */}
      {onUpdateValue && !editingValue && (
        <div className="mb-6 space-y-2">
          <p className="text-xs text-gray-500 text-center mb-2">Tap a value to edit</p>
          {values.map((value, index) => (
            <button
              key={value.id}
              onClick={() => startEditing(value)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-prism-coral font-bold">
                    {index === 0 ? '①' : index === 1 ? '②' : '③'}
                  </span>
                  <span className="font-semibold text-brand-900 truncate">{value.name}</span>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-brand-600">Edit</span>
              </div>
              {value.tagline && (
                <p className="text-sm text-gray-500 italic mt-1 truncate pl-6">{value.tagline}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Edit panel */}
      <AnimatePresence>
        {editingValue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-900">
                Edit {editingValue.name}
              </h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Tagline input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Tagline</label>
                <span className={`text-xs ${editTagline.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
                  {editTagline.length}/50
                </span>
              </div>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                placeholder="A punchy phrase (3-7 words)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-purple focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-gray-400 mt-1">e.g., &quot;My place is with the 400.&quot;</p>
            </div>

            {/* Commitment input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Commitment</label>
                <span className={`text-xs ${editCommitment.length > 120 ? 'text-red-500' : 'text-gray-400'}`}>
                  {editCommitment.length}/120
                </span>
              </div>
              <textarea
                value={editCommitment}
                onChange={(e) => setEditCommitment(e.target.value)}
                placeholder="When [trigger], I [action]. [Truth]."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-purple focus:border-transparent resize-none"
                maxLength={120}
              />
              <p className="text-xs text-gray-400 mt-1">Two sentences max. Keep it punchy.</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={saveEditing}
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden export card - renders at exact export dimensions (1500x900 or 1050x600) */}
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
          containerWidth={exportWidth}
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Download button with dimensions */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label={`Download ${format === 'index-card' ? 'index card' : 'business card'} as PNG image, ${format === 'index-card' ? '1500 by 900' : '1050 by 600'} pixels`}
          aria-busy={isDownloading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>Download Image</span>
              <span className="text-xs opacity-70 ml-1">
                {format === 'index-card' ? '1500×900' : '1050×600'}
              </span>
            </>
          )}
        </button>

        {/* Success message with print tip */}
        <AnimatePresence>
          {downloadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-700 rounded-lg text-sm"
            >
              <Check size={16} className="text-green-600" />
              <span>
                Card downloaded! Print at 100% scale for exact {format === 'index-card' ? '5×3"' : '3.5×2"'} size.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
