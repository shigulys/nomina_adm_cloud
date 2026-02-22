import axios from 'axios';

async function testLogin() {
    try {
        console.log('Enviando petición de login a http://localhost:3003/api/auth/login...');
        const res = await axios.post('http://localhost:3003/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        console.log('✅ Login exitoso:', JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.error('❌ Login fallido:', err.response?.status, err.response?.data);
    }
}

testLogin();
