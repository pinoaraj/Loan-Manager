const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
    const username = 'PInoaraj';
    const password = '1977';

    try {
        console.log(`Checking if user '${username}' exists...`);
        const existingUser = await prisma.user.findUnique({ where: { username } });

        if (existingUser) {
            console.log('User already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { username },
                data: { password: hashedPassword }
            });
            console.log('Password updated successfully.');
        } else {
            console.log('Creating new user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: 'ADMIN' // Default role
                }
            });
            console.log('User created successfully.');
        }
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

createUser();
