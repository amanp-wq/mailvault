import { simpleParser, type AddressObject } from 'mailparser';
import { db } from './db';

export interface ParsedEmail {
  messageId: string | null;
  fromAddr: string;
  fromName: string | null;
  toAddr: string;
  cc: string | null;
  bcc: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  date: Date;
  hasAttachment: boolean;
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
    content: Buffer;
  }[];
}

/**
 * Safely extract email addresses from an AddressObject or array of AddressObjects.
 * The mailparser types define to/cc/bcc as `AddressObject | AddressObject[]`.
 */
function extractAddresses(addr: AddressObject | AddressObject[] | undefined): string {
  if (!addr) return '';
  const addrs = Array.isArray(addr) ? addr : [addr];
  return addrs
    .flatMap((a) => a.value?.map((v) => v.address).filter(Boolean) || [])
    .join(', ');
}

export async function parseMboxBuffer(buffer: Buffer): Promise<ParsedEmail[]> {
  const emails: ParsedEmail[] = [];
  const lines = buffer.toString('utf-8');

  const rawEmails = splitMbox(lines);

  for (const rawEmail of rawEmails) {
    try {
      const parsed = await simpleParser(rawEmail, {
        keepCidLinks: true,
      });

      const fromAddr = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
      const fromName = parsed.from?.value?.[0]?.name || null;
      const toAddr = extractAddresses(parsed.to);
      const cc = extractAddresses(parsed.cc) || null;
      const bcc = extractAddresses(parsed.bcc) || null;

      const attachments = (parsed.attachments || []).map((att) => ({
        filename: att.filename || 'unnamed',
        mimeType: att.contentType,
        size: att.size,
        content: att.content,
      }));

      emails.push({
        messageId: parsed.messageId || null,
        fromAddr,
        fromName,
        toAddr,
        cc,
        bcc,
        subject: parsed.subject || '(No Subject)',
        bodyText: parsed.text || null,
        bodyHtml: parsed.html || null,
        date: parsed.date || new Date(),
        hasAttachment: attachments.length > 0,
        attachments,
      });
    } catch (err) {
      console.error('Failed to parse email:', err);
    }
  }

  return emails;
}

/**
 * Splits mbox file content into individual raw email strings.
 * Uses the standard mbox "From " envelope marker pattern, which consists of
 * "From " followed by an email address and a date stamp. This avoids
 * false positives from lines in email bodies that happen to start with "From ".
 */
function splitMbox(content: string): string[] {
  const emails: string[] = [];
  // Standard mbox envelope marker: "From sender@domain.com Day Mon DD HH:MM:SS YYYY"
  const envelopePattern = /^From \S+@\S+\s+.+$/;
  const lines = content.split('\n');
  let currentEmail: string[] = [];
  let inEmail = false;

  for (const line of lines) {
    if (envelopePattern.test(line)) {
      if (inEmail && currentEmail.length > 0) {
        emails.push(currentEmail.join('\n'));
        currentEmail = [];
      }
      inEmail = true;
      continue;
    }

    if (inEmail) {
      // Handle mbox quoted "From " lines (">From " in email body)
      const unquotedLine = line.replace(/^>From /, 'From ');
      currentEmail.push(unquotedLine);
    }
  }

  if (currentEmail.length > 0) {
    emails.push(currentEmail.join('\n'));
  }

  return emails;
}

/**
 * Detects the folder for an email based on headers and metadata.
 */
function detectFolder(_email: ParsedEmail): string {
  // Default to INBOX
  return 'INBOX';
}

export async function saveEmailsToDb(emails: ParsedEmail[], accountId: string) {
  const results = {
    saved: 0,
    skipped: 0,
    errors: 0,
  };

  // Process in batches for better performance
  const BATCH_SIZE = 50;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    // Check for existing emails in this batch (by messageId)
    const messageIds = batch
      .filter((e) => e.messageId)
      .map((e) => e.messageId as string);

    let existingMessageIds = new Set<string>();
    if (messageIds.length > 0) {
      const existing = await db.email.findMany({
        where: {
          accountId,
          messageId: { in: messageIds },
        },
        select: { messageId: true },
      });
      existingMessageIds = new Set(existing.map((e) => e.messageId).filter((id): id is string => id !== null));
    }

    for (const email of batch) {
      try {
        // Skip duplicates
        if (email.messageId && existingMessageIds.has(email.messageId)) {
          results.skipped++;
          continue;
        }

        const folder = detectFolder(email);

        await db.email.create({
          data: {
            accountId,
            messageId: email.messageId,
            fromAddr: email.fromAddr,
            fromName: email.fromName,
            toAddr: email.toAddr,
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            date: email.date,
            hasAttachment: email.hasAttachment,
            folder,
            attachments: {
              create: email.attachments.map((att) => ({
                filename: att.filename,
                mimeType: att.mimeType,
                size: att.size,
                content: Buffer.from(att.content),
              })),
            },
          },
        });

        results.saved++;
      } catch (err) {
        console.error('Failed to save email:', err);
        results.errors++;
      }
    }
  }

  return results;
}

export async function parseEmlBuffer(buffer: Buffer): Promise<ParsedEmail | null> {
  try {
    const parsed = await simpleParser(buffer, { keepCidLinks: true });

    const fromAddr = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
    const fromName = parsed.from?.value?.[0]?.name || null;
    const toAddr = extractAddresses(parsed.to);
    const cc = extractAddresses(parsed.cc) || null;
    const bcc = extractAddresses(parsed.bcc) || null;

    const attachments = (parsed.attachments || []).map((att) => ({
      filename: att.filename || 'unnamed',
      mimeType: att.contentType,
      size: att.size,
      content: att.content,
    }));

    return {
      messageId: parsed.messageId || null,
      fromAddr,
      fromName,
      toAddr,
      cc,
      bcc,
      subject: parsed.subject || '(No Subject)',
      bodyText: parsed.text || null,
      bodyHtml: parsed.html || null,
      date: parsed.date || new Date(),
      hasAttachment: attachments.length > 0,
      attachments,
    };
  } catch (err) {
    console.error('Failed to parse EML:', err);
    return null;
  }
}
