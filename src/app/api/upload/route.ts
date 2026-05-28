import { NextRequest, NextResponse } from 'next/server';
import { parseMboxBuffer, parseEmlBuffer, saveEmailsToDb } from '@/lib/mbox-parser';
import { db } from '@/lib/db';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = ['.mbox', '.eml'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('accountId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Validate file extension
    const filename = file.name.toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));
    if (!isValidExtension) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload an MBOX or EML file.' },
        { status: 400 }
      );
    }

    const account = await db.archiveAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let results;

    if (filename.endsWith('.mbox')) {
      const emails = await parseMboxBuffer(buffer);
      results = await saveEmailsToDb(emails, accountId);
    } else if (filename.endsWith('.eml')) {
      const email = await parseEmlBuffer(buffer);
      if (email) {
        results = await saveEmailsToDb([email], accountId);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse EML file.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      filename: file.name,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to process upload: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
