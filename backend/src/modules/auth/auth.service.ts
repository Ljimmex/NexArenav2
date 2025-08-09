import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async handleWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      const { type, record } = payload;
      
      this.logger.log(`Received webhook: ${type}`, record);

      switch (type) {
        case 'INSERT':
          await this.handleUserCreated(record);
          break;
        case 'UPDATE':
          await this.handleUserUpdated(record);
          break;
        case 'DELETE':
          await this.handleUserDeleted(record);
          break;
        default:
          this.logger.warn(`Unknown webhook type: ${type}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  async syncUser(supabaseUserId: string): Promise<any> {
    try {
      // Get user from Supabase
      const supabaseUser = await this.supabaseService.getSupabaseUser(supabaseUserId);
      
      if (!supabaseUser) {
        throw new Error('User not found in Supabase');
      }

      // Check if user already exists in our database
      const existingUser = await this.usersService.findBySupabaseId(supabaseUserId);
      
      if (existingUser) {
        // Update existing user
        return await this.usersService.update(existingUser.id, {
          email: supabaseUser.email,
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0],
          display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        });
      } else {
        // Create new user
        return await this.usersService.create({
          supabase_user_id: supabaseUserId,
          email: supabaseUser.email,
          username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || `user_${Date.now()}`,
          display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        });
      }
    } catch (error) {
      this.logger.error('Error syncing user:', error);
      throw error;
    }
  }

  private async handleUserCreated(record: any): Promise<void> {
    try {
      this.logger.log('Handling user created event', record);
      
      // Extract user data from Supabase auth record
      const userData = {
        supabase_user_id: record.id,
        email: record.email,
        username: record.raw_user_meta_data?.username || record.email?.split('@')[0] || `user_${Date.now()}`,
        display_name: record.raw_user_meta_data?.display_name || record.raw_user_meta_data?.full_name,
        avatar_url: record.raw_user_meta_data?.avatar_url,
      };

      // Create user in our database
      await this.usersService.create(userData);
      
      this.logger.log(`User created successfully: ${record.id}`);
    } catch (error) {
      this.logger.error('Error handling user created event:', error);
      // Don't throw here to avoid webhook failures
    }
  }

  private async handleUserUpdated(record: any): Promise<void> {
    try {
      this.logger.log('Handling user updated event', record);
      
      // Find user in our database
      const existingUser = await this.usersService.findBySupabaseId(record.id);
      
      if (existingUser) {
        // Update user data
        const updateData = {
          email: record.email,
          username: record.raw_user_meta_data?.username || existingUser.username,
          display_name: record.raw_user_meta_data?.display_name || record.raw_user_meta_data?.full_name,
          avatar_url: record.raw_user_meta_data?.avatar_url,
        };

        await this.usersService.update(existingUser.id, updateData);
        
        this.logger.log(`User updated successfully: ${record.id}`);
      } else {
        this.logger.warn(`User not found for update: ${record.id}`);
        // Create user if it doesn't exist
        await this.handleUserCreated(record);
      }
    } catch (error) {
      this.logger.error('Error handling user updated event:', error);
      // Don't throw here to avoid webhook failures
    }
  }

  private async handleUserDeleted(record: any): Promise<void> {
    try {
      this.logger.log('Handling user deleted event', record);
      
      // Find user in our database
      const existingUser = await this.usersService.findBySupabaseId(record.id);
      
      if (existingUser) {
        // Soft delete or mark as inactive instead of hard delete
        await this.usersService.update(existingUser.id, {
          is_active: false,
        });
        
        this.logger.log(`User marked as inactive: ${record.id}`);
      } else {
        this.logger.warn(`User not found for deletion: ${record.id}`);
      }
    } catch (error) {
      this.logger.error('Error handling user deleted event:', error);
      // Don't throw here to avoid webhook failures
    }
  }
}