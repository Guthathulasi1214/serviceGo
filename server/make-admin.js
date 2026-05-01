require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'name email role');
    console.log('\nCurrent users:');
    users.forEach(u => console.log(`  ${u.name} | ${u.email} | role: ${u.role}`));

    // Prompt: which email to make admin?
    const email = process.argv[2];
    if (email) {
        const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
        if (user) {
            console.log(`\n✅ ${user.name} (${user.email}) is now an ADMIN!`);
        } else {
            console.log(`\n❌ User with email "${email}" not found`);
        }
    } else {
        console.log('\nTo make a user admin, run:');
        console.log('  node make-admin.js <email>');
    }

    await mongoose.disconnect();
}
main();
