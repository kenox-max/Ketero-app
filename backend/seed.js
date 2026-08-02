const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ketero';

const SEED_PROFILES = [
  {
    name: 'Selamawit Kebede',
    phone: '0911000001',
    password: 'password123',
    age: 24,
    location: 'Addis Ababa',
    religion: 'Orthodox',
    languages: ['Amharic', 'English'],
    hobbies: ['Traditional Coffee', 'Jazz Music', 'Reading'],
    profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
    verifiedStatus: true,
    isPremium: false,
    isSystemUser: true,
  },
  {
    name: 'Bekele Desta',
    phone: '0911000002',
    password: 'password123',
    age: 27,
    location: 'Hawassa',
    religion: 'Protestant',
    languages: ['Afaan Oromoo', 'Amharic'],
    hobbies: ['Lakeside walks', 'Fish Cutlets', 'Football'],
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
    verifiedStatus: true,
    isPremium: true,
    isSystemUser: true,
  },
  {
    name: 'Fatuma Mohammed',
    phone: '0911000003',
    password: 'password123',
    age: 22,
    location: 'Adama',
    religion: 'Muslim',
    languages: ['Amharic', 'Afaan Oromoo', 'English'],
    hobbies: ['Traditional spices', 'Baking', 'Volunteering'],
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
    verifiedStatus: false,
    isPremium: false,
    isSystemUser: true,
  },
  {
    name: 'Dawit Yohannes',
    phone: '0911000004',
    password: 'password123',
    age: 29,
    location: 'Bahir Dar',
    religion: 'Orthodox',
    languages: ['Amharic', 'Tigrinya'],
    hobbies: ['Lake Tana tours', 'Monastery History', 'Biking'],
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    verifiedStatus: false,
    isPremium: false,
    isSystemUser: true,
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);
    console.log('Database connected.');

    const salt = await bcrypt.genSalt(10);

    for (const profile of SEED_PROFILES) {
      const exists = await User.findOne({ phone: profile.phone });
      if (exists) {
        console.log(`User with phone ${profile.phone} (${profile.name}) already exists. Skipping.`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(profile.password, salt);
      const user = new User({
        ...profile,
        password: hashedPassword,
      });

      await user.save();
      console.log(`Successfully seeded system user: ${profile.name}`);
    }

    console.log('Seeding process finished.');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seed();
