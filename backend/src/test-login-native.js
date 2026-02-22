const http = require('http');

const data = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('--- Test de Login Directo ---');
const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let responseBody = '';
    res.on('data', (chunk) => {
        responseBody += chunk;
    });
    res.on('end', () => {
        console.log('Response:', responseBody);
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
    process.exit(1);
});

req.write(data);
req.end();
