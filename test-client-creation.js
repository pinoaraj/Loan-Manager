// Test script to verify client creation API endpoint
const API_URL = 'http://localhost:3001/api';

// First, let's login to get a token
async function login() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Login successful');
        return data.token;
    } catch (error) {
        console.error('❌ Login error:', error.message);
        throw error;
    }
}

// Test client creation
async function testCreateClient(token) {
    const testClient = {
        name: 'Test Cliente Fix',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Direccion de Prueba'
    };

    try {
        console.log('\n🧪 Testing client creation with:', testClient);

        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testClient)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Creation failed:', errorData);
            throw new Error(errorData.error || 'Failed to create client');
        }

        const newClient = await response.json();
        console.log('✅ Client created successfully:', newClient);
        return newClient;
    } catch (error) {
        console.error('❌ Error creating client:', error.message);
        throw error;
    }
}

// Test with empty phone (should work now)
async function testCreateClientWithoutPhone(token) {
    const testClient = {
        name: 'Test Cliente Sin Telefono',
        email: 'sintelefono@example.com',
        phone: '',
        address: ''
    };

    try {
        console.log('\n🧪 Testing client creation without phone:', testClient);

        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testClient)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Creation failed:', errorData);
            throw new Error(errorData.error || 'Failed to create client');
        }

        const newClient = await response.json();
        console.log('✅ Client created successfully (without phone):', newClient);
        return newClient;
    } catch (error) {
        console.error('❌ Error creating client:', error.message);
        throw error;
    }
}

// Run the tests
async function runTests() {
    try {
        console.log('🚀 Starting client creation tests...\n');

        // Login
        const token = await login();

        // Test 1: Create client with all fields
        await testCreateClient(token);

        // Test 2: Create client without optional fields
        await testCreateClientWithoutPhone(token);

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        globalThis.process.exit(1);
    }
}

runTests();
