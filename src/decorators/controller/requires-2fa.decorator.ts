import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader, ApiResponse } from '@nestjs/swagger';

export const REQUIRES_2FA_KEY = 'requires_2fa';

/**
 * Decorator that marks an endpoint as requiring 2FA authentication.
 * Automatically adds Swagger documentation for 2FA requirements.
 */
export const Requires2FA = () => {
  return applyDecorators(
    SetMetadata(REQUIRES_2FA_KEY, true),
    ApiHeader({
      name: 'X-2FA-Token',
      description: '2FA token obtained from /account/2fa/confirm endpoint. Required only if user has 2FA enabled (EMAIL or PHONE mode).',
      required: false,
      schema: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    }),
    ApiResponse({
      status: 403,
      description: '2FA required - If user has 2FA enabled and X-2FA-Token header is missing, a verification code will be sent and this error returned. Use /account/2fa/confirm to verify the code and get the 2FA token.',
      schema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: '2FA_REQUIRED',
          },
          message: {
            type: 'string',
            example: 'Two-factor authentication required',
          },
        },
      },
    }),
  );
};
