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
  console.log('\n=== SUBSCRIPTIONS ===\n');

  const subscriptions = await prisma.subscriptions.findMany({
    select: {
      user_id: true,
      plan: true,
      status: true,
      stripe_customer_id: true,
      stripe_subscription_id: true,
      current_period_end: true,
      profiles: {
        select: { email: true, full_name: true }
      }
    }
  });

  for (const sub of subscriptions) {
    console.log(`User: ${sub.profiles?.email || 'N/A'} (${sub.profiles?.full_name || 'No name'})`);
    console.log(`  Plan: ${sub.plan}`);
    console.log(`  Status: ${sub.status}`);
    console.log(`  Customer ID: ${sub.stripe_customer_id || 'NULL'}`);
    console.log(`  Subscription ID: ${sub.stripe_subscription_id || 'NULL'}`);
    console.log(`  Period End: ${sub.current_period_end || 'NULL'}`);
    console.log('---');
  }

  console.log(`\nTotal: ${subscriptions.length} subscriptions\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
