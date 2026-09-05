// Run once from backend after reviewing the content changes.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { localizeSiteContent } = require('../lib/localizeSiteContent');
const prisma = new PrismaClient();

async function main() {
  const record = await prisma.siteContent.findUnique({ where: { key: 'website_content' } });
  if (!record) throw new Error('Website content was not found');
  const before = JSON.parse(record.value);
  const after = localizeSiteContent(before);
  const backupDir = process.env.CONTENT_BACKUP_DIR;
  if (!backupDir) throw new Error('Set CONTENT_BACKUP_DIR to a private backup directory');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const backup = path.join(backupDir, `website-content-${Date.now()}.json`);
  fs.writeFileSync(backup, record.value, { mode: 0o600, flag: 'wx' });
  const result = await prisma.siteContent.updateMany({
    where: { id: record.id, value: record.value },
    data: { value: JSON.stringify(after) },
  });
  if (result.count !== 1) throw new Error('Content changed during cleanup; retry after review');
  console.log(JSON.stringify({ backup, testimonialsRemaining: after.home.testimonialItems.length }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
