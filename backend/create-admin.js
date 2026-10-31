const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

// This command promotes one explicitly selected existing account. It never
// creates users, changes passwords, or deletes other accounts.
async function promoteExistingAccount() {
  const args = process.argv.slice(2);
  const targetId = args[0];
  const confirmationPhone = args[1];
  const confirmed = args.includes('--confirm-promote');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!targetId || !confirmationPhone || !confirmed) {
    throw new Error('Usage: npm run ensure-admin -- <user-id> <confirmed-phone> --confirm-promote');
  }
  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGODB_URI must point to the intended database. No database fallback is allowed.');
  }

  await mongoose.connect(mongoUri);
  const user = await User.findById(targetId);
  if (!user || user.phone !== confirmationPhone) {
    throw new Error('The supplied user ID and phone do not identify the same account. No changes made.');
  }

  if (user.role === 'admin') {
    console.log('The selected account already has the admin role. No changes made.');
    return;
  }

  user.role = 'admin';
  await user.save();
  console.log(`Promoted the selected account (${user._id}) to admin. No other accounts were changed.`);
}

if (require.main === module) {
  promoteExistingAccount()
    .catch((error) => {
      console.error(`Admin promotion stopped: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = { promoteExistingAccount };
