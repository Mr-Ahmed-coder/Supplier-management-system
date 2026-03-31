const API_URL = 'http://localhost:5000/api';
let token = '';

async function runTest() {
    try {
        console.log('Logging in as Admin...');
        const loginRes = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@system.com', password: 'AdminPassword123!' })
        });
        const loginData = await loginRes.json();
        token = loginData.token;

        if (!token) throw new Error('Auth failed');

        console.log('Fetching products to build cart...');
        const prodRes = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` }});
        const products = await prodRes.json();
        if(products.length === 0) throw new Error('No products in DB to test POS');
        const p1 = products[0];

        // Ensure fake product has stock
        if (p1.stock < 1) {
            console.log('Test aborted: First product has no stock.');
            return;
        }

        const invPayload = {
            number: `POS-TEST-${Date.now()}`,
            customerName: 'POS Automated Tester',
            date: new Date().toISOString(),
            amountPaid: p1.price - 100, // Deliberately partial
            items: [{
                product: p1._id,
                productName: p1.name,
                quantity: 1,
                price: p1.price
            }]
        };

        console.log(`Submitting POS Partial Invoice (Paid ${invPayload.amountPaid} for Total ${p1.price})...`);
        const invRes = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(invPayload)
        });
        const invoiceData = await invRes.json();

        if (invRes.ok) {
           console.log('✅ POS Creation Successful:');
           console.log(`   Total: ${invoiceData.totalAmount}`);
           console.log(`   Amount Paid: ${invoiceData.amountPaid}`);
           console.log(`   Balance: ${invoiceData.balance}`);
           console.log(`   Calculated Status: ${invoiceData.status}`);
           
           if (invoiceData.status === 'Partial') {
               console.log('✅ Auto-Status Resolution PASSED.');
           } else {
               console.error('❌ Auto-Status Resolution FAILED:', invoiceData.status);
           }
        } else {
           console.error('❌ POS Creation FAILED:', invoiceData);
        }

    } catch(e) { console.error('Test crash:', e); }
}

runTest();
