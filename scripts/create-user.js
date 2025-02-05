const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// Create interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the question method
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  try {
    // Get user input
    const username = await question('Enter username: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password: ');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        username,
        password: hashedPassword,
      },
      create: {
        email,
        username,
        password: hashedPassword,
      },
    });

    console.log('User created successfully:', {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main(); 