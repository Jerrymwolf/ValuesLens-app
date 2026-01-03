'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { Value } from '@/lib/types';

interface RankableListProps {
  values: Value[];
  onReorder: (newOrder: Value[]) => void;
}

export default function RankableList({ values, onReorder }: RankableListProps) {
  return (
    <div className="w-full">
      <Reorder.Group
        axis="y"
        values={values}
        onReorder={onReorder}
        className="space-y-3"
      >
        {values.map((value, index) => (
          <RankableItem key={value.id} value={value} rank={index + 1} />
        ))}
      </Reorder.Group>

      {/* Instructions */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Drag to reorder, or use Tab + Arrow keys
      </p>
    </div>
  );
}

interface RankableItemProps {
  value: Value;
  rank: number;
}

function RankableItem({ value, rank }: RankableItemProps) {
  const controls = useDragControls();

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-amber-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-700';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing active:shadow-md transition-shadow"
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
    >
      {/* Rank number */}
      <span className={`text-2xl font-bold w-8 ${getRankColor(rank)}`}>
        #{rank}
      </span>

      {/* Value name */}
      <div className="flex-1">
        <span className="font-medium text-gray-900">{value.name}</span>
        <p className="text-sm text-gray-500 mt-0.5">{value.cardText}</p>
      </div>

      {/* Drag handle */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </Reorder.Item>
  );
}
