const http = require('http');

async function test() {
  try {
    // 1. Login user
    const resAuth = await fetch('http://localhost:5005/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@system.com', password: 'UserPassword123!' })
    });
    
    if (!resAuth.ok) {
        console.log("Login failed");
        return;
    }
    const { token } = await resAuth.json();
    console.log("Got token");

    // 2. Fetch a product
    const resProd = await fetch('http://localhost:5005/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await resProd.json();
    const product = products.find(p => p.stock > 0);
    if (!product) {
       console.log("No product with stock > 0");
       return;
    }

    // 3. Create an invoice
    const resInv = await fetch('http://localhost:5005/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        number: `INV-${Date.now()}`,
        customerName: 'Test Dummy',
        date: new Date().toISOString(),
        amountPaid: 0,
        items: [{
           product: product._id,
           quantity: 1,
           price: product.price
        }]
      })
    });

    const data = await resInv.json();
    console.log("INVOICE STATUS:", resInv.status);
    console.log("RESPONSE:", data);
  } catch(e) {
    console.error(e);
  }
}
test();
