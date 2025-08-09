import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { UsersService } from '../../modules/users/users.service';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;
      console.log('AdminGuard: Authorization header:', authHeader ? 'Present' : 'Missing');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('AdminGuard: No valid authorization header found');
        throw new UnauthorizedException('No valid authorization header found');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('AdminGuard: Token extracted, length:', token.length);
      
      // Verify token with Supabase
      const supabaseUser = await this.supabaseService.verifyToken(token);
      console.log('AdminGuard: Supabase user verified:', supabaseUser ? supabaseUser.id : 'null');
      
      if (!supabaseUser) {
        console.log('AdminGuard: Invalid token');
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from our database to check role
      const user = await this.usersService.findBySupabaseId(supabaseUser.id);
      console.log('AdminGuard: User found in database:', user ? `ID: ${user.id}, Role: ${user.role}` : 'null');
      
      if (!user) {
        console.log('AdminGuard: User not found in database');
        throw new UnauthorizedException('User not found in database');
      }

      // Check if user has admin role
      if (user.role !== UserRole.ADMIN) {
        console.log(`AdminGuard: User role is ${user.role}, but ADMIN required`);
        throw new ForbiddenException('Admin access required');
      }

      console.log('AdminGuard: Access granted for admin user');
      // Attach user to request object
      request.user = user;
      
      return true;
    } catch (error) {
      console.error('Admin guard error:', error);
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}