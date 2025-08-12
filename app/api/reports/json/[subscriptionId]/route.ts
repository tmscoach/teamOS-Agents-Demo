/**
 * JSON Report Retrieval API
 * GET /api/reports/json/[subscriptionId]
 * 
 * Fetches JSON report data using the TMS API tool
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@/lib/generated/prisma'
import { executeTMSTool } from '@/src/lib/agents/tools/tms-tool-executor'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  props: { params: Promise<{ subscriptionId: string }> }
) {
  const params = await props.params
  
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptionId = params.subscriptionId
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID required' },
        { status: 400 }
      )
    }

    // Look up the database user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { 
        id: true, 
        organizationId: true,
        tmsApiToken: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // First check if we have a stored JSON report
    const storedReport = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        jsonData: { not: null },
        OR: [
          { userId: user.id },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : [])
        ]
      },
      select: {
        jsonData: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If we have stored JSON data, return it
    if (storedReport?.jsonData) {
      return NextResponse.json({
        success: true,
        data: storedReport.jsonData,
        metadata: storedReport.metadata,
        cached: true,
        retrievedAt: new Date().toISOString()
      })
    }

    // Otherwise, fetch from TMS API
    try {
      const result = await executeTMSTool({
        tool: 'tms_get_json_report',
        parameters: {
          subscriptionId
        },
        jwt: user.tmsApiToken || undefined
      })

      if (result.success && result.data) {
        // Store the JSON report for future use
        const report = await prisma.userReport.findFirst({
          where: {
            subscriptionId,
            userId: user.id
          },
          select: { id: true }
        })

        if (report) {
          // Update existing report with JSON data
          await prisma.userReport.update({
            where: { id: report.id },
            data: {
              jsonData: result.data,
              processingStatus: 'COMPLETED',
              processedAt: new Date()
            }
          })
        } else {
          // Create new report with JSON data
          await prisma.userReport.create({
            data: {
              userId: user.id,
              organizationId: user.organizationId,
              subscriptionId,
              reportType: result.data.workflowType || 'TMP',
              templateId: result.data.templateId || null,
              jsonData: result.data,
              metadata: result.data.metadata || {},
              processingStatus: 'COMPLETED',
              processedAt: new Date()
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: result.data,
          cached: false,
          retrievedAt: new Date().toISOString()
        })
      } else {
        throw new Error(result.error || 'Failed to fetch JSON report')
      }
    } catch (tmsError: any) {
      console.error('TMS API error:', tmsError)
      
      // If TMS API fails, check for any HTML report as fallback
      const htmlReport = await prisma.userReport.findFirst({
        where: {
          subscriptionId,
          OR: [
            { userId: user.id },
            ...(user.organizationId ? [{ organizationId: user.organizationId }] : [])
          ]
        },
        select: {
          metadata: true,
          reportType: true
        }
      })

      if (htmlReport) {
        return NextResponse.json({
          error: 'JSON report not available',
          fallback: 'HTML report exists',
          reportType: htmlReport.reportType,
          metadata: htmlReport.metadata
        }, { status: 404 })
      }

      return NextResponse.json({
        error: 'Report not found',
        details: tmsError.message
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error retrieving JSON report:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    )
  }
}