console.log('1. Start');
try {
    console.log('2. Requiring express...');
    const express = require('express');
    console.log('3. Express required');

    console.log('4. Requiring bcryptjs...');
    const bcrypt = require('bcryptjs');
    console.log('5. Bcryptjs required');

    console.log('6. Requiring jsonwebtoken...');
    const jwt = require('jsonwebtoken');
    console.log('7. Jsonwebtoken required');

    console.log('8. Requiring supabaseClient...');
    // Usar path relativo correcto
    const supabaseClient = require('./config/supabaseClient');
    console.log('9. SupabaseClient required');

    console.log('10. Success!');
    process.exit(0);
} catch (err) {
    console.error('❌ Error during require:', err);
    process.exit(1);
}
