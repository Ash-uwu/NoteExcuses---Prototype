import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { clickCount, sessionStart, sessionEnd } = await request.json();

    const filePath = join(process.cwd(), 'Click count tracker');

    // Read existing content
    let content = '';
    if (existsSync(filePath)) {
      content = readFileSync(filePath, 'utf-8');
    }

    // Format the entry
    const start = new Date(sessionStart);
    const end = sessionEnd ? new Date(sessionEnd) : new Date();
    const dateStr = start.toISOString().split('T')[0];
    const startTimeStr = start.toTimeString().split(' ')[0];
    const endTimeStr = end.toTimeString().split(' ')[0];
    const entry = `Date: ${dateStr}, Start time: ${startTimeStr}, End time: ${endTimeStr}, Click count: ${clickCount}\n`;

    // Append to file
    writeFileSync(filePath, content + entry, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to click tracker:', error);
    return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
  }
}