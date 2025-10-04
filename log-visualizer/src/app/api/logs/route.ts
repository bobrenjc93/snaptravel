import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_PATH = '/tmp/log.txt';

export async function GET() {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return NextResponse.json({ entries: [] });
    }

    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    const entries = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error('Failed to parse log line:', line, error);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error reading log file:', error);
    return NextResponse.json(
      { error: 'Failed to read log file' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(LOG_PATH)) {
      fs.unlinkSync(LOG_PATH);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing log file:', error);
    return NextResponse.json(
      { error: 'Failed to clear log file' },
      { status: 500 }
    );
  }
}