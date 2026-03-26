const http = require('http');

const runTests = async () => {
    try {
        console.log("Starting CRUD Debug Verification...");
        
        const sendRequest = (path, method, body, token) => {
            return new Promise((resolve, reject) => {
                const options = {
                    hostname: 'localhost',
                    port: 5000,
                    path: path,
                    method: method,
                    headers: { 'Content-Type': 'application/json' }
                };
                if (token) options.headers['Authorization'] = `Bearer ${token}`;

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
                });
                req.on('error', reject);
                if (body) req.write(JSON.stringify(body));
                req.end();
            });
        };

        // 1. Login as Admin
        const loginRes = await sendRequest('/api/users/login', 'POST', {
            email: 'admin@system.com',
            password: 'AdminPassword123!'
        });
        const token = loginRes.body.token;
        console.log("Login Admin Status:", loginRes.status);

        // 2. Create Customer
        const createRes = await sendRequest('/api/customers', 'POST', {
            name: "Test Update Customer",
            email: "test@domain.com",
            phone: "123",
            company: "Comp",
            balance: 100
        }, token);
        console.log("Create Customer Status:", createRes.status);
        const custId = createRes.body._id;

        // 3. Update Customer
        const updateRes = await sendRequest(`/api/customers/${custId}`, 'PUT', {
            name: "Updated Name",
            balance: 200
        }, token);
        console.log("Update Customer Status:", updateRes.status);
        if (updateRes.status !== 200) console.log("Update error:", updateRes.body);

        // 4. Delete Customer
        const deleteRes = await sendRequest(`/api/customers/${custId}`, 'DELETE', null, token);
        console.log("Delete Customer Status:", deleteRes.status);
        if (deleteRes.status !== 200) console.log("Delete error:", deleteRes.body);

    } catch (err) {
        console.error("Test Error:", err);
    }
};

runTests();
