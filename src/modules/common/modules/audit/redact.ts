import crypto from 'crypto';

export type RedactionOptions = {
  keys?: string[];
  contains?: string[];
  patterns?: RegExp[];
  strategy?: 'mask' | 'hash';
  maskPlaceholder?: string;
  hashLength?: number;
  recursive?: boolean;
};

const DEFAULT_OPTIONS: Required<RedactionOptions> = {
  keys: ['password', 'token', 'secret', 'ssn', 'creditcard', 'card_number', 'cvv', 'salt', 'refresh_token'],
  contains: ['password', 'secret', 'token', 'card', 'credit', 'ssn'],
  patterns: [],
  strategy: 'mask',
  maskPlaceholder: '[REDACTED]',
  hashLength: 10,
  recursive: true,
};

function shouldRedact(path: string, key: string, opts: Required<RedactionOptions>): boolean {
  const lcKey = key.toLowerCase();
  const lcPath = path.toLowerCase();

  for (const k of opts.keys) {
    if (lcKey === k.toLowerCase()) return true;
  }

  for (const c of opts.contains) {
    if (lcKey.includes(c.toLowerCase())) return true;
    if (lcPath.includes(c.toLowerCase())) return true;
  }

  for (const rx of opts.patterns) {
    if (rx.test?.(path) || rx.test?.(key)) return true;
  }

  return false;
}

function hashValue(value: any, length = 10): string {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return crypto.createHash('sha256').update(s).digest('hex').slice(0, length);
  } catch {
    return '[HASH_ERROR]';
  }
}

export function redact(obj: any, options?: RedactionOptions): any {
  const opts: Required<RedactionOptions> = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    patterns: (options?.patterns || []).map((p) => (p instanceof RegExp ? p : new RegExp(String(p), 'i'))),
  } as any;

  function _redact(value: any, path = ''): any {
    if (value === null || value === undefined) return value;

    if (value instanceof Date) return value;
    if (Buffer.isBuffer(value)) {
      return opts.strategy === 'hash' ? `[HASH:${hashValue(value.toString('hex'), opts.hashLength)}]` : opts.maskPlaceholder;
    }

    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') return value;

    if (Array.isArray(value)) {
      return value.map((v, i) => _redact(v, `${path}[${i}]`));
    }

    if (t === 'object') {
      const out: any = {};
      for (const k of Object.keys(value)) {
        const fieldPath = path ? `${path}.${k}` : k;
        const val = value[k];

        if (shouldRedact(fieldPath, k, opts)) {
          out[k] = opts.strategy === 'hash' ? `[HASH:${hashValue(val, opts.hashLength)}]` : opts.maskPlaceholder;
        } else {
          out[k] = opts.recursive && typeof val === 'object' && val !== null ? _redact(val, fieldPath) : val;
        }
      }
      return out;
    }

    return value;
  }

  return _redact(obj, '');
}
