const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sorcerer = await prisma.class.findFirst({
    where: { name: 'Sorcerer' },
    select: { subclassFeatures: true }
  });

  const str = JSON.stringify(sorcerer.subclassFeatures, null, 2);
  console.log('Contains Wild Magic Sorcery:', str.includes('Wild Magic Sorcery'));
  console.log('Contains old Wild Magic:', str.includes('Wild Magic') && !str.includes('Wild Magic Sorcery'));

  // Show the relevant parts
  const lines = str.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('Wild Magic')) {
      console.log(`Line ${i}: ${line}`);
    }
  });

  await prisma.$disconnect();
}

check();