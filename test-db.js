const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('--- DB Debugger Start ---');
console.log('Testing URI:', uri ? uri.replace(/:.+@/, ':****@') : 'MISSING');

mongoose.connect(uri)
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.log('FAILURE: Connection failed!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.message.includes('auth')) {
            console.log('\n--- Troubleshooting Tips ---');
            console.log('1. Check if Username/Password are exactly correct.');
            console.log('2. Check if user has "Read and Write to any Database" permissions.');
            console.log('3. Ensure "Network Access" allows 0.0.0.0/0.');
        }
        process.exit(1);
    });
