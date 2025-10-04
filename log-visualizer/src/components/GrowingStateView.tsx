import React from 'react';
import { StateSnapshot, LogEntry, EnhancedStateSnapshot } from '@/types/log';
import JsonTreeView from './JsonTreeView';

interface GrowingStateViewProps {
  state: StateSnapshot;
  changes?: LogEntry['changes'];
  enhancedState?: EnhancedStateSnapshot;
  onNodeClick?: (path: string) => void;
  className?: string;
}

const GrowingStateView: React.FC<GrowingStateViewProps> = ({
  state,
  changes = {},
  enhancedState,
  onNodeClick,
  className = ''
}) => {
  const changedCount = Object.keys(changes).length;
  const totalCount = Object.keys(state).length;

  return (
    <div className={`flex-1 bg-white dark:bg-zinc-900 ${className}`}>
      {/* Header with search and stats */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Object State
          </h1>
          <div className="flex items-center gap-6 text-sm">
            {changedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-amber-700 dark:text-amber-300">
                  {changedCount} changed
                </span>
              </div>
            )}
            <div className="text-zinc-500 dark:text-zinc-400">
              {totalCount} total
            </div>
          </div>
        </div>

      </div>

      {/* State content */}
      <div className="p-6">
        {Object.keys(state).length === 0 ? (
          <div className="text-zinc-500 dark:text-zinc-400 text-center py-12">
            No state data available
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <JsonTreeView
              data={state}
              name="state"
              isRoot={true}
              enhancedState={enhancedState}
              onNodeClick={onNodeClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowingStateView;