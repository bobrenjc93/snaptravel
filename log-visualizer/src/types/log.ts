export interface StackFrame {
  file: string;
  line: number;
  function: string;
  code?: string;
}

export interface LogEntry {
  class: string;
  method: string;
  changes: {
    [key: string]: {
      before: any;
      after: any;
    };
  };
  backtrace?: StackFrame[];
}

export interface ValueOrigin {
  entryIndex: number;
  fieldPath: string;
  logEntry: LogEntry;
}

export interface StateSnapshot {
  [key: string]: any;
}

export interface EnhancedStateSnapshot {
  values: StateSnapshot;
  origins: { [path: string]: ValueOrigin };
}

export interface TimelineEntry {
  index: number;
  logEntry: LogEntry;
  stateAfter: StateSnapshot;
  enhancedState?: EnhancedStateSnapshot;
  timestamp: number;
}