import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from '../types/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();
    const store = {
      correlationId,
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        ip:
          req.ip ||
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress,
        ua: req.headers['user-agent'],
        headers: {
          subdomain:
            req.headers['x-tenant'] || req.headers['x-company-subdomain'] || null,
        },
      },
    } as any;

    // If req.user already available (auth ran earlier), include it
    if ((req as any).user) {
      store.userId = (req as any).userId ?? undefined;
      store.companyId = (req as any).userCompany ?? undefined;
      store.locationId = (req as any).userLocation ?? undefined;
    }

    RequestContext.run(store, () => next());
  }
}
