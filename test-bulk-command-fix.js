#!/usr/bin/env node

console.log('\n=== Testing Assessment Bulk Command Fix ===\n');

console.log('Instructions:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Open http://localhost:3000/dashboard');
console.log('3. Click on any assessment (e.g., TMP)');
console.log('4. Test these commands in the chat:\n');

console.log('Test Commands:');
console.log('  ✅ "set all questions to 1-1"');
console.log('  ✅ "update all to 2-0"');
console.log('  ✅ "answer all questions with 0-2"');
console.log('');

console.log('Expected Behavior:');
console.log('  - Server logs should show: questionIds: [1, 2, 3, 4, 5]');
console.log('  - NOT: questionIds: [7, 8, 9, 10, 11, 12]');
console.log('  - All 5 radio buttons should update in the UI');
console.log('');

console.log('Browser Console Monitor (paste this in DevTools):');
console.log(`
// Monitor for correct question IDs
window.addEventListener('assessment-action-detected', (e) => {
  const { action, params } = e.detail;
  if (action === 'answer_multiple_questions') {
    const ids = params.split(':')[0].split(',').map(Number);
    const isCorrect = ids.every(id => id >= 1 && id <= 5);
    console.log(
      isCorrect ? '✅' : '❌',
      'Bulk command IDs:', ids,
      isCorrect ? '(CORRECT)' : '(WRONG - should be 1-5)'
    );
  }
});
console.log('Monitor active - try bulk commands now');
`);

console.log('\n=== Fix Applied ===');
console.log('1. Enhanced instructions to explicitly state to use positions 1-5');
console.log('2. Improved normalization logic to catch wrong IDs');
console.log('3. Updated tool description to be clearer');
console.log('');