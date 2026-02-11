import { Request } from 'express';

/**
 * Extracts IP address from request
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (typeof forwarded === 'object' && forwarded?.length) {
    return forwarded[0].split(',')[0].trim();
  }
  return request.ip || request.socket.remoteAddress || 'unknown';
}

/**
 * Detects device type from user agent
 */
export function getDeviceType(userAgent: string | undefined): string {
  if (!userAgent) {
    return 'unknown';
  }

  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }

  if (/desktop|windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }

  return 'web';
}

