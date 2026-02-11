import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

type SSEPayload = Record<string, any>;

@Injectable()
export class UploadSessionService {
  private readonly logger = new Logger(UploadSessionService.name);
  private clients = new Map<string, Response>();

  createSession(): string {
    const id = randomUUID();
    return id;
  }

  subscribe(sessionId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);

    this.clients.set(sessionId, res);

    const keepAlive = setInterval(() => {
      try {
        res.write(`event: ping\ndata: {}\n\n`);
      } catch (e) {
      }
    }, 20000);

    reqOnClose(res, () => {
      clearInterval(keepAlive);
      this.clients.delete(sessionId);
      this.logger.debug(`SSE client disconnected: ${sessionId}`);
    });
  }

  emit(sessionId: string, payload: SSEPayload) {
    const res = this.clients.get(sessionId);
    if (!res) return false;
    try {
      res.write(`event: progress\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      return true;
    } catch (e) {
      this.clients.delete(sessionId);
      return false;
    }
  }

  close(sessionId: string, payload?: SSEPayload) {
    const res = this.clients.get(sessionId);
    if (!res) return;
    if (payload) {
      try {
        res.write(`event: done\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) {
      }
    }
    try {
      res.end();
    } catch (e) {
    }
    this.clients.delete(sessionId);
  }
}

function reqOnClose(res: Response, cb: () => void) {
  const sock = (res as any).socket;
  if (sock) {
    sock.on('close', cb);
    sock.on('end', cb);
  } else {
    (res as any).on?.('close', cb);
  }
}
