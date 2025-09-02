#!/usr/bin/env node

/**
 * Quick demonstration of the Koog-Luxor9 integration
 */

const { demonstrateWorkflow } = require('./dist/examples/deployment-examples');

async function main() {
  console.log('🚀 Starting Koog-Luxor9 Integration Demo');
  console.log('=======================================\n');

  try {
    await demonstrateWorkflow();
    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}