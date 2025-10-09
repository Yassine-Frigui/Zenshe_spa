/**
 * Admin Password Reset Utility
 * 
 * This script allows you to:
 * 1. Create a new admin user with a password
 * 2. Reset an existing admin's password
 * 3. Hash a password to see what it looks like
 * 
 * Usage:
 *   node reset-admin-password.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { executeQuery } = require('./config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

async function showMenu() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     ADMIN PASSWORD MANAGEMENT UTILITY          ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║  1. Reset existing admin password              ║');
    console.log('║  2. Create new admin user                      ║');
    console.log('║  3. Hash a password (preview)                  ║');
    console.log('║  4. List all admin users                       ║');
    console.log('║  5. Exit                                       ║');
    console.log('╚════════════════════════════════════════════════╝\n');
}

async function listAdmins() {
    try {
        console.log('\n📋 Fetching all admin users...\n');
        const admins = await executeQuery(
            'SELECT id, nom, email, role, actif FROM utilisateurs ORDER BY id'
        );

        if (admins.length === 0) {
            console.log('❌ No admin users found in database!');
            return;
        }

        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║                    ADMIN USERS IN DATABASE                     ║');
        console.log('╠════════════════════════════════════════════════════════════════╣');
        
        admins.forEach(admin => {
            console.log(`║  ID: ${admin.id}`);
            console.log(`║  Name: ${admin.nom}`);
            console.log(`║  Email: ${admin.email}`);
            console.log(`║  Role: ${admin.role || 'N/A'}`);
            console.log(`║  Active: ${admin.actif ? '✅ YES' : '❌ NO'}`);
            console.log('╠────────────────────────────────────────────────────────────────╣');
        });
        
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
    } catch (error) {
        console.error('❌ Error fetching admins:', error.message);
    }
}

async function resetPassword() {
    try {
        await listAdmins();
        
        const email = await question('Enter admin email to reset: ');
        
        // Check if admin exists
        const admin = await executeQuery(
            'SELECT id, nom, email FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (admin.length === 0) {
            console.log(`\n❌ No admin found with email: ${email}\n`);
            return;
        }

        console.log(`\n✅ Found admin: ${admin[0].nom} (${admin[0].email})`);
        
        const newPassword = await question('Enter new password: ');
        const confirmPassword = await question('Confirm new password: ');

        if (newPassword !== confirmPassword) {
            console.log('\n❌ Passwords do not match!\n');
            return;
        }

        if (newPassword.length < 6) {
            console.log('\n❌ Password must be at least 6 characters!\n');
            return;
        }

        console.log('\n🔐 Hashing password...');
        const hashedPassword = await hashPassword(newPassword);
        console.log('✅ Password hashed successfully');
        console.log('Hash preview:', hashedPassword.substring(0, 40) + '...');

        console.log('\n💾 Updating database...');
        await executeQuery(
            'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
            [hashedPassword, email]
        );

        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║          ✅ PASSWORD RESET SUCCESSFUL          ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  Email: ${email.padEnd(40)} ║`);
        console.log(`║  New Password: ${newPassword.padEnd(36)} ║`);
        console.log('╚════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error resetting password:', error.message);
    }
}

async function createAdmin() {
    try {
        console.log('\n📝 Create New Admin User\n');
        
        const nom = await question('Enter name: ');
        const email = await question('Enter email: ');
        const password = await question('Enter password: ');
        const confirmPassword = await question('Confirm password: ');

        if (password !== confirmPassword) {
            console.log('\n❌ Passwords do not match!\n');
            return;
        }

        if (password.length < 6) {
            console.log('\n❌ Password must be at least 6 characters!\n');
            return;
        }

        // Check if email already exists
        const existing = await executeQuery(
            'SELECT id FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            console.log(`\n❌ An admin with email ${email} already exists!\n`);
            return;
        }

        console.log('\n🔐 Hashing password...');
        const hashedPassword = await hashPassword(password);
        console.log('✅ Password hashed successfully');

        console.log('💾 Creating admin user...');
        await executeQuery(
            `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif) 
             VALUES (?, ?, ?, 'admin', TRUE)`,
            [nom, email, hashedPassword]
        );

        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║          ✅ ADMIN CREATED SUCCESSFULLY         ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  Name: ${nom.padEnd(42)} ║`);
        console.log(`║  Email: ${email.padEnd(41)} ║`);
        console.log(`║  Password: ${password.padEnd(38)} ║`);
        console.log(`║  Role: admin${' '.padEnd(38)} ║`);
        console.log('╚════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error creating admin:', error.message);
    }
}

async function hashPasswordOnly() {
    try {
        const password = await question('Enter password to hash: ');
        
        console.log('\n🔐 Hashing password...');
        const hashedPassword = await hashPassword(password);
        
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║              PASSWORD HASH RESULT              ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log(`║  Original: ${password.padEnd(40)} ║`);
        console.log('║                                                ║');
        console.log('║  Hash:                                         ║');
        console.log(`║  ${hashedPassword.substring(0, 46)} ║`);
        console.log(`║  ${hashedPassword.substring(46)} ║`);
        console.log('╚════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Error hashing password:', error.message);
    }
}

async function main() {
    try {
        console.log('\n🔧 Connecting to database...');
        console.log('Database:', process.env.DB_NAME);
        console.log('Host:', process.env.DB_HOST);
        console.log('Port:', process.env.DB_PORT || 3306);

        while (true) {
            await showMenu();
            const choice = await question('Select an option (1-5): ');

            switch (choice) {
                case '1':
                    await resetPassword();
                    break;
                case '2':
                    await createAdmin();
                    break;
                case '3':
                    await hashPasswordOnly();
                    break;
                case '4':
                    await listAdmins();
                    break;
                case '5':
                    console.log('\n👋 Goodbye!\n');
                    rl.close();
                    process.exit(0);
                default:
                    console.log('\n❌ Invalid option. Please select 1-5.\n');
            }
        }
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        rl.close();
        process.exit(1);
    }
}

// Run the script
main();
