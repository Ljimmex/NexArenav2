import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../modules/supabase/supabase.service';
import { UsersService } from '../../modules/users/users.service';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No valid authorization header found');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify token with Supabase
      const supabaseUser = await this.supabaseService.verifyToken(token);
      
      if (!supabaseUser) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from our database to check role
      const user = await this.usersService.findBySupabaseId(supabaseUser.id);
      
      if (!user) {
        throw new UnauthorizedException('User not found in database');
      }

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.includes(user.role);
      
      if (!hasRequiredRole) {
        throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
      }

      // Attach user to request object
      request.user = user;
      
      return true;
    } catch (error) {
      console.error('Role guard error:', error);
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}