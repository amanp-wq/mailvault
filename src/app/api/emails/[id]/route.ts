import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single email by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await db.email.findUnique({
      where: { id },
      include: {
        labels: { include: { label: true } },
        tags: { include: { tag: true } },
        attachments: true,
        account: { select: { email: true, name: true } },
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Mark as read
    await db.email.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      id: email.id,
      accountId: email.accountId,
      accountEmail: email.account.email,
      accountName: email.account.name,
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
      isRead: true,
      isStarred: email.isStarred,
      isImportant: email.isImportant,
      folder: email.folder,
      hasAttachment: email.hasAttachment,
      labels: email.labels.map((el) => ({
        id: el.label.id,
        name: el.label.name,
        color: el.label.color,
      })),
      tags: email.tags.map((et) => ({
        id: et.tag.id,
        name: et.tag.name,
        color: et.tag.color,
      })),
      attachments: email.attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch email:', error);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}

// PATCH update email (star, important, read status, folder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Whitelist only allowed fields to prevent mass assignment
    const allowedFields = ['isStarred', 'isImportant', 'isRead', 'folder'] as const;
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const email = await db.email.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(email);
  } catch (error) {
    console.error('Failed to update email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}

// DELETE an email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.email.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete email:', error);
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
  }
}
