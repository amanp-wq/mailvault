import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET emails with search, filter, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId') || '';
    const folder = searchParams.get('folder') || '';
    const search = searchParams.get('search') || '';
    const labelId = searchParams.get('labelId') || '';
    const tagId = searchParams.get('tagId') || '';
    const starred = searchParams.get('starred') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate sort fields to prevent injection
    const allowedSortFields = ['date', 'subject', 'fromAddr', 'isRead', 'isStarred'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Prisma.EmailWhereInput = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (folder && folder !== 'ALL') {
      where.folder = folder;
    }

    if (starred) {
      where.isStarred = true;
    }

    if (labelId) {
      where.labels = { some: { labelId } };
    }

    if (tagId) {
      where.tags = { some: { tagId } };
    }

    // Full-text search across subject, from, to, body
    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { fromAddr: { contains: search } },
        { fromName: { contains: search } },
        { toAddr: { contains: search } },
        { bodyText: { contains: search } },
        { cc: { contains: search } },
      ];
    }

    const [emails, total] = await Promise.all([
      db.email.findMany({
        where,
        include: {
          labels: { include: { label: true } },
          tags: { include: { tag: true } },
          _count: { select: { attachments: true } },
        },
        orderBy: { [validSortBy]: validSortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.email.count({ where }),
    ]);

    return NextResponse.json({
      emails: emails.map((email) => ({
        id: email.id,
        accountId: email.accountId,
        fromAddr: email.fromAddr,
        fromName: email.fromName,
        toAddr: email.toAddr,
        cc: email.cc,
        subject: email.subject,
        date: email.date,
        isRead: email.isRead,
        isStarred: email.isStarred,
        isImportant: email.isImportant,
        folder: email.folder,
        hasAttachment: email.hasAttachment,
        attachmentCount: email._count.attachments,
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
        preview: email.bodyText?.slice(0, 150) || '',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
