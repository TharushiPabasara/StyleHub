const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env variables
dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // Define developer credentials from env variables
    const devEmail = process.env.DEV_EMAIL;
    const devPassword = process.env.DEV_PASSWORD;

    if (!devEmail || !devPassword) {
      console.error('Error: DEV_EMAIL or DEV_PASSWORD missing in .env file!');
      process.exit(1);
    }

    // Delete existing dev account if it exists to ensure clean state
    await User.deleteOne({ email: devEmail });

    // Create the developer account (pre-verified)
    const devUser = await User.create({
      name: 'Developer Account',
      email: devEmail,
      password: devPassword,
      isVerified: true,
      role: 'developer'
    });

    console.log('✅ Developer account successfully created!');
    console.log('-------------------------------------------');
    console.log(`Email:    ${devEmail}`);
    console.log(`Password: ${devPassword}`);
    console.log('-------------------------------------------');
    console.log('You can now log in using these credentials.');

    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

seedDatabase();
