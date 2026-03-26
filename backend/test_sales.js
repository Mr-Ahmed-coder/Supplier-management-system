const mongoose = require('mongoose');

// Adjust this URL to match the local dev server
const API_URL = 'http://localhost:5000/api';
let token = '';

async function loginAdmin() {
    const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@system.com', password: 'AdminPassword123!' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Login failed: ' + data.message);
    token = data.token;
    console.log('✅ Admin Logged In');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function runTests() {
    try {
        await loginAdmin();

        // 1. Fetch Products
        const prodRes = await fetch(`${API_URL}/products`, { headers: authHeaders() });
        const products = await prodRes.json();
        if (products.length === 0) {
            console.log('⚠️ No products found. Aborting test.');
            return;
        }

        const testProduct = products[0];
        console.log(`\n📦 Testing against Product: ${testProduct.name} | Current Stock: ${testProduct.stock}`);

        // Generate dynamic invoice numbers safely
        const invNum1 = 'TEST-FAIL-' + Date.now();
        const invNum2 = 'TEST-PASS-' + Date.now();
        
        // 2. Test Out of Stock Exception
        console.log(`\n➡️ Attempting to buy ${testProduct.stock + 10} units (Exceeding max stock by 10)...`);
        const failRes = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                number: invNum1,
                customerName: 'Test Buyer Failed',
                date: new Date().toISOString(),
                status: 'Pending',
                items: [{
                    product: testProduct._id,
                    productName: testProduct.name,
                    quantity: testProduct.stock + 10,
                    price: testProduct.price
                }]
            })
        });
        const failData = await failRes.json();
        if (failRes.status === 400 && failData.message.includes('Not enough stock')) {
            console.log('✅ PASS: Server accurately rejected the transaction due to insufficient stock.');
        } else {
            console.error('❌ FAIL: Server unexpectedly permitted the transaction or failed incorrectly.');
            console.log('Status:', failRes.status, failData);
        }

        // 3. Test Successful Purchase & Deduction
        console.log(`\n➡️ Attempting to buy 1 unit (Valid transaction)...`);
        const okRes = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                number: invNum2,
                customerName: 'Test Buyer Success',
                date: new Date().toISOString(),
                status: 'Pending',
                items: [{
                    product: testProduct._id,
                    productName: testProduct.name,
                    quantity: 1,
                    price: testProduct.price
                }]
            })
        });
        const okData = await okRes.json();
        if (okRes.status === 201) {
            console.log('✅ PASS: Server successfully processed the valid invoice transaction.');
        } else {
            console.error('❌ FAIL: Invoice creation rejected:', okRes.status, okData);
        }

        // 4. Verify Stock Deduction
        console.log(`\n➡️ Verifying Real-Time Stock Deduction...`);
        const checkRes = await fetch(`${API_URL}/products`, { headers: authHeaders() });
        const checkProducts = await checkRes.json();
        const updatedProduct = checkProducts.find(p => p._id === testProduct._id);
        
        if (updatedProduct.stock === testProduct.stock - 1) {
            console.log(`✅ PASS: Database properly decremented stock from ${testProduct.stock} to ${updatedProduct.stock}.`);
        } else {
            console.error(`❌ FAIL: Stock was not updated correctly! Expected ${testProduct.stock - 1} but got ${updatedProduct.stock}.`);
        }

    } catch (e) {
        console.error('Test Crash Exception:', e);
    }
}

runTests();
