import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';

// Fix subscription status for current user
async function fixSubscriptionStatus() {
  console.log('Fixing subscription status...');
  
  // Get all subscriptions
  const allSubscriptions = mockDataStore.getAllSubscriptions();
  console.log('Total subscriptions:', allSubscriptions.length);
  
  // Find TMP subscriptions (21989)
  const tmpSubscriptions = allSubscriptions.filter(sub => 
    sub.subscriptionId.includes('21989') || sub.subscriptionId === '21989'
  );
  
  console.log('Found TMP subscriptions:', tmpSubscriptions.length);
  
  // Update all TMP subscriptions to completed
  tmpSubscriptions.forEach(sub => {
    const updated = mockDataStore.getSubscription(sub.subscriptionId);
    if (updated) {
      updated.status = 'completed';
      updated.completedDate = new Date();
      updated.completionPercentage = 100;
      console.log('Updated subscription:', sub.subscriptionId, 'to completed');
    }
  });
  
  // Verify the update
  const verifySubscriptions = allSubscriptions.filter(sub => 
    sub.subscriptionId.includes('21989') || sub.subscriptionId === '21989'
  );
  
  verifySubscriptions.forEach(sub => {
    console.log('Subscription', sub.subscriptionId, 'status:', sub.status);
  });
}

// Run the fix
fixSubscriptionStatus().then(() => {
  console.log('Done!');
}).catch(console.error);