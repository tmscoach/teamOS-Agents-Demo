import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export interface OrganizationContext {
  userId: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  organizationRole: string | null;
}

/**
 * Get organization context for the current user
 * This is used to filter data based on organization boundaries
 */
export async function getOrganizationContext(): Promise<OrganizationContext | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Get user from database to check organization and super admin status
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      organizationRole: true,
    }
  });

  if (!user) {
    return null;
  }

  // Check if user is super admin
  const isSuperAdmin = user.role === 'ADMIN';

  return {
    userId: user.id,
    organizationId: user.organizationId,
    isSuperAdmin,
    organizationRole: user.organizationRole,
  };
}

/**
 * Build where clause for Prisma queries with organization filtering
 * Super admins can see all data, others only see their organization's data
 */
export function buildOrganizationWhere(
  context: OrganizationContext,
  additionalWhere: Record<string, any> = {}
) {
  if (context.isSuperAdmin) {
    // Super admin can see everything
    return additionalWhere;
  }

  if (!context.organizationId) {
    // User without organization can't see any org data
    // This shouldn't happen in normal flow but handle it gracefully
    return {
      ...additionalWhere,
      organizationId: null,
    };
  }

  // Regular users only see their organization's data
  return {
    ...additionalWhere,
    organizationId: context.organizationId,
  };
}

/**
 * Check if user has permission to access a specific resource
 * based on organization boundaries
 */
export async function canAccessResource(
  context: OrganizationContext,
  resourceOrganizationId: string | null
): Promise<boolean> {
  // Super admin can access everything
  if (context.isSuperAdmin) {
    return true;
  }

  // Resource without organization (legacy data) - only super admin can access
  if (!resourceOrganizationId) {
    return false;
  }

  // User can only access resources in their organization
  return context.organizationId === resourceOrganizationId;
}