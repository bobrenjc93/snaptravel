import React from 'react';
import { TimelineEntry } from '@/types/log';

interface TimelineSidebarProps {
  timeline: TimelineEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  timeline,
  currentIndex,
  onIndexChange
}) => {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < timeline.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && canGoPrevious) {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'ArrowDown' && canGoNext) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div
      className="w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-2">
          Timeline
        </h2>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Step {currentIndex + 1} of {timeline.length}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="flex-1 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="flex-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Current step info */}
      {timeline[currentIndex] && (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="font-mono text-sm font-medium text-amber-800 dark:text-amber-200">
            {timeline[currentIndex].logEntry.class}.{timeline[currentIndex].logEntry.method}()
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 mt-1">
            <span>{Object.keys(timeline[currentIndex].logEntry.changes).length} field(s) changed</span>
            {timeline[currentIndex].logEntry.backtrace && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span className="text-violet-700 dark:text-violet-300 font-medium">
                  {timeline[currentIndex].logEntry.backtrace.length} frames
                </span>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto">
        {timeline.map((entry, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`w-full text-left p-3 border-b border-zinc-100 dark:border-zinc-800 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
              index === currentIndex
                ? 'bg-zinc-100 dark:bg-zinc-800 border-l-4 border-l-zinc-900 dark:border-l-zinc-100'
                : ''
            } ${index < currentIndex ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index < currentIndex
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                  : index === currentIndex
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {entry.logEntry.class}.{entry.logEntry.method}()
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {Object.keys(entry.logEntry.changes).join(', ').slice(0, 30)}
                  {Object.keys(entry.logEntry.changes).join(', ').length > 30 ? '...' : ''}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Use ↑↓ arrow keys to navigate
        </div>
      </div>
    </div>
  );
};

export default TimelineSidebar;