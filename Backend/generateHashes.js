const bcrypt = require('bcrypt');

const adminUsers = [
  { email: 'admin1@example.com', password: 'admin1password' },
  { email: 'admin2@example.com', password: 'admin2password' },
];

async function generateHashes() {
  for (let user of adminUsers) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    console.log(`Email: ${user.email}, Hashed Password: ${hashedPassword}`);
  }
}

generateHashes();