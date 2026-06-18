const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');
const db = require('../db');
const errorHandler = require('../utils/errorHandler');

class UserController {
    // ========================================
    // REGISTRATION - CRITICAL CHANGE
    // NO pre-check for email existence
    // Let database enforce uniqueness via INDEX
    // Catch error code 23505 (PostgreSQL) or 1062 (MySQL)
    // ========================================
    register = async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);

            // CRITICAL: No SELECT query to check if email exists
            // Just attempt INSERT and let database catch the violation
            try {
                const user = await db.query(
                    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
                    [name, email, hashPassword]
                );
                const newUser = user.rows[0];
                const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                const link = `${process.env.BASE_URL}/api/confirm/${token}`;

                res.status(201).json({ message: 'User created, verify email' });
                this.sendEmail(newUser.email, link).catch(err => console.error('Mail error:', err));
            } catch (dbError) {
                // CRITICAL: Catch database unique constraint violation
                // Error code 23505 = unique violation in PostgreSQL
                // Error code 1062 = duplicate key in MySQL
                if (dbError.code === '23505' || dbError.code === '1062') {
                    return res.status(409).json({
                        message: 'This email is already registered. Try a different email.'
                    });
                }
                throw dbError;
            }
        } catch (error) {
            errorHandler(res, error);
        }
    };

    sendEmail = async (email, link) => {
        console.log(`Sending verification email to ${email}`);
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Confirm your email',
                html: `<a href="${link}">Click here to activate your account</a>`
            });
            console.log(`Email sent to ${email}`);
        } catch (error) {
            console.error('Email error:', error);
        }
    };

    confirmEmail = async (req, res) => {
        try {
            const { token } = req.params;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await db.query(
                "UPDATE users SET status = 'active' WHERE id = $1 AND status != 'blocked'",
                [decoded.id]
            );
            res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
        } catch (e) {
            res.status(400).send('Invalid or expired token');
        }
    };

    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = existingUser.rows[0];

            if (!user) {
                return res.status(401).json({ message: 'Incorrect email or password' });
            }

            if (user.status === 'blocked') {
                return res.status(403).json({ message: 'Your account is blocked' });
            }

            const isComparePassword = bcrypt.compareSync(password, user.password);
            if (!isComparePassword) {
                return res.status(401).json({ message: 'Incorrect email or password' });
            }

            await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.status(200).json({
                token: `Bearer ${token}`,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    status: user.status
                }
            });
        } catch (error) {
            errorHandler(res, error);
        }
    };

    getUsers = async (req, res) => {
        try {
            const users = await db.query(
                'SELECT id, name, email, last_login_at, registration_at, status, previous_status FROM users ORDER BY last_login_at DESC'
            );
            res.status(200).json(users.rows);
        } catch (error) {
            errorHandler(res, error);
        }
    };

    blockUsers = async (req, res) => {
        try {
            const { ids, status } = req.body;
            if (!ids || ids.length === 0) {
                return res.status(400).json({ message: 'No users selected' });
            }

            let queryText;
            let params;

            if (status === 'blocked') {
                // Blocking: Save current status first
                queryText = `
                    UPDATE users 
                    SET status = $1, 
                        previous_status = status 
                    WHERE id = ANY($2) 
                    AND status != 'blocked'
                `;
                params = [status, ids];
            } else {
                // Unblocking: Restore previous status
                queryText = `
                    UPDATE users 
                    SET status = COALESCE(previous_status, 'active'),
                        previous_status = NULL 
                    WHERE id = ANY($1)
                `;
                params = [ids];
            }

            await db.query(queryText, params);

            res.status(200).json({
                message: `Users successfully ${status === 'blocked' ? 'blocked' : 'unblocked'}`
            });
        } catch (error) {
            console.error("Block/Unblock Error:", error); // ← Add this for debugging
            errorHandler(res, error);
        }
    };

    deleteUsers = async (req, res) => {
        try {
            const { ids } = req.body;
            if (!ids || ids.length === 0) {
                return res.status(400).json({ message: 'No users selected' });
            }
            await db.query('DELETE FROM users where id = ANY($1)', [ids]);
            res.status(200).json({
                message: 'Users successfully deleted'
            });
        } catch (error) {
            errorHandler(res, error);
        }
    };

    deleteUnverified = async (req, res) => {
        try {
            const result = await db.query(
                "DELETE FROM users WHERE status = 'unverified' RETURNING id"
            );
            res.status(200).json({
                message: `${result.rows.length} unverified users deleted successfully`
            });
        } catch (error) {
            errorHandler(res, error);
        }
    };

    // ========================================
    // Email verification emulation
    // Route: /api/users/verify-email-emulation
    // Directly update user status from unverified to active
    // ========================================
    verifyEmailEmulation = async (req, res) => {
        try {
            const userId = req.user?.id; // Get from JWT token (authenticated user)

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const result = await db.query(
                "UPDATE users SET status = 'active' WHERE id = $1 AND status = 'unverified' RETURNING id, status",
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found or already verified' });
            }

            res.status(200).json({
                message: 'Email verified successfully',
                user: result.rows[0]
            });
        } catch (error) {
            errorHandler(res, error);
        }
    };
}

module.exports = new UserController();

