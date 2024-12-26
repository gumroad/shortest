import crypto from 'crypto';

export function hashData(data: unknown): string {
  const hash = crypto.createHash('sha256');
  return hash.update(JSON.stringify(data)).digest('hex');
}
