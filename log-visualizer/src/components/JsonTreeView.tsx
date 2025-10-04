import React, { useState } from 'react';
import { EnhancedStateSnapshot } from '@/types/log';

interface JsonTreeViewProps {
  data: any;
  name?: string;
  isRoot?: boolean;
  isChanged?: boolean;
  isNew?: boolean;
  enhancedState?: EnhancedStateSnapshot;
  onNodeClick?: (path: string) => void;
  currentPath?: string;
}

const JsonTreeView: React.FC<JsonTreeViewProps> = ({
  data,
  name,
  isRoot = false,
  isChanged = false,
  isNew = false,
  enhancedState,
  onNodeClick,
  currentPath = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  };

  // Build the full path for this node
  // Skip the root name (e.g., "state") to match the LogParser's path tracking
  const fullPath = isRoot ? '' :
    currentPath ? (name ? `${currentPath}.${name}` : currentPath) : (name || '');

  // Check if this path has origin information
  const hasOrigin = enhancedState?.origins[fullPath];
  const isLeafNode = !hasChildren(data);

  // Debug logging
  if (!isRoot && isLeafNode) {
    console.log('Leaf node:', { name, fullPath, hasOrigin, origins: enhancedState?.origins });
  }

  // Temporary debug: make all leaf nodes appear clickable and add a simple test
  const debugHasOrigin = isLeafNode && onNodeClick;

  const getDataType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const renderValue = (value: any): React.ReactNode => {
    const type = getDataType(value);

    switch (type) {
      case 'null':
        return <span className="text-zinc-400 dark:text-zinc-500">null</span>;
      case 'undefined':
        return <span className="text-zinc-400 dark:text-zinc-500">undefined</span>;
      case 'string':
        return <span className="text-emerald-600 dark:text-emerald-400">"{value}"</span>;
      case 'number':
        return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
      case 'boolean':
        return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
      case 'array':
        return (
          <span className="text-zinc-500 dark:text-zinc-400">
            Array({value.length})
          </span>
        );
      case 'object':
        return (
          <span className="text-zinc-500 dark:text-zinc-400">
            Object({Object.keys(value).length})
          </span>
        );
      default:
        return <span className="text-zinc-600 dark:text-zinc-300">{String(value)}</span>;
    }
  };

  const renderChildren = () => {
    if (!hasChildren(data) || !isExpanded) return null;

    if (Array.isArray(data)) {
      return (
        <div className="ml-4 border-l border-zinc-200 dark:border-zinc-700 pl-4">
          {data.map((item, index) => (
            <JsonTreeView
              key={index}
              data={item}
              name={`[${index}]`}
              isChanged={false}
              isNew={false}
              enhancedState={enhancedState}
              onNodeClick={onNodeClick}
              currentPath={fullPath}
            />
          ))}
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);
      return (
        <div className="ml-4 border-l border-zinc-200 dark:border-zinc-700 pl-4">
          {entries.map(([key, value]) => (
            <JsonTreeView
              key={key}
              data={value}
              name={key}
              isChanged={false}
              isNew={false}
              enhancedState={enhancedState}
              onNodeClick={onNodeClick}
              currentPath={fullPath}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  const canExpand = hasChildren(data);

  const handleClick = () => {
    if (canExpand) {
      setIsExpanded(!isExpanded);
    } else if (isLeafNode && debugHasOrigin) {
      console.log('Clicking on leaf node:', fullPath);
      alert(`Clicked on leaf node: ${fullPath}`);
      if (onNodeClick) {
        onNodeClick(fullPath);
      }
    }
  };

  return (
    <div className={`py-1 ${isRoot ? '' : 'text-sm'}`}>
      <div
        className={`flex items-center gap-2 rounded px-2 py-1 transition-colors group ${
          isNew ? 'bg-emerald-50 dark:bg-emerald-950/20' :
          isChanged ? 'bg-amber-50 dark:bg-amber-950/20' : ''
        } ${
          canExpand || (isLeafNode && debugHasOrigin) ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50' : ''
        } ${
          isLeafNode && debugHasOrigin ? 'hover:bg-violet-50 dark:hover:bg-violet-950/20' : ''
        }`}
        onClick={handleClick}
        title={isLeafNode && hasOrigin ? 'Click to see origin call stack' : undefined}
      >
        {/* Expand/collapse icon */}
        <div className="w-4 h-4 flex items-center justify-center">
          {canExpand && (
            <svg
              width="12"
              height="12"
              fill="currentColor"
              className={`text-zinc-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
            </svg>
          )}
        </div>

        {/* Key name */}
        {name && (
          <>
            <span className={`font-mono text-orange-600 dark:text-orange-400 ${
              isNew ? 'font-semibold' : ''
            }`}>
              "{name}":
            </span>
            <span className="mx-1"></span>
          </>
        )}

        {/* Value */}
        <div className="flex-1 font-mono">
          {renderValue(data)}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1">
          {isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              new
            </span>
          )}
          {isChanged && !isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
              changed
            </span>
          )}
          {isLeafNode && debugHasOrigin && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {renderChildren()}
    </div>
  );
};

export default JsonTreeView;