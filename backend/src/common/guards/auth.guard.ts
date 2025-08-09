import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../modules/supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;
      console.log('=== AUTH GUARD DEBUG ===');
      console.log('Auth header:', authHeader ? `${authHeader.substring(0, 50)}...` : 'NO HEADER');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid auth header format');
        throw new UnauthorizedException('No valid authorization header found');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Extracted token:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
      console.log('Token length:', token?.length || 0);
      
      // Verify token with Supabase
      const user = await this.supabaseService.verifyToken(token);
      
      if (!user) {
        console.log('Token verification returned no user');
        throw new UnauthorizedException('Invalid token');
      }

      console.log('Token verification successful, user ID:', user.id);
      // Attach user to request object
      request.user = user;
      
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}