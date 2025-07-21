// File: server/routes/auth.js

// --- Use import instead of require ---
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Note: .js extension is often needed in ES Modules

const router = express.Router();

// == REGISTER A NEW USER ==
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// == LOGIN A USER ==
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Create JWT
        const token = jwt.sign(
            { userId: user._id }, // Keep the payload minimal
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- Use export default instead of module.exports ---
export default router;