'use client';

import React, { useState } from 'react';
import type { StackFrame } from '@/types/log';

interface BacktraceViewerProps {
  backtrace: StackFrame[];
  className?: string;
}

export default function BacktraceViewer({ backtrace, className = '' }: BacktraceViewerProps) {
  if (!backtrace || backtrace.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No call stack available</p>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {backtrace.map((frame, index) => {
        const fileName = frame.file ? frame.file.split('/').pop() : 'unknown';
        const location = `${frame.file}:${frame.line}`;

        return (
          <div
            key={index}
            className="group/frame relative"
          >
            <div
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              onClick={() => copyToClipboard(location)}
              title={`Click to copy: ${location}`}
            >
              {/* Frame number */}
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {index}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Function and location */}
                <div className="flex flex-col gap-1 mb-1">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {frame.function}()
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded truncate">
                      {fileName}:{frame.line}
                    </span>
                  </div>
                </div>

                {/* Code snippet */}
                {frame.code && (
                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1.5 rounded border-l-2 border-violet-200 dark:border-violet-800 mt-2">
                    {frame.code}
                  </div>
                )}
              </div>

              {/* Copy indicator */}
              <div className="opacity-0 group-hover/frame:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}