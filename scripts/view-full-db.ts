import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // PROFILES
  console.log('\n========== PROFILES ==========\n');
  const profiles = await prisma.profiles.findMany();
  console.log(`Total: ${profiles.length}`);
  for (const p of profiles) {
    console.log(`- ${p.email} | ${p.full_name || 'No name'} | Stripe: ${p.stripe_customer_id || 'NULL'}`);
  }

  // SUBSCRIPTIONS
  console.log('\n========== SUBSCRIPTIONS ==========\n');
  const subscriptions = await prisma.subscriptions.findMany();
  console.log(`Total: ${subscriptions.length}`);
  for (const s of subscriptions) {
    console.log(`- User: ${s.user_id.substring(0,8)}... | Plan: ${s.plan} | Status: ${s.status} | Sub ID: ${s.stripe_subscription_id || 'NULL'}`);
  }

  // PROJECTS
  console.log('\n========== PROJECTS ==========\n');
  const projects = await prisma.projects.findMany({
    select: { id: true, name: true, domain: true, user_id: true, created_at: true }
  });
  console.log(`Total: ${projects.length}`);
  for (const p of projects) {
    console.log(`- ${p.name} | Domain: ${p.domain || 'N/A'} | Owner: ${p.user_id.substring(0,8)}...`);
  }

  // NODES
  console.log('\n========== NODES ==========\n');
  const nodes = await prisma.nodes.findMany({
    select: { id: true, title: true, node_type: true, project_id: true, status: true }
  });
  console.log(`Total: ${nodes.length}`);
  if (nodes.length <= 20) {
    for (const n of nodes) {
      console.log(`- ${n.title || 'Untitled'} | Type: ${n.node_type} | Status: ${n.status}`);
    }
  } else {
    console.log(`(Showing first 10)`);
    for (let i = 0; i < 10; i++) {
      const n = nodes[i];
      console.log(`- ${n.title || 'Untitled'} | Type: ${n.node_type} | Status: ${n.status}`);
    }
  }

  // EDGES
  console.log('\n========== EDGES ==========\n');
  const edges = await prisma.edges.count();
  console.log(`Total: ${edges}`);

  // ARTICLES
  console.log('\n========== ARTICLES ==========\n');
  const articles = await prisma.articles.findMany({
    select: { id: true, seo_title: true, word_count: true, project_id: true, node_id: true }
  });
  console.log(`Total: ${articles.length}`);
  if (articles.length <= 20) {
    for (const a of articles) {
      console.log(`- ${a.seo_title?.substring(0, 40) || 'Untitled'} | Words: ${a.word_count || 0}`);
    }
  } else {
    console.log(`(Showing first 10)`);
    for (let i = 0; i < 10; i++) {
      const a = articles[i];
      console.log(`- ${a.seo_title?.substring(0, 40) || 'Untitled'} | Words: ${a.word_count || 0}`);
    }
  }

  // TEAM MEMBERS
  console.log('\n========== TEAM MEMBERS ==========\n');
  const teamMembers = await prisma.team_members.findMany({
    select: { id: true, user_id: true, project_id: true, role: true }
  });
  console.log(`Total: ${teamMembers.length}`);
  for (const tm of teamMembers) {
    console.log(`- User: ${tm.user_id.substring(0,8)}... | Project: ${tm.project_id.substring(0,8)}... | Role: ${tm.role}`);
  }

  // TEAM INVITATIONS
  console.log('\n========== TEAM INVITATIONS ==========\n');
  const invitations = await prisma.team_invitations.findMany({
    select: { id: true, email: true, role: true, accepted_at: true }
  });
  console.log(`Total: ${invitations.length}`);
  for (const inv of invitations) {
    console.log(`- ${inv.email} | Role: ${inv.role} | Accepted: ${inv.accepted_at ? 'Yes' : 'Pending'}`);
  }

  console.log('\n========== SUMMARY ==========\n');
  console.log(`Profiles: ${profiles.length}`);
  console.log(`Subscriptions: ${subscriptions.length}`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Nodes: ${nodes.length}`);
  console.log(`Edges: ${edges}`);
  console.log(`Articles: ${articles.length}`);
  console.log(`Team Members: ${teamMembers.length}`);
  console.log(`Invitations: ${invitations.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
