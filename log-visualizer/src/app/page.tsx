'use client';

import React, { useState } from 'react';
import { LogParser } from '@/lib/logParser';
import { TimelineEntry } from '@/types/log';
import LogFileLoader from '@/components/LogFileLoader';
import TimelineSidebar from '@/components/TimelineSidebar';
import GrowingStateView from '@/components/GrowingStateView';
import BacktraceViewer from '@/components/BacktraceViewer';

export default function Home() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOriginEntry, setSelectedOriginEntry] = useState<TimelineEntry | null>(null);

  const handleLogLoad = (content: string) => {
    const parsedTimeline = LogParser.parseLogFile(content);
    setTimeline(parsedTimeline);
    setCurrentIndex(0);
    setSelectedOriginEntry(null);
  };

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    setSelectedOriginEntry(null);
  };

  const handleNodeClick = (path: string) => {
    console.log('handleNodeClick called with path:', path);
    console.log('Current enhanced state:', timeline[currentIndex]?.enhancedState);
    if (timeline[currentIndex]?.enhancedState?.origins[path]) {
      const origin = timeline[currentIndex].enhancedState.origins[path];
      const originEntry = timeline[origin.entryIndex];
      console.log('Found origin:', origin);
      setSelectedOriginEntry(originEntry);
    } else {
      console.log('No origin found for path:', path);
    }
  };

  const currentState = timeline.length > 0
    ? LogParser.reconstructStateAtIndex(timeline, currentIndex)
    : {};

  const currentChanges = timeline.length > 0
    ? LogParser.getStateChangesAtIndex(timeline, currentIndex)
    : {};

  const currentEnhancedState = timeline[currentIndex]?.enhancedState;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {timeline.length === 0 ? (
        <div className="flex items-center justify-center min-h-screen">
          <LogFileLoader onLogLoad={handleLogLoad} className="w-full max-w-2xl" />
        </div>
      ) : (
        <div className="flex h-screen">
          {/* Timeline Sidebar */}
          <TimelineSidebar
            timeline={timeline}
            currentIndex={currentIndex}
            onIndexChange={handleIndexChange}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Python State Debugger
                  </h1>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                    Time travel through your class state changes
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTimeline([]);
                    setCurrentIndex(0);
                  }}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200"
                >
                  ← Back to Input
                </button>
              </div>
            </header>

            {/* Content with State View and Call Stack */}
            <div className="flex-1 flex overflow-hidden">
              {/* State View */}
              <GrowingStateView
                state={currentState}
                changes={currentChanges}
                enhancedState={currentEnhancedState}
                onNodeClick={handleNodeClick}
                className="flex-1 overflow-hidden"
              />

              {/* Call Stack Panel */}
              {(timeline[currentIndex]?.logEntry.backtrace || selectedOriginEntry?.logEntry.backtrace) && (
                <div className="w-96 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    {selectedOriginEntry ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Value Origin
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                          Call stack that created the selected value
                        </p>
                        <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                          {selectedOriginEntry.logEntry.class}.{selectedOriginEntry.logEntry.method}()
                        </div>
                        <button
                          onClick={() => setSelectedOriginEntry(null)}
                          className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          ← Back to current stack
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                          Call Stack
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Execution path for {timeline[currentIndex].logEntry.class}.{timeline[currentIndex].logEntry.method}()
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <BacktraceViewer
                      backtrace={selectedOriginEntry?.logEntry.backtrace || timeline[currentIndex]?.logEntry.backtrace || []}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
