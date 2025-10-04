import { LogEntry, StateSnapshot, TimelineEntry, EnhancedStateSnapshot, ValueOrigin } from '@/types/log';

export class LogParser {
  static parseLogFile(logContent: string): TimelineEntry[] {
    // First, try to split JSON objects that might be concatenated on the same line
    const normalizedContent = this.normalizeLogContent(logContent);
    const lines = normalizedContent.trim().split('\n').filter(line => line.trim());
    const timeline: TimelineEntry[] = [];
    let currentState: StateSnapshot = {};
    let valueOrigins: { [path: string]: ValueOrigin } = {};
    let entryIndex = 0;

    lines.forEach((line, lineIndex) => {
      try {
        const logEntry: LogEntry = JSON.parse(line);

        // Apply changes to current state and track origins
        Object.entries(logEntry.changes).forEach(([fieldName, change]) => {
          currentState[fieldName] = change.after;

          // Track the origin of this value and all nested values
          this.trackValueOrigins(change.after, fieldName, entryIndex, logEntry, valueOrigins);
        });

        const enhancedState: EnhancedStateSnapshot = {
          values: { ...currentState },
          origins: { ...valueOrigins }
        };

        console.log(`Entry ${entryIndex}: Origins tracked:`, Object.keys(valueOrigins));

        timeline.push({
          index: entryIndex,
          logEntry,
          stateAfter: { ...currentState },
          enhancedState,
          timestamp: Date.now() + entryIndex * 1000, // Mock timestamp
        });
        entryIndex++;
      } catch (error) {
        console.error(`Failed to parse log line ${lineIndex}: ${line}`, error);
      }
    });

    return timeline;
  }

  private static trackValueOrigins(
    value: any,
    basePath: string,
    entryIndex: number,
    logEntry: LogEntry,
    origins: { [path: string]: ValueOrigin }
  ): void {
    // Record the origin for this path
    origins[basePath] = {
      entryIndex,
      fieldPath: basePath,
      logEntry
    };

    // Recursively track origins for nested objects/arrays
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const itemPath = `${basePath}[${index}]`;
          this.trackValueOrigins(item, itemPath, entryIndex, logEntry, origins);
        });
      } else {
        Object.entries(value).forEach(([key, nestedValue]) => {
          const nestedPath = `${basePath}.${key}`;
          this.trackValueOrigins(nestedValue, nestedPath, entryIndex, logEntry, origins);
        });
      }
    }
  }

  private static normalizeLogContent(content: string): string {
    // Handle cases where JSON objects are concatenated without newlines
    // Look for "}{"  pattern and insert newlines
    let normalized = content.replace(/}\s*{/g, '}\n{');

    // Also handle cases where there might be multiple spaces or no spaces
    normalized = normalized.replace(/}\s*\n\s*{/g, '}\n{');

    return normalized;
  }

  static reconstructStateAtIndex(timeline: TimelineEntry[], targetIndex: number): StateSnapshot {
    if (targetIndex < 0 || targetIndex >= timeline.length) {
      return {};
    }
    return timeline[targetIndex].stateAfter;
  }

  static getStateChangesAtIndex(timeline: TimelineEntry[], index: number): LogEntry['changes'] {
    if (index < 0 || index >= timeline.length) {
      return {};
    }
    return timeline[index].logEntry.changes;
  }
}