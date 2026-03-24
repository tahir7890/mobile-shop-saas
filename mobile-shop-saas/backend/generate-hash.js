const bcrypt = require('bcryptjs');

// Generate bcrypt hash for "admin123"
const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        process.exit(1);
    }
    
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\nUse this hash in your database schema.sql file');
    
    process.exit(0);
});
