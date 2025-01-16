import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import pool from '../db';

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, role = 'customer' } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Failed to register user",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: "Login failed",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;

  try {
    const user = await UserModel.findOne(userId);
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user profile",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const { name, email } = req.body;

  try {
    const updatedUser = await UserModel.update(userId, { name, email });
    
    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  try {
    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await pool.query(
      "UPDATE users SET reset_code = $1, reset_code_expires = NOW() + INTERVAL '1 hour' WHERE email = $2",
      [resetCode, email]
    );

    console.log(`Reset code for ${email}: ${resetCode}`); 

    res.status(200).json({ 
      message: "Reset code generated successfully",
      resetCode: resetCode 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: "Failed to process request",
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, resetCode, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND reset_code = $2 AND reset_code_expires > NOW()",
      [email, resetCode]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ message: "Invalid or expired reset code" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_code = NULL, reset_code_expires = NULL WHERE email = $2",
      [hashedPassword, email]
    );

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: "Failed to reset password",
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
}