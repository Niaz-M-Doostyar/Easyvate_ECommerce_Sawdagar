const prisma = require('./prisma');

const SUPPLIER_PROVINCE_MIGRATION_KEY = 'migration_supplier_province_kandahar_v1';

async function runDataMigrations() {
  const completed = await prisma.siteContent.findUnique({
    where: { key: SUPPLIER_PROVINCE_MIGRATION_KEY },
    select: { id: true },
  });
  if (completed) return;

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({ where: { role: 'supplier' }, data: { province: 'Kandahar' } });
    await tx.siteContent.upsert({
      where: { key: SUPPLIER_PROVINCE_MIGRATION_KEY },
      update: { value: new Date().toISOString() },
      create: { key: SUPPLIER_PROVINCE_MIGRATION_KEY, value: new Date().toISOString() },
    });
  });
  console.log('Data migration complete: existing suppliers set to Kandahar');
}

async function deleteExpiredUnverifiedAccounts() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expired = await prisma.user.findMany({
    where: { emailVerified: false, createdAt: { lt: cutoff }, role: { not: 'admin' } },
    select: { id: true },
  });
  if (expired.length === 0) return 0;

  const ids = expired.map(({ id }) => id);
  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { userId: { in: ids } } });
    await tx.deliveryLocation.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids }, emailVerified: false } });
  });
  console.log(`Deleted ${ids.length} account(s) left unverified for over 30 days`);
  return ids.length;
}

function startMaintenanceJobs() {
  const run = () => deleteExpiredUnverifiedAccounts().catch((error) => {
    console.error('Unverified account cleanup failed:', error.message);
  });
  run();
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref?.();
}

module.exports = { runDataMigrations, deleteExpiredUnverifiedAccounts, startMaintenanceJobs };
