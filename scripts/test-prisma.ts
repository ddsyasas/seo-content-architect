import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing Prisma connection...\n');

  // Test 1: Count profiles
  const profileCount = await prisma.profiles.count();
  console.log(`✓ Profiles count: ${profileCount}`);

  // Test 2: Count projects
  const projectCount = await prisma.projects.count();
  console.log(`✓ Projects count: ${projectCount}`);

  // Test 3: List first 3 projects with owner info
  const projects = await prisma.projects.findMany({
    take: 3,
    select: {
      id: true,
      name: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log('\n✓ Recent projects:');
  projects.forEach((p) => {
    console.log(`  - ${p.name} (${p.id})`);
  });

  // Test 4: Count nodes
  const nodeCount = await prisma.nodes.count();
  console.log(`\n✓ Nodes count: ${nodeCount}`);

  // Test 5: Count articles
  const articleCount = await prisma.articles.count();
  console.log(`✓ Articles count: ${articleCount}`);

  console.log('\n✅ All Prisma tests passed!');
}

main()
  .catch((e) => {
    console.error('❌ Prisma test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
