const { PrismaClient } = require('@prisma/client');

async function diagnoseConnection() {
  const prisma = new PrismaClient();
  
  console.log('🔍 Diagnosing database connection with Prisma...');
  
  // Parse DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('💡 Make sure you have a .env or .env.local file with DATABASE_URL');
    return;
  }
  
  try {
    // Parse the URL to show connection details (without password)
    const url = new URL(databaseUrl);
    console.log('🔧 Connection details:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || 3306}`);
    console.log(`   User: ${url.username}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   Password: ${'*'.repeat(url.password?.length || 0)}`);
    
    console.log('\n🔄 Testing Prisma connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful!');
    
    // Test a simple query
    console.log('🔄 Testing database queries...');
    
    // Check if we can query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query test successful:', result);
    
    // Test counting records in existing tables
    try {
      const userCount = await prisma.user.count();
      console.log(`👥 Users in database: ${userCount}`);
    } catch (e) {
      console.log('⚠️  User table query failed:', e.message);
    }
    
    try {
      const regionCount = await prisma.region.count();
      console.log(`🌍 Regions in database: ${regionCount}`);
    } catch (e) {
      console.log('⚠️  Region table query failed:', e.message);
    }
    
    console.log('🎉 Database connection is working! Your Next.js app should be able to connect.');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    
    // Provide specific troubleshooting advice based on error
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting: DNS resolution failed');
      console.log('   - Check if the RDS endpoint is correct');
      console.log('   - Verify the RDS instance is running');
      console.log('   - Check if you have internet connectivity');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting: Connection refused');
      console.log('   - Check RDS security groups (allow port 3306 from your IP)');
      console.log('   - Verify the RDS instance is publicly accessible');
      console.log('   - Check VPC Network ACLs');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Troubleshooting: Connection timeout');
      console.log('   - Check RDS security groups');
      console.log('   - Verify network connectivity');
      console.log('   - Check if RDS is in the correct VPC/subnet');
    } else if (error.message.includes('Access denied')) {
      console.log('\n💡 Troubleshooting: Access denied');
      console.log('   - Check username and password in DATABASE_URL');
      console.log('   - Verify user has proper permissions');
    } else if (error.message.includes('Unknown database')) {
      console.log('\n💡 Troubleshooting: Database does not exist');
      console.log('   - Check database name in DATABASE_URL');
      console.log('   - Create the database if it doesn\'t exist');
    } else {
      console.log('\n💡 General troubleshooting:');
      console.log('   - Verify all connection parameters in DATABASE_URL');
      console.log('   - Check AWS RDS console for instance status');
      console.log('   - Review security group settings (port 3306)');
      console.log('   - Ensure RDS instance is publicly accessible if connecting from outside VPC');
    }
    
    console.log('\n🔧 Quick fixes to try:');
    console.log('   1. Check RDS instance status in AWS Console');
    console.log('   2. Add your IP to RDS security group on port 3306');
    console.log('   3. Verify DATABASE_URL format: mysql://user:pass@host:3306/dbname');
    
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseConnection();
