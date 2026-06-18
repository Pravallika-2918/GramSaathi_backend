require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  await connectDB();
  try {
    // Delete existing admin with this email to start fresh
    await Admin.deleteOne({ email: 'admin@gramsaathi.com' });
    console.log('🗑️  Removed old admin if existed...');

    // Create fresh admin - password will be hashed by pre-save hook
    const admin = await Admin.create({
      name: 'GramSaathi Admin',
      email: 'admin@gramsaathi.com',
      password: 'Admin@1234',
      role: 'admin',
      permissions: {
        manageSchemes: true,
        manageScholarships: true,
        manageUsers: true,
        manageServiceCenters: true,
        viewAnalytics: true,
      },
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email   : admin@gramsaathi.com');
    console.log('   Password : Admin@1234');
    console.log('   ID       :', admin._id.toString());
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();