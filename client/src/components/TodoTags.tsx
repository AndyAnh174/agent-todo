"use client";

import { Tag } from '@/types';

interface TodoTagsProps {
  tags?: Tag[];
  className?: string;
}

export default function TodoTags({ tags, className = '' }: TodoTagsProps) {
  if (!tags || tags.length === 0) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        No tags
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
