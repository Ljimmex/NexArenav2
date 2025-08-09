import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient; // Service role client for admin operations
  private anonSupabase: SupabaseClient; // Anon client for user token verification

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Supabase URL, Service Role Key, and Anon Key must be provided');
    }

    // Service role client for admin operations
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Anon client for user token verification
    this.anonSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Verify JWT token from Supabase
  async verifyToken(token: string): Promise<any> {
    try {
      console.log('=== TOKEN VERIFICATION START ===');
      console.log('Token received:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
      console.log('Token length:', token?.length || 0);

      if (!token) {
        throw new Error('No token provided');
      }

      // Use the admin client to verify the token
      const { data, error } = await this.supabase.auth.getUser(token);
      
      console.log('Supabase getUser response:');
      console.log('- hasData:', !!data);
      console.log('- hasUser:', !!data?.user);
      console.log('- user ID:', data?.user?.id);
      console.log('- error:', error?.message || 'NO ERROR');

      if (error) {
        console.log('Token verification failed:', error.message);
        throw new Error(`Token verification failed: ${error.message}`);
      }

      if (!data?.user) {
        console.log('No user found in token verification response');
        throw new Error('No user found in token');
      }

      console.log('Token verification successful for user:', data.user.id);
      return data.user;
    } catch (error) {
      console.log('CATCH ERROR:', error.message);
      console.log('=== TOKEN VERIFICATION FAILED ===');
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Get user from Supabase Auth
  async getSupabaseUser(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      
      if (error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }
      
      return data.user;
    } catch (error) {
      console.error('Error getting Supabase user:', error);
      throw error;
    }
  }

  // Listen to auth changes (for webhooks)
  async handleAuthEvent(event: string, user: any): Promise<void> {
    console.log(`Handling auth event: ${event}`, user);
    
    // This method will be called by webhooks to sync user data
    // Implementation will depend on the specific event type
    switch (event) {
      case 'user.created':
        console.log('New user created:', user.id);
        break;
      case 'user.updated':
        console.log('User updated:', user.id);
        break;
      case 'user.deleted':
        console.log('User deleted:', user.id);
        break;
      default:
        console.log('Unknown auth event:', event);
    }
  }
}