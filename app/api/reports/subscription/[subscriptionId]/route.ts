/**
 * Report Retrieval by Subscription ID API
 * GET /api/reports/subscription/[subscriptionId]
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  props: { params: Promise<{ subscriptionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionId = params.subscriptionId;
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      );
    }

    // Look up the database user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true, organizationId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the latest report for this subscription
    // Check both user's own reports and team reports they have access to
    const whereConditions: any = {
      subscriptionId,
      processingStatus: 'COMPLETED',
      OR: [
        { userId: user.id }
      ]
    };

    // Only add organization check if user has an organizationId
    if (user.organizationId) {
      whereConditions.OR.push({
        organizationId: user.organizationId,
        // TODO: Add manager role check
      });
    }

    const report = await prisma.userReport.findFirst({
      where: whereConditions,
      include: {
        ReportImage: true,
        ReportChunk: {
          select: {
            id: true,
            chunkIndex: true,
            sectionId: true,
            sectionTitle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found or not yet processed' },
        { status: 404 }
      );
    }

    // Log access
    await prisma.reportAccessLog.create({
      data: {
        reportId: report.id,
        accessedBy: user.id,
        accessType: 'VIEW'
      }
    });

    // Return the processed report with local image URLs
    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        subscriptionId: report.subscriptionId,
        reportType: report.reportType,
        templateId: report.templateId,
        html: report.processedHtml || report.rawHtml,
        metadata: report.metadata,
        images: report.ReportImage.map(img => ({
          originalUrl: img.originalUrl,
          storagePath: img.storagePath,
          localUrl: `/api/reports/images/${img.storagePath}`,
          altText: img.altText
        })),
        chunks: report.ReportChunk,
        createdAt: report.createdAt,
        processedAt: report.processedAt
      }
    });
  } catch (error) {
    console.error('Error retrieving report by subscription:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}