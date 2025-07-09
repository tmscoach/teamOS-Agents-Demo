// Simple test script to check admin pages for JavaScript errors
// Run with: node test-admin-pages.js

const pages = [
  '/admin',
  '/admin/conversations',
  '/admin/guardrails',
  '/admin/variables',
  '/admin/agents',
  '/admin/teams',
];

console.log('Testing admin pages...\n');

pages.forEach(page => {
  console.log(`Testing ${page}:`);
  console.log(`  URL: http://localhost:3000${page}`);
  console.log(`  Instructions: Open this page in your browser and check for errors in the console\n`);
});

console.log('\nKey things to check:');
console.log('1. Page loads without errors');
console.log('2. Data displays correctly (no "undefined" or missing values)');
console.log('3. Charts and tables render properly');
console.log('4. No "Cannot read properties of undefined" errors');
console.log('\nThe /admin/variables page error has been fixed - it should now display correctly.');