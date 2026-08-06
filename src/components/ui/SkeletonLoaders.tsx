import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  count?: number;
}

/**
 * Single skeleton card for Theories section
 */
export const TheoryCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-[#15101e]/60 p-6 sm:p-8 rounded-3xl border border-[#3d2b4f]/30 overflow-hidden shadow-xl">
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Header: Category Badge & Time */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="w-24 h-6 rounded-full bg-[#251c35] animate-pulse" />
        <div className="w-16 h-4 rounded-md bg-[#251c35]/80 animate-pulse" />
      </div>

      {/* Title Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="w-4/5 h-7 rounded-xl bg-[#251c35] animate-pulse" />
        <div className="w-3/5 h-7 rounded-xl bg-[#251c35]/80 animate-pulse" />
      </div>

      {/* Summary Skeleton */}
      <div className="space-y-2 mb-6">
        <div className="w-full h-4 rounded-md bg-[#251c35]/60 animate-pulse" />
        <div className="w-11/12 h-4 rounded-md bg-[#251c35]/60 animate-pulse" />
        <div className="w-3/4 h-4 rounded-md bg-[#251c35]/40 animate-pulse" />
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#3d2b4f]/20 my-4" />

      {/* Footer: Author & Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#251c35] animate-pulse" />
          <div className="w-24 h-4 rounded-md bg-[#251c35]/80 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-7 rounded-xl bg-[#251c35] animate-pulse" />
          <div className="w-8 h-8 rounded-xl bg-[#251c35] animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of Theory skeletons
 */
export const TheorySkeletonGrid: React.FC<SkeletonProps> = ({ count = 6 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <TheoryCardSkeleton key={idx} />
      ))}
    </motion.div>
  );
};

/**
 * Single skeleton card for Blog section
 */
export const BlogCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-[#15101e]/60 p-6 sm:p-8 rounded-3xl border border-[#3d2b4f]/30 overflow-hidden shadow-xl">
      {/* Shimmer sweep effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

      {/* Image Thumbnail Placeholder */}
      <div className="w-full h-44 rounded-2xl bg-[#251c35] animate-pulse mb-6 relative overflow-hidden" />

      {/* Category Pill */}
      <div className="w-28 h-6 rounded-full bg-[#251c35] animate-pulse mb-4" />

      {/* Title Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="w-11/12 h-7 rounded-xl bg-[#251c35] animate-pulse" />
        <div className="w-2/3 h-7 rounded-xl bg-[#251c35]/80 animate-pulse" />
      </div>

      {/* Summary Excerpt Skeleton */}
      <div className="space-y-2 mb-6">
        <div className="w-full h-4 rounded-md bg-[#251c35]/60 animate-pulse" />
        <div className="w-4/5 h-4 rounded-md bg-[#251c35]/50 animate-pulse" />
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#3d2b4f]/20 my-4" />

      {/* Footer: Author & Read Time */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#251c35] animate-pulse" />
          <div className="w-20 h-4 rounded-md bg-[#251c35]/80 animate-pulse" />
        </div>
        <div className="w-16 h-4 rounded-md bg-[#251c35]/60 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Grid of Blog skeletons
 */
export const BlogSkeletonGrid: React.FC<SkeletonProps> = ({ count = 6 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <BlogCardSkeleton key={idx} />
      ))}
    </motion.div>
  );
};

/**
 * Single skeleton item for Chronicle / Events timeline
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="relative md:pl-20">
      {/* Timeline Dot Skeleton */}
      <div className="absolute left-6 top-10 w-4 h-4 rounded-full bg-[#251c35] border-2 border-[#3d2b4f] z-10 hidden md:block" />

      <div className="bg-[#1A1528]/40 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-xl border border-[#3d2b4f]/30">
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

        {/* Top Progress bar skeleton */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#251c35] animate-pulse" />

        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-6 mt-2">
          <div className="flex items-center gap-6">
            {/* Icon Box Skeleton */}
            <div className="w-20 h-20 bg-[#15101e] rounded-3xl border border-[#3d2b4f]/30 animate-pulse shrink-0" />
            
            <div className="space-y-3">
              {/* Title */}
              <div className="w-56 sm:w-72 h-8 rounded-xl bg-[#251c35] animate-pulse" />
              {/* Badges */}
              <div className="flex items-center gap-3">
                <div className="w-20 h-5 rounded-lg bg-[#251c35]/80 animate-pulse" />
                <div className="w-28 h-5 rounded-lg bg-[#251c35]/60 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Countdown Widget Box Skeleton */}
          <div className="w-36 h-12 rounded-2xl bg-[#15101e] border border-[#3d2b4f]/30 animate-pulse shrink-0 self-end sm:self-start" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 mt-4">
          <div className="w-full h-4 rounded-md bg-[#251c35]/60 animate-pulse" />
          <div className="w-4/5 h-4 rounded-md bg-[#251c35]/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * List of Chronicle skeletons
 */
export const ChronicleSkeletonList: React.FC<SkeletonProps> = ({ count = 4 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-[#3d2b4f]/20 before:hidden before:md:block"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <EventCardSkeleton key={idx} />
      ))}
    </motion.div>
  );
};
