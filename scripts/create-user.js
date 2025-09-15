const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser(userData) {
  try {
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      console.error('❌ User with this email or username already exists');
      return null;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate unique ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    console.log('✅ User created successfully:');
    console.log('ID:', userWithoutPassword.id);
    console.log('Name:', userWithoutPassword.name);
    console.log('Username:', userWithoutPassword.username);
    console.log('Email:', userWithoutPassword.email);
    console.log('Created At:', userWithoutPassword.createdAt);

    return userWithoutPassword;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage
async function main() {
  const userData = {
    name: "John Doe",
    username: "johndoe",
    email: "john.doe@example.com",
    password: "password123"
  };

  await createUser(userData);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createUser };
