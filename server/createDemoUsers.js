const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Create demo users
const createDemoUsers = async () => {
  try {
    // Check if demo users already exist
    const existingSchool = await User.findOne({ email: 'school@demo.com' });
    if (existingSchool) {
      console.log('Demo users already exist');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create demo users
    const demoUsers = [
      {
        email: 'school@demo.com',
        password: hashedPassword,
        role: 'school',
        isVerified: true
      },
      {
        email: 'donor@demo.com',
        password: hashedPassword,
        role: 'donor',
        isVerified: true
      },
      {
        email: 'college@demo.com',
        password: hashedPassword,
        role: 'college',
        isVerified: true
      },
      {
        email: 'ngo@demo.com',
        password: hashedPassword,
        role: 'ngo',
        isVerified: true
      }
    ];

    await User.insertMany(demoUsers);
    console.log('Demo users created successfully:');
    console.log('- school@demo.com / password123');
    console.log('- donor@demo.com / password123');
    console.log('- college@demo.com / password123');
    console.log('- ngo@demo.com / password123');

  } catch (error) {
    console.error('Error creating demo users:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createDemoUsers();
  process.exit(0);
};

run();