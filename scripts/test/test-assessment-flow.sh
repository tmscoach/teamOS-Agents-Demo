#!/bin/bash

echo "Assessment Action Flow Test Script"
echo "==================================="
echo ""
echo "This script will help test the assessment action flow."
echo ""
echo "Test Steps:"
echo "1. Open http://localhost:3000/dashboard"
echo "2. Click on any assessment (e.g., TMP)"
echo "3. In the chat, try these commands:"
echo ""
echo "Simple Commands:"
echo "  - 'set answer 2-0 for question 1'"
echo "  - 'question 2 is 1-1'"
echo "  - 'enter 0-2 for question 3'"
echo ""
echo "Bulk Commands:"
echo "  - 'set all questions to 1-1'"
echo "  - 'answer all with 2-0'"
echo ""
echo "Navigation:"
echo "  - 'next page'"
echo "  - 'continue'"
echo ""
echo "Expected Behavior:"
echo "✅ The agent should use tools (check server logs for 'toolCallCount: 1')"
echo "✅ Action tags should be generated (look for '[ASSESSMENT_ACTION:' in logs)"
echo "✅ Radio buttons should update in the UI"
echo "✅ No infinite loops or freezing"
echo ""
echo "Monitoring:"
echo "- Server logs: Look for '[Streaming] Tool:' messages"
echo "- Browser console: Look for '[AssessmentChatWrapper] Executing' messages"
echo "- UI: Radio buttons should visually update"
echo ""
echo "Press Enter to open the browser console monitoring script..."
read

cat << 'EOF'
// Paste this in browser console to monitor events:

console.log('%c=== Assessment Action Monitor Started ===', 'color: green; font-weight: bold');

// Monitor custom events
window.addEventListener('assessment-action-detected', (e) => {
  console.log('%c[Event] Assessment action:', 'color: blue', e.detail);
});

// Monitor DOM changes to radio buttons
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
      const target = mutation.target;
      if (target.getAttribute('role') === 'radio') {
        console.log('%c[UI] Radio button changed:', 'color: green', {
          element: target,
          newState: target.getAttribute('data-state'),
          value: target.getAttribute('value')
        });
      }
    }
  });
});

// Start observing
observer.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ['data-state']
});

console.log('%c=== Monitoring Active ===', 'color: green; font-weight: bold');
console.log('Try commands like: "set answer 2-0 for question 1"');

EOF