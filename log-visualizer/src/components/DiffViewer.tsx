import React from 'react';

interface DiffViewerProps {
  before: any;
  after: any;
  maxLines?: number;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumber?: number;
}

const SyntaxHighlight: React.FC<{ content: string }> = ({ content }) => {
  // Simple JSON syntax highlighting
  const highlighted = content
    .replace(/"([^"]+)":/g, '<span class="text-orange-600 dark:text-orange-400">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="text-emerald-600 dark:text-emerald-400">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-purple-600 dark:text-purple-400">$1</span>')
    .replace(/(\{|\}|\[|\])/g, '<span class="text-zinc-500 dark:text-zinc-400">$1</span>');

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

const DiffViewer: React.FC<DiffViewerProps> = ({
  before,
  after,
  maxLines = 20
}) => {
  const generateDiff = (beforeVal: any, afterVal: any): DiffLine[] => {
    // Handle object diffs more intelligently
    if (typeof beforeVal === 'object' && typeof afterVal === 'object' && beforeVal !== null && afterVal !== null) {
      return generateObjectDiff(beforeVal, afterVal);
    }

    const beforeStr = JSON.stringify(beforeVal, null, 2);
    const afterStr = JSON.stringify(afterVal, null, 2);

    const beforeLines = beforeStr.split('\n');
    const afterLines = afterStr.split('\n');

    return generateLineDiff(beforeLines, afterLines);
  };

  const generateObjectDiff = (beforeObj: any, afterObj: any): DiffLine[] => {
    const diff: DiffLine[] = [];
    const beforeKeys = Object.keys(beforeObj);
    const afterKeys = Object.keys(afterObj);
    const allKeys = new Set([...beforeKeys, ...afterKeys]);

    // Only show braces if we have meaningful changes to show
    const hasChanges = Array.from(allKeys).some(key => {
      const beforeExists = key in beforeObj;
      const afterExists = key in afterObj;
      return (!beforeExists && afterExists) ||
             (beforeExists && !afterExists) ||
             (beforeExists && afterExists && JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key]));
    });

    if (!hasChanges) {
      diff.push({ type: 'unchanged', content: 'No changes' });
      return diff;
    }

    // For simple additions/removals, use a more compact format
    const addedKeys = afterKeys.filter(key => !(key in beforeObj));
    const removedKeys = beforeKeys.filter(key => !(key in afterObj));
    const changedKeys = beforeKeys.filter(key =>
      key in afterObj && JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key])
    );

    // If it's mostly additions, show compact format
    if (addedKeys.length > 0 && removedKeys.length === 0 && changedKeys.length === 0) {
      if (addedKeys.length === 1) {
        diff.push({
          type: 'added',
          content: `+ "${addedKeys[0]}" added`
        });
      } else {
        diff.push({
          type: 'added',
          content: `+ ${addedKeys.length} keys added: ${addedKeys.slice(0, 3).map(k => `"${k}"`).join(', ')}${addedKeys.length > 3 ? '...' : ''}`
        });
      }
      return diff;
    }

    // If it's mostly removals, show compact format
    if (removedKeys.length > 0 && addedKeys.length === 0 && changedKeys.length === 0) {
      if (removedKeys.length === 1) {
        diff.push({
          type: 'removed',
          content: `- "${removedKeys[0]}" removed`
        });
      } else {
        diff.push({
          type: 'removed',
          content: `- ${removedKeys.length} keys removed: ${removedKeys.slice(0, 3).map(k => `"${k}"`).join(', ')}${removedKeys.length > 3 ? '...' : ''}`
        });
      }
      return diff;
    }

    // For mixed changes, show detailed diff but only changed keys
    diff.push({ type: 'unchanged', content: '{' });

    // Show only the keys that actually changed
    const keysToShow = [...addedKeys, ...removedKeys, ...changedKeys].sort();

    for (const key of keysToShow) {
      const beforeVal = beforeObj[key];
      const afterVal = afterObj[key];
      const beforeExists = key in beforeObj;
      const afterExists = key in afterObj;

      if (!beforeExists && afterExists) {
        // Key was added
        diff.push({
          type: 'added',
          content: `  "${key}": ${JSON.stringify(afterVal)}`
        });
      } else if (beforeExists && !afterExists) {
        // Key was removed
        diff.push({
          type: 'removed',
          content: `  "${key}": ${JSON.stringify(beforeVal)}`
        });
      } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        // Key was changed - only show if values are meaningfully different
        if (typeof beforeVal === typeof afterVal && typeof beforeVal === 'string' &&
            beforeVal.includes('object at 0x') && afterVal.includes('object at 0x')) {
          // For object references, just show it as a change
          diff.push({
            type: 'removed',
            content: `  "${key}": <object changed>`
          });
          diff.push({
            type: 'added',
            content: `  "${key}": <object changed>`
          });
        } else {
          diff.push({
            type: 'removed',
            content: `  "${key}": ${JSON.stringify(beforeVal)}`
          });
          diff.push({
            type: 'added',
            content: `  "${key}": ${JSON.stringify(afterVal)}`
          });
        }
      }
    }

    // Show summary if there are unchanged keys
    const unchangedCount = allKeys.size - keysToShow.length;
    if (unchangedCount > 0) {
      diff.push({
        type: 'unchanged',
        content: `  // ... ${unchangedCount} unchanged keys`
      });
    }

    diff.push({ type: 'unchanged', content: '}' });
    return diff;
  };

  const generateLineDiff = (beforeLines: string[], afterLines: string[]): DiffLine[] => {
    const diff: DiffLine[] = [];
    let beforeIndex = 0;
    let afterIndex = 0;

    while (beforeIndex < beforeLines.length || afterIndex < afterLines.length) {
      const beforeLine = beforeLines[beforeIndex];
      const afterLine = afterLines[afterIndex];

      if (beforeIndex >= beforeLines.length) {
        diff.push({
          type: 'added',
          content: afterLine,
          lineNumber: afterIndex + 1
        });
        afterIndex++;
      } else if (afterIndex >= afterLines.length) {
        diff.push({
          type: 'removed',
          content: beforeLine,
          lineNumber: beforeIndex + 1
        });
        beforeIndex++;
      } else if (beforeLine === afterLine) {
        diff.push({
          type: 'unchanged',
          content: beforeLine,
          lineNumber: beforeIndex + 1
        });
        beforeIndex++;
        afterIndex++;
      } else {
        diff.push({
          type: 'removed',
          content: beforeLine,
          lineNumber: beforeIndex + 1
        });
        diff.push({
          type: 'added',
          content: afterLine,
          lineNumber: afterIndex + 1
        });
        beforeIndex++;
        afterIndex++;
      }
    }

    return diff;
  };

  const diff = generateDiff(before, after);
  const displayDiff = diff.slice(0, maxLines);
  const hasMore = diff.length > maxLines;

  // If it's a simple value change, show inline diff
  if (typeof before !== 'object' && typeof after !== 'object') {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 font-mono text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-red-600 dark:text-red-400 line-through">
              {JSON.stringify(before)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {JSON.stringify(after)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
      <div className="bg-zinc-100 dark:bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-600">
        Diff ({diff.filter(d => d.type !== 'unchanged').length} changes)
      </div>
      <div className="max-h-64 overflow-y-auto">
        {displayDiff.map((line, index) => (
          <div
            key={index}
            className={`flex items-start font-mono text-xs ${
              line.type === 'added'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                : line.type === 'removed'
                ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <div className={`w-8 px-2 py-1 text-right text-zinc-400 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-600 flex-shrink-0 ${
              line.type === 'added' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
              line.type === 'removed' ? 'bg-red-100 dark:bg-red-900/20' :
              'bg-zinc-50 dark:bg-zinc-800'
            }`}>
              {line.lineNumber}
            </div>
            <div className={`w-4 px-1 py-1 text-center flex-shrink-0 ${
              line.type === 'added' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
              line.type === 'removed' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
              'bg-zinc-50 dark:bg-zinc-800'
            }`}>
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </div>
            <div className="px-2 py-1 flex-1 min-w-0">
              <pre className="whitespace-pre-wrap break-all">
                <SyntaxHighlight content={line.content || ' '} />
              </pre>
            </div>
          </div>
        ))}
        {hasMore && (
          <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 text-center">
            ... {diff.length - maxLines} more lines
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffViewer;