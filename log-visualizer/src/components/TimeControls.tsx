import React from 'react';
import { TimelineEntry } from '@/types/log';

interface TimeControlsProps {
  timeline: TimelineEntry[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

const TimeControls: React.FC<TimeControlsProps> = ({
  timeline,
  currentIndex,
  onIndexChange,
  className = ''
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

  const handleFirst = () => {
    onIndexChange(0);
  };

  const handleLast = () => {
    onIndexChange(timeline.length - 1);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIndexChange(parseInt(e.target.value));
  };

  if (timeline.length === 0) {
    return (
      <div className={`bg-white rounded-lg p-4 shadow ${className}`}>
        <div className="text-gray-500 text-center">No timeline data available</div>
      </div>
    );
  }

  const currentEntry = timeline[currentIndex];

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Timeline</h3>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {currentIndex + 1} of {timeline.length}
        </div>
      </div>

      {/* Current Action Info */}
      {currentEntry && (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <div className="font-medium text-zinc-900 dark:text-zinc-100 font-mono text-sm">
            {currentEntry.logEntry.class}.{currentEntry.logEntry.method}()
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Modified: {Object.keys(currentEntry.logEntry.changes).join(', ')}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={handleFirst}
          disabled={!canGoPrevious}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="First"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/>
          </svg>
        </button>
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Previous"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Next"
        >
          Next
        </button>
        <button
          onClick={handleLast}
          disabled={!canGoNext}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Last"
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/>
          </svg>
        </button>
      </div>

      {/* Timeline Slider */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Start</span>
          <span>End</span>
        </div>
        <input
          type="range"
          min="0"
          max={timeline.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 rounded-lg cursor-pointer slider"
        />
      </div>

      {/* Timeline Overview */}
      <div>
        <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3 text-sm">History</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {timeline.map((entry, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                {index + 1}. {entry.logEntry.class}.{entry.logEntry.method}()
              </div>
              <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                {Object.keys(entry.logEntry.changes).length} field{Object.keys(entry.logEntry.changes).length !== 1 ? 's' : ''} changed
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeControls;