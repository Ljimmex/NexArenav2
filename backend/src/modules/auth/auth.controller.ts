import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Supabase auth webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('authorization') authHeader: string,
  ) {
    // Verify webhook signature (you should implement proper verification)
    // For now, we'll just check if the header exists
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    return this.authService.handleWebhook(payload);
  }

  @Post('sync-user')
  @ApiOperation({ summary: 'Manually sync user from Supabase to backend' })
  @ApiResponse({ status: 200, description: 'User synced successfully' })
  async syncUser(@Body() body: { supabaseUserId: string }) {
    return this.authService.syncUser(body.supabaseUserId);
  }
}