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
        
        console.log('--- TEST 1: 404 API Route Leak Prevention ---');
        const res404 = await fetch(`${API_URL}/this-route-does-nowhere`);
        const data404 = await res404.text();
        
        if (res404.status === 404 && data404.includes("Can't find") && !data404.includes("<html")) {
            console.log('✅ PASS: API 404 returns correct JSON error instead of React HTML.');
        } else {
            console.error('❌ FAIL: API 404 returned incorrect format:', res404.status, data404.substring(0, 100));
        }

        console.log('\n--- TEST 2: Native AppError Extrapolations (Validation Error) ---');
        const resProd = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name: '' }) // Deliberately blank to trigger 400 Validation Error internally
        });
        const dataProd = await resProd.json();
        
        if (resProd.status === 400 && dataProd.message === 'Product name is required') {
             console.log('✅ PASS: catchAsync naturally bridged the 400 Validation AppError smoothly.');
        } else {
             console.error('❌ FAIL: Error handling pipeline failed to bubble Validation exception:', resProd.status, dataProd);
        }

        console.log('\n--- TEST 3: MongoDB Database Exceptions Translate (CastError) ---');
        const resCast = await fetch(`${API_URL}/products/invalid-database-id-string`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ name: 'Testing Cast Error' })
        });
        const dataCast = await resCast.json();
        
        if (resCast.status === 400 && dataCast.message.includes('Invalid _id')) {
             console.log('✅ PASS: Global error handler securely translated the raw MongoDB CastError into a 400 Client Request Error.');
        } else {
             console.error('❌ FAIL: Raw MongoDB crash leaked or status code reverted to 200 bug:', resCast.status, dataCast);
        }

    } catch (e) {
        console.error('Test Crash Exception:', e);
    }
}

runTests();
