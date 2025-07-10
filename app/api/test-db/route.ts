import prisma from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check what users exist in the database
    const users = await prisma.$queryRaw`
      SELECT id, email, role, "journeyStatus" 
      FROM "User" 
      LIMIT 10
    `
    
    return NextResponse.json({ 
      success: true, 
      users: users 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code 
    }, { status: 500 })
  }
}