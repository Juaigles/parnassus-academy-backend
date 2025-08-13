// Script para probar imports paso a paso
console.log('Testing imports...');

try {
  console.log('1. Testing stripeService...');
  const { stripeService } = await import('./src/services/stripeService.js');
  console.log('✓ stripeService imported');

  console.log('2. Testing purchaseService...');
  const purchaseService = await import('./src/services/purchaseService.js');
  console.log('✓ purchaseService imported');

  console.log('3. Testing wishlistService...');
  const wishlistService = await import('./src/services/wishlistService.js');
  console.log('✓ wishlistService imported');

  console.log('4. Testing controllers...');
  const purchaseController = await import('./src/controllers/purchaseController.js');
  console.log('✓ purchaseController imported');

  const webhookController = await import('./src/controllers/webhookController.js');
  console.log('✓ webhookController imported');

  console.log('5. Testing routes...');
  const purchaseRoutes = await import('./src/routes/purchase.routes.js');
  console.log('✓ purchaseRoutes imported');

  console.log('All imports successful!');
} catch (error) {
  console.error('Import error:', error.message);
  console.error('Stack:', error.stack);
}
