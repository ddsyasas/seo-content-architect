import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
export const prisma = new PrismaClient({ adapter });

// ============ HELPER FUNCTIONS ============

// Find user by email
export async function findUserByEmail(email: string) {
  const profile = await prisma.profiles.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  if (!profile) {
    console.log(`User not found: ${email}`);
    return null;
  }

  const subscription = await prisma.subscriptions.findUnique({
    where: { user_id: profile.id }
  });

  console.log('\n=== USER FOUND ===');
  console.log(`ID: ${profile.id}`);
  console.log(`Email: ${profile.email}`);
  console.log(`Name: ${profile.full_name}`);
  console.log(`Stripe Customer: ${profile.stripe_customer_id || 'NULL'}`);
  console.log(`Plan: ${subscription?.plan || 'no subscription'}`);
  console.log(`Subscription ID: ${subscription?.stripe_subscription_id || 'NULL'}`);

  return { profile, subscription };
}

// Update user's subscription plan
export async function updateUserPlan(email: string, plan: 'free' | 'pro' | 'agency') {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const updated = await prisma.subscriptions.update({
    where: { user_id: user.profile.id },
    data: {
      plan,
      updated_at: new Date()
    }
  });

  console.log(`\n✅ Updated ${email} to ${plan} plan`);
  return updated;
}

// Reset user to free (clear Stripe data)
export async function resetUserToFree(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  await prisma.subscriptions.update({
    where: { user_id: user.profile.id },
    data: {
      plan: 'free',
      status: 'active',
      stripe_subscription_id: null,
      stripe_customer_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      updated_at: new Date()
    }
  });

  await prisma.profiles.update({
    where: { id: user.profile.id },
    data: { stripe_customer_id: null }
  });

  console.log(`\n✅ Reset ${email} to free plan (cleared all Stripe data)`);
}

// Update user's Stripe IDs
export async function updateStripeIds(email: string, customerId: string | null, subscriptionId: string | null) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  if (customerId !== undefined) {
    await prisma.profiles.update({
      where: { id: user.profile.id },
      data: { stripe_customer_id: customerId }
    });
  }

  await prisma.subscriptions.update({
    where: { user_id: user.profile.id },
    data: {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date()
    }
  });

  console.log(`\n✅ Updated Stripe IDs for ${email}`);
  console.log(`  Customer ID: ${customerId}`);
  console.log(`  Subscription ID: ${subscriptionId}`);
}

// List all users with their plans
export async function listAllUsers() {
  const profiles = await prisma.profiles.findMany({
    orderBy: { created_at: 'desc' }
  });

  console.log('\n=== ALL USERS ===\n');

  for (const p of profiles) {
    const sub = await prisma.subscriptions.findUnique({
      where: { user_id: p.id }
    });

    console.log(`${p.email}`);
    console.log(`  Name: ${p.full_name || 'N/A'}`);
    console.log(`  Plan: ${sub?.plan || 'no subscription'}`);
    console.log(`  Stripe Customer: ${p.stripe_customer_id || 'NULL'}`);
    console.log(`  Stripe Sub: ${sub?.stripe_subscription_id || 'NULL'}`);
    console.log('---');
  }
}

// Delete a project (and all related data)
export async function deleteProject(projectId: string) {
  // First check if project exists
  const project = await prisma.projects.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    console.log(`Project not found: ${projectId}`);
    return;
  }

  console.log(`\nDeleting project: ${project.name}`);

  // Delete in order due to foreign keys
  await prisma.articles.deleteMany({ where: { project_id: projectId } });
  await prisma.edges.deleteMany({ where: { project_id: projectId } });
  await prisma.nodes.deleteMany({ where: { project_id: projectId } });
  await prisma.team_members.deleteMany({ where: { project_id: projectId } });
  await prisma.team_invitations.deleteMany({ where: { project_id: projectId } });
  await prisma.projects.delete({ where: { id: projectId } });

  console.log(`✅ Deleted project and all related data`);
}

// Get projects for a user
export async function getUserProjects(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const projects = await prisma.projects.findMany({
    where: { user_id: user.profile.id },
    include: {
      _count: {
        select: { nodes: true, articles: true }
      }
    }
  });

  console.log(`\n=== PROJECTS FOR ${email} ===\n`);
  for (const p of projects) {
    console.log(`${p.name} (${p.id})`);
    console.log(`  Domain: ${p.domain || 'N/A'}`);
    console.log(`  Nodes: ${p._count.nodes}, Articles: ${p._count.articles}`);
    console.log('---');
  }

  return projects;
}

// ============ MAIN ============
// This section runs when you call the script directly
// Modify the function call below to do what you need

async function main() {
  // Examples - uncomment what you need:

  // List all users
  await listAllUsers();

  // Find specific user
  // await findUserByEmail('ddsyasas@gmail.com');

  // Update user's plan
  // await updateUserPlan('ddsyasas@gmail.com', 'pro');

  // Reset user to free
  // await resetUserToFree('ddsyasas@gmail.com');

  // Get user's projects
  // await getUserProjects('ddsyasas@gmail.com');

  // Delete a project
  // await deleteProject('project-id-here');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
