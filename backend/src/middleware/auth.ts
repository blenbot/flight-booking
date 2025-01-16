import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

interface UserPayload {
  id: number;
  role: string;
  iat?: number;
  exp?: number;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    req.user = verified;
    
    // Check token expiration
    if (verified.exp && verified.exp < Date.now() / 1000) {
      res.status(401).json({ message: "Token has expired" });
      return;
    }

    (req as any).user = verified;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token has expired" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
    return;
  }
}

export const authorizeAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden: Admin access required' });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error' });
  }
};

export function authorizeCustomer(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req as any).user.role !== 'customer') {
    res.status(403).json({ message: "Access denied: Customers only" });
    return;
  }
  next();
}
