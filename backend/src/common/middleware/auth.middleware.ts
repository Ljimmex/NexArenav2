import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../../modules/supabase/supabase.service';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly supabaseService: SupabaseService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No valid authorization header found');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify token with Supabase
      const user = await this.supabaseService.verifyToken(token);
      
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user to request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}