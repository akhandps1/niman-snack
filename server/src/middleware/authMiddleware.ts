import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from '../config/firebase-admin';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: string;
  };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch role from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    let role = 'user';
    if (userDoc.exists) {
      role = userDoc.data()?.role || 'user';
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role
    };

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
