import React, { useState, useMemo } from 'react';
import { StateSnapshot, LogEntry } from '@/types/log';
import DiffViewer from './DiffViewer';

interface StateVisualizationProps {
  state: StateSnapshot;
  changes?: LogEntry['changes'];
  className?: string;
}

interface CollapsibleValueProps {
  value: any;
  isChanged?: boolean;
  maxLength?: number;
}

const CollapsibleValue: React.FC<CollapsibleValueProps> = ({
  value,
  isChanged = false,
  maxLength = 100
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const valueStr = JSON.stringify(value, null, 2);
  const shouldTruncate = valueStr.length > maxLength;
  const displayValue = shouldTruncate && !isExpanded
    ? valueStr.slice(0, maxLength) + '...'
    : valueStr;

  if (value === null) return <span className="text-zinc-400 dark:text-zinc-500">null</span>;
  if (value === undefined) return <span className="text-zinc-400 dark:text-zinc-500">undefined</span>;

  if (typeof value === 'string') {
    if (value.length <= 50) {
      return <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>;
    }

    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-emerald-600 dark:text-emerald-400">
          "{isExpanded ? value : value.slice(0, 50) + '...'}"
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          {isExpanded ? 'collapse' : 'expand'}
        </button>
      </div>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
  }

  // For objects and arrays
  if (shouldTruncate) {
    return (
      <div className="space-y-2">
        <pre className="text-xs font-mono whitespace-pre-wrap bg-zinc-100 dark:bg-zinc-800 p-2 rounded max-h-32 overflow-y-auto">
          {displayValue}
        </pre>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    );
  }

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap bg-zinc-100 dark:bg-zinc-800 p-2 rounded max-h-32 overflow-y-auto">
      {displayValue}
    </pre>
  );
};

const StateVisualization: React.FC<StateVisualizationProps> = ({
  state,
  changes = {},
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showChangedOnly, setShowChangedOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const filteredEntries = useMemo(() => {
    let entries = Object.entries(state);

    if (searchTerm) {
      entries = entries.filter(([key]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showChangedOnly) {
      entries = entries.filter(([key]) => key in changes);
    }

    return entries;
  }, [state, searchTerm, showChangedOnly, changes]);

  const isChanged = (key: string) => key in changes;
  const changedCount = Object.keys(changes).length;
  const totalCount = Object.keys(state).length;

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm ${className}`}>
      {/* Header with stats and controls */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Object State</h3>
          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{changedCount} changed</span>
            <span>{totalCount} total</span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="changed-only"
              checked={showChangedOnly}
              onChange={(e) => setShowChangedOnly(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="changed-only" className="text-sm text-zinc-700 dark:text-zinc-300">
              Changed only
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="text-zinc-500 dark:text-zinc-400 text-center py-8 italic">
            {Object.keys(state).length === 0
              ? 'No state data available'
              : searchTerm || showChangedOnly
                ? 'No matching entries found'
                : 'No state data available'
            }
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(([key, value]) => {
              const hasChanges = isChanged(key);
              const isExpanded = expandedSections.has(key);
              const keyStr = JSON.stringify(value, null, 2);
              const isLarge = keyStr.length > 200;

              return (
                <div
                  key={key}
                  className={`border rounded-lg transition-all duration-200 ${
                    hasChanges
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {/* Key header */}
                  <div
                    className={`flex items-center justify-between p-4 ${isLarge ? 'cursor-pointer' : ''}`}
                    onClick={isLarge ? () => toggleSection(key) : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`font-mono text-sm font-medium ${
                        hasChanges
                          ? 'text-amber-800 dark:text-amber-200'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {key}
                      </span>
                      {hasChanges && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          changed
                        </span>
                      )}
                    </div>
                    {isLarge && (
                      <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <svg
                          width="16"
                          height="16"
                          fill="currentColor"
                          className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Value content */}
                  {(!isLarge || isExpanded) && (
                    <div className="px-4 pb-4 -mt-2">
                      <CollapsibleValue value={value} isChanged={hasChanges} />
                    </div>
                  )}

                  {/* Changes diff */}
                  {hasChanges && changes[key] && (
                    <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900/50">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 font-medium">
                        Changes
                      </div>
                      <DiffViewer
                        before={changes[key].before}
                        after={changes[key].after}
                        maxLines={15}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StateVisualization;