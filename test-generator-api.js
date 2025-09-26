#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Character Generator API...\n');

// Start the backend server
console.log('🚀 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: './backend',
  stdio: 'pipe'
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log('📡 Testing API endpoint...\n');

    const response = await fetch('http://localhost:3001/api/generator/random', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'random' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ API Response successful!\n');
    console.log('🎭 Generated Character:');
    console.log(`   Name: ${data.character.name}`);
    console.log(`   Species: ${data.character.species}`);
    console.log(`   Class: ${data.character.class}`);
    console.log(`   Subclass: ${data.character.subclass}`);
    console.log(`   Background: ${data.character.background}`);
    console.log(`   Level: ${data.character.level}`);
    console.log(`   HP: ${data.character.hitPoints.max}`);
    console.log(`   AC: ${data.character.armorClass}`);

    console.log('\n🧬 Ability Scores:');
    Object.entries(data.character.abilityScores).forEach(([ability, score]) => {
      console.log(`   ${ability}: ${score}`);
    });

    console.log('\n⚔️ Class Features:');
    data.character.classFeatures.slice(0, 3).forEach(feature => {
      console.log(`   • ${feature}`);
    });

    console.log('\n🐉 Species Traits:');
    data.character.speciesTraits.slice(0, 3).forEach(trait => {
      console.log(`   • ${trait}`);
    });

    console.log('\n🗡️ Weapons:');
    data.character.weapons.filter(w => w.name).forEach(weapon => {
      console.log(`   • ${weapon.name} (${weapon.atkBonus}) ${weapon.damage}`);
    });

    console.log('\n📚 Source Data:');
    console.log(`   Database counts: ${data.sources.counts.spellCount} spells, ${data.sources.counts.itemCount} items, ${data.sources.counts.featCount} feats`);

    // Save sample data for debugging
    fs.writeFileSync('./sample-character.json', JSON.stringify(data, null, 2));
    console.log('\n💾 Sample data saved to sample-character.json');

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    console.log('📋 Common issues:');
    console.log('   • Backend server not running on port 3001');
    console.log('   • Database not initialized or empty');
    console.log('   • Missing environment variables');
  } finally {
    console.log('\n🛑 Stopping backend server...');
    backend.kill();
    process.exit(0);
  }
}, 5000); // Wait 5 seconds for server to start

backend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running on port')) {
    console.log('✅ Backend server started successfully!\n');
  }
});

backend.stderr.on('data', (data) => {
  const error = data.toString();
  if (!error.includes('ExperimentalWarning')) {
    console.error('Backend error:', error);
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  backend.kill();
  process.exit(0);
});