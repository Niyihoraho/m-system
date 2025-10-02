const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query to verify the connection works
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in the database`);
    
    // Test another table
    const regionCount = await prisma.region.count();
    console.log(`🌍 Found ${regionCount} regions in the database`);
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This usually means the database host is incorrect or unreachable');
    } else if (error.message.includes('Access denied')) {
      console.log('💡 This usually means the username/password is incorrect');
    } else if (error.message.includes('Unknown database')) {
      console.log('💡 This usually means the database name is incorrect');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
