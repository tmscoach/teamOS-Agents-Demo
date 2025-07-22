import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the database user first
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId }
    });

    if (!dbUser) {
      return NextResponse.json({ token: null });
    }

    // Get the JWT token from database
    const authToken = await prisma.tMSAuthToken.findUnique({
      where: { userId: dbUser.id }
    });

    if (!authToken?.tmsJwtToken) {
      return NextResponse.json({ token: null });
    }

    // Check if token is expired
    if (authToken.expiresAt && new Date(authToken.expiresAt) < new Date()) {
      return NextResponse.json({ token: null, expired: true });
    }

    return NextResponse.json({ 
      token: authToken.tmsJwtToken,
      expiresAt: authToken.expiresAt,
      tmsUserId: authToken.tmsUserId,
      tmsOrgId: authToken.tmsOrgId
    });
  } catch (error) {
    console.error("Error fetching JWT token:", error);
    return NextResponse.json(
      { error: "Failed to fetch JWT token" },
      { status: 500 }
    );
  }
}