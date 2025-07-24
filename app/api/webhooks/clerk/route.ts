import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { getRoleAssignment } from '@/src/lib/auth/role-assignment';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Validate webhook secret exists
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
    return new Response('Webhook secret not configured', {
      status: 500
    });
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, organization_memberships } = evt.data as any;
    
    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response('No email found', { status: 400 });
    }

    // Extract organization information
    let organizationId: string | null = null;
    let organizationRole: string | null = null;
    let isFirstUserInOrg = false;

    if (organization_memberships && organization_memberships.length > 0) {
      // Use the first organization membership (users might belong to multiple orgs in future)
      const membership = organization_memberships[0];
      organizationId = membership.organization.id;
      organizationRole = membership.role;
      
      // Check if this is the first user in the organization
      const existingOrgUsers = await prisma.user.count({
        where: { 
          organizationId,
          clerkId: { not: id } // Don't count the current user
        }
      });
      isFirstUserInOrg = existingOrgUsers === 0;
    }

    // Get role assignment based on email and organization context
    const { role, journeyStatus } = getRoleAssignment({
      email,
      organizationRole,
      isFirstUserInOrg
    });

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || email,
          imageUrl: image_url || null,
          organizationId,
          organizationRole,
          // Don't update role for existing users unless they're super admin
          ...(email === (process.env.ADMIN_EMAIL || 'rowan@teammanagementsystems.com') ? { role } : {})
        },
        create: {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          clerkId: id,
          email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || email,
          imageUrl: image_url || null,
          role,
          journeyStatus,
          completedSteps: [],
          organizationId,
          organizationRole,
          updatedAt: new Date(),
        },
      });

      console.log(`User ${id} synced to database with organization ${organizationId || 'none'}`);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Soft delete or handle user deletion as needed
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          deletedAt: new Date(),
        },
      });

      console.log(`User ${id} marked as deleted`);
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Database error', { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Webhook received' });
}