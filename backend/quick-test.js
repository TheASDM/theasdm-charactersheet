#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
  console.log('🔍 Quick API Test...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const spellCount = await prisma.spell.count();
    console.log(`✅ Database connected! Found ${spellCount} spells`);
    
    // Test fetching some spells
    const cantrips = await prisma.spell.findMany({
      where: { level: 0 },
      select: { name: true },
      take: 5
    });
    console.log(`✅ Sample cantrips:`, cantrips.map(s => s.name));
    
    // Test character functionality (will be empty but should not error)
    const characterCount = await prisma.character.count();
    console.log(`✅ Characters in database: ${characterCount}`);
    
    console.log('🎉 Backend API tests passed! Database is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();