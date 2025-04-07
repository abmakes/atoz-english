import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { errorResponse } from '@/lib/api-utils';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'quiz_template.csv');
  const fileName = 'quiz_template.csv';

  try {
    // Check if the file exists and read its contents
    const fileBuffer = await fs.readFile(filePath);

    // Convert the buffer to a Readable stream
    const stream = Readable.from(fileBuffer);

    // Set headers for download
    const headers = {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv',
    };

    // Use NextResponse to return the stream
    return new NextResponse(stream as unknown as ReadableStream, { headers });
  } catch (error) {
    console.error('Error reading file:', error);
    return errorResponse(
      'CSV template not found', 
      { fileName, path: filePath.replace(process.cwd(), '') }, 
      404
    );
  }
}