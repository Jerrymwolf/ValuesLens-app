'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, RefreshCw } from 'lucide-react';
import type { Value } from '@/lib/types';

interface ValueDefinition {
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
  userEdited: boolean;
}

interface DefinitionEditorProps {
  value: Value;
  definition: ValueDefinition;
  rank: number;
  onUpdate: (tagline: string, definition?: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function DefinitionEditor({
  value,
  definition,
  rank,
  onUpdate,
  onRegenerate,
  isRegenerating = false,
}: DefinitionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTagline, setEditTagline] = useState(definition.tagline);
  const [editDefinition, setEditDefinition] = useState(definition.definition || '');

  const handleSave = () => {
    onUpdate(editTagline, editDefinition || undefined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTagline(definition.tagline);
    setEditDefinition(definition.definition || '');
    setIsEditing(false);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-600 to-amber-700';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getRankColor(rank)} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">#{rank}</span>
            <h3 className="text-white font-semibold text-lg">{value.name}</h3>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="p-2 text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Regenerate definition"
                >
                  <RefreshCw
                    size={18}
                    className={isRegenerating ? 'animate-spin' : ''}
                  />
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Edit definition"
              >
                <Pencil size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Tagline input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2-5 memorable words"
                  maxLength={50}
                />
              </div>

              {/* Definition input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Definition
                </label>
                <textarea
                  value={editDefinition}
                  onChange={(e) => setEditDefinition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="What this value means to you..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                >
                  <Check size={16} /> Save
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Tagline */}
              <p className="text-xl font-semibold text-indigo-900 mb-3">
                &ldquo;{definition.tagline}&rdquo;
              </p>

              {/* Definition */}
              {definition.definition && (
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {definition.definition}
                </p>
              )}

              {/* Behavioral anchors */}
              {definition.behavioralAnchors && definition.behavioralAnchors.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs font-medium text-amber-800 mb-2">
                    Decision Questions
                  </p>
                  <ul className="space-y-1">
                    {definition.behavioralAnchors.map((anchor, i) => (
                      <li key={i} className="text-sm text-amber-700 italic">
                        • {anchor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Edited indicator */}
              {definition.userEdited && (
                <p className="text-xs text-gray-400 mt-3">
                  ✏️ Personalized by you
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
