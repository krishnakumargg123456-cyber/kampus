import express from 'express';
import { createServer } from 'http';
import { registerMarketBackend } from '../server/marketBackend.ts';

const app = express();
app.use(express.json({ limit: '16mb' }));
registerMarketBackend(app);

const server = createServer(app);

async function runTests() {
  const PORT = 4921;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://localhost:${PORT}`;

  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING KAMPUS MARKETPLACE FULL-STACK TEST SUITE`);
  console.log(`   Endpoint: ${baseUrl}`);
  console.log(`======================================================\n`);

  const sellerId = `seller_${Date.now()}`;
  const buyerId = `buyer_${Date.now()}`;
  const sellerName = 'Rohan Verma (Year 3 CS)';
  const buyerName = 'Ananya Sharma (Year 1 EE)';

  // STEP 1: Bootstrap Marketplace for both users
  console.log('--- Step 1: Bootstrap Marketplace ---');
  const resBootSeller = await fetch(`${baseUrl}/api/market/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: sellerId }),
  });
  if (!resBootSeller.ok) throw new Error(`Bootstrap failed for seller: ${resBootSeller.status}`);
  const bootSellerJson = await resBootSeller.json();
  console.log(`✓ Seller bootstrapped: ${bootSellerJson.listings.length} existing listings, cart items: ${bootSellerJson.cart?.length ?? 0}`);

  const resBootBuyer = await fetch(`${baseUrl}/api/market/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId }),
  });
  if (!resBootBuyer.ok) throw new Error(`Bootstrap failed for buyer: ${resBootBuyer.status}`);
  const bootBuyerJson = await resBootBuyer.json();
  console.log(`✓ Buyer bootstrapped: ${bootBuyerJson.listings.length} listings loaded`);

  // STEP 2: Seller publishes a new listing
  console.log('\n--- Step 2: Seller Publishes Product Listing ---');
  const listingPayload = {
    title: 'Operating System Concepts (Galvin 10th Ed) + Class Notes',
    description: 'Clean textbook with highlighted chapter summaries and midsem cheat-sheets included. Safe meetup at Hostel 14.',
    category: 'Books & Study',
    subcategory: 'Reference Books',
    brand: 'Wiley',
    listingType: 'For Sale',
    condition: 'Like New',
    priceINR: 550,
    originalPriceINR: 1100,
    negotiable: true,
    images: ['books'],
    coverIndex: 0,
    sellerId: sellerId,
    sellerName: sellerName,
    sellerCampus: 'Main Campus IIT',
    pickupPoint: 'Central Library Foyer / Hostel 14 Common Room',
    deliveryAvailable: true,
  };

  const resCreate = await fetch(`${baseUrl}/api/market/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listingPayload),
  });
  if (!resCreate.ok) {
    const err = await resCreate.json();
    throw new Error(`Failed to create listing: ${JSON.stringify(err)}`);
  }
  const createJson = await resCreate.json();
  const createdListing = createJson.listing;
  console.log(`✓ Product listed successfully! ID: ${createdListing.id}`);
  console.log(`  Title: "${createdListing.title}"`);
  console.log(`  Price: ₹${createdListing.priceINR} (Original: ₹${createdListing.originalPriceINR})`);
  console.log(`  Status: ${createdListing.status}`);

  // STEP 3: Buyer searches and discovers the listing
  console.log('\n--- Step 3: Buyer Searches and Discovers Listing ---');
  const resSearch = await fetch(`${baseUrl}/api/market/listings?search=Galvin&category=Books%20%26%20Study`);
  if (!resSearch.ok) throw new Error('Search failed');
  const searchJson = await resSearch.json();
  const found = searchJson.listings.find((l: any) => l.id === createdListing.id);
  if (!found) throw new Error('Newly created listing not found in search results');
  console.log(`✓ Discovered listing via search: "${found.title}"`);

  // STEP 4: Buyer toggles wishlist
  console.log('\n--- Step 4: Buyer Saves to Wishlist ---');
  const resWish = await fetch(`${baseUrl}/api/market/wishlist/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId, listingId: createdListing.id }),
  });
  const wishJson = await resWish.json();
  if (!wishJson.wishlistIds.includes(createdListing.id)) throw new Error('Wishlist toggle failed');
  console.log(`✓ Wishlist verified: ${wishJson.wishlistIds.length} item(s) saved`);

  // STEP 5: Prevention check - Seller cannot add own listing to cart
  console.log('\n--- Step 5: Safety Rule - Prevent Seller Adding Own Item to Cart ---');
  const resSelfCart = await fetch(`${baseUrl}/api/market/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: sellerId, listingId: createdListing.id, quantity: 1 }),
  });
  if (resSelfCart.status !== 400) {
    throw new Error(`Expected 400 Bad Request when seller adds own item, got ${resSelfCart.status}`);
  }
  console.log(`✓ Verified: Seller prevented from adding own item to cart (HTTP 400)`);

  // STEP 6: Buyer adds item to cart
  console.log('\n--- Step 6: Buyer Adds Item to Cart ---');
  const resAddCart = await fetch(`${baseUrl}/api/market/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId, listingId: createdListing.id, quantity: 1 }),
  });
  if (!resAddCart.ok) {
    const err = await resAddCart.json();
    throw new Error(`Add to cart failed: ${JSON.stringify(err)}`);
  }
  const cartJson = await resAddCart.json();
  console.log(`✓ Item added to Buyer cart! Subtotal: ₹${cartJson.subtotalINR}`);

  // STEP 7: Fetch Buyer's Cart
  console.log('\n--- Step 7: Hydrate and Verify Cart Details ---');
  const resGetCart = await fetch(`${baseUrl}/api/market/cart?userId=${encodeURIComponent(buyerId)}`);
  const getCartJson = await resGetCart.json();
  if (getCartJson.items.length !== 1 || getCartJson.items[0].listingId !== createdListing.id) {
    throw new Error('Cart contents mismatch');
  }
  console.log(`✓ Cart verified: 1 item, Title: "${getCartJson.items[0].listing.title}", Total: ₹${getCartJson.subtotalINR}`);

  // STEP 8: Buyer places an order
  console.log('\n--- Step 8: Buyer Places Campus Order ---');
  const orderPayload = {
    buyerId: buyerId,
    buyerName: buyerName,
    buyerEmail: 'ananya.s@campus.ac.in',
    buyerPhone: '+91 9876543210',
    items: [{ listingId: createdListing.id, quantity: 1 }],
    fulfillmentMethod: 'Campus Pickup',
    pickupLocation: 'Central Library Foyer, South Steps',
    buyerNote: 'Available today after 4:30 PM lab classes.',
    paymentMethod: 'Cash on Pickup',
  };

  const resOrder = await fetch(`${baseUrl}/api/market/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!resOrder.ok) {
    const err = await resOrder.json();
    throw new Error(`Place order failed: ${JSON.stringify(err)}`);
  }
  const orderJson = await resOrder.json();
  if (!orderJson.ok || !orderJson.orders || orderJson.orders.length === 0) {
    throw new Error('No orders returned in response');
  }
  const placedOrder = orderJson.orders[0];
  console.log(`✓ Campus Order placed successfully! Order ID: ${placedOrder.id}`);
  console.log(`  Buyer: ${placedOrder.buyerName} (${placedOrder.buyerPhone})`);
  console.log(`  Seller: ${placedOrder.sellerName}`);
  console.log(`  Pickup Location: ${placedOrder.pickupLocation}`);
  console.log(`  Payment: ${placedOrder.paymentMethod} (${placedOrder.paymentStatus})`);
  console.log(`  Status: ${placedOrder.status}`);

  // STEP 9: Verify Buyer's cart is automatically emptied after order
  console.log('\n--- Step 9: Verify Cart Automatically Cleared Post-Order ---');
  const resCartAfter = await fetch(`${baseUrl}/api/market/cart?userId=${encodeURIComponent(buyerId)}`);
  const cartAfterJson = await resCartAfter.json();
  if (cartAfterJson.items.length !== 0) {
    throw new Error(`Expected cart to be empty, found ${cartAfterJson.items.length} items`);
  }
  console.log(`✓ Buyer cart is now clean: 0 items remaining`);

  // STEP 10: Buyer tracks their order in "My Purchases"
  console.log('\n--- Step 10: Buyer Tracks Order in "My Purchases" ---');
  const resBuyerOrders = await fetch(`${baseUrl}/api/market/orders?userId=${encodeURIComponent(buyerId)}&role=buyer`);
  const buyerOrdersJson = await resBuyerOrders.json();
  const foundBuyerOrder = buyerOrdersJson.orders.find((o: any) => o.id === placedOrder.id);
  if (!foundBuyerOrder) throw new Error('Order not found in Buyer order history');
  console.log(`✓ Order found in Buyer purchases: Status = ${foundBuyerOrder.status}`);

  // STEP 11: Seller views incoming order in "Seller Hub"
  console.log('\n--- Step 11: Seller Views Incoming Order in "Seller Hub" ---');
  const resSellerOrders = await fetch(`${baseUrl}/api/market/orders?userId=${encodeURIComponent(sellerId)}&role=seller`);
  const sellerOrdersJson = await resSellerOrders.json();
  const foundSellerOrder = sellerOrdersJson.orders.find((o: any) => o.id === placedOrder.id);
  if (!foundSellerOrder) throw new Error('Order not found in Seller incoming orders');
  console.log(`✓ Incoming order verified in Seller Hub: Buyer = ${foundSellerOrder.buyerName}`);

  // STEP 12: Seller accepts order
  console.log('\n--- Step 12: Seller Accepts Order ---');
  const resAccept = await fetch(`${baseUrl}/api/market/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: sellerId, status: 'Accepted', note: 'I can meet at 4:45 PM at library steps.' }),
  });
  if (!resAccept.ok) throw new Error('Failed to accept order');
  const acceptJson = await resAccept.json();
  if (acceptJson.order.status !== 'Accepted') throw new Error(`Expected status Accepted, got ${acceptJson.order.status}`);
  console.log(`✓ Order updated to status: ${acceptJson.order.status}`);

  // STEP 13: Seller marks Ready for Pickup
  console.log('\n--- Step 13: Seller Marks "Ready for Pickup" ---');
  const resReady = await fetch(`${baseUrl}/api/market/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: sellerId, status: 'Ready for Pickup', note: 'Book packed with cheat-sheets, waiting at library foyer.' }),
  });
  if (!resReady.ok) throw new Error('Failed to mark ready for pickup');
  const readyJson = await resReady.json();
  if (readyJson.order.status !== 'Ready for Pickup') throw new Error(`Expected Ready for Pickup, got ${readyJson.order.status}`);
  console.log(`✓ Order updated to status: ${readyJson.order.status}`);

  // STEP 14: Seller completes handover (Order Completed -> Listing automatically marked "Sold")
  console.log('\n--- Step 14: Complete Handover & Automatically Mark Listing "Sold" ---');
  const resComplete = await fetch(`${baseUrl}/api/market/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: sellerId, status: 'Completed', note: 'Handed over textbook and received cash payment.' }),
  });
  if (!resComplete.ok) throw new Error('Failed to complete order');
  const completeJson = await resComplete.json();
  if (completeJson.order.status !== 'Completed') throw new Error(`Expected Completed, got ${completeJson.order.status}`);
  if (completeJson.order.paymentStatus !== 'Paid') throw new Error(`Expected Paid, got ${completeJson.order.paymentStatus}`);
  console.log(`✓ Order completed! Status: ${completeJson.order.status}, Payment: ${completeJson.order.paymentStatus}`);

  // STEP 15: Verify Listing is now marked "Sold" in database and cannot be re-purchased
  console.log('\n--- Step 15: Verify Shared Listing Inventory State is "Sold" ---');
  const resBootAfter = await fetch(`${baseUrl}/api/market/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId }),
  });
  const bootAfterJson = await resBootAfter.json();
  const updatedListing = bootAfterJson.listings.find((l: any) => l.id === createdListing.id);
  if (!updatedListing) throw new Error('Listing missing from bootstrap');
  if (updatedListing.status !== 'Sold') {
    throw new Error(`Expected listing status "Sold", but found "${updatedListing.status}"`);
  }
  console.log(`✓ Verified: Listing status in shared database is now "${updatedListing.status}"`);

  // STEP 16: Verify attempt to add a Sold item to cart is rejected
  console.log('\n--- Step 16: Safety Rule - Prevent Buying Sold Item ---');
  const resBuySold = await fetch(`${baseUrl}/api/market/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId, listingId: createdListing.id, quantity: 1 }),
  });
  if (resBuySold.status !== 400) {
    throw new Error(`Expected 400 when adding sold item to cart, got ${resBuySold.status}`);
  }
  console.log(`✓ Verified: Sold item rejected from cart addition with HTTP 400`);

  // STEP 17: Test Order Cancellation Flow
  console.log('\n--- Step 17: Test Order Cancellation Flow ---');
  // List a quick second item
  const resCreate2 = await fetch(`${baseUrl}/api/market/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...listingPayload,
      title: 'Casio fx-991CW ClassWiz Scientific Calculator',
      priceINR: 800,
    }),
  });
  const create2Json = await resCreate2.json();
  const listing2 = create2Json.listing;

  // Order item 2
  const resOrder2 = await fetch(`${baseUrl}/api/market/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...orderPayload,
      items: [{ listingId: listing2.id, quantity: 1 }],
    }),
  });
  const order2Json = await resOrder2.json();
  const placedOrder2 = order2Json.orders[0];

  // Buyer cancels order 2 while pending
  const resCancel = await fetch(`${baseUrl}/api/market/orders/${placedOrder2.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: buyerId, status: 'Cancelled', note: 'Found another copy with roommate.' }),
  });
  if (!resCancel.ok) throw new Error('Failed to cancel pending order');
  const cancelJson = await resCancel.json();
  if (cancelJson.order.status !== 'Cancelled') throw new Error(`Expected Cancelled, got ${cancelJson.order.status}`);
  console.log(`✓ Verified: Buyer can cancel Pending order (Status: ${cancelJson.order.status})`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL 17/17 MARKETPLACE FULL-STACK TESTS PASSED!`);
  console.log(`======================================================\n`);

  server.close();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  server.close();
  process.exit(1);
});
