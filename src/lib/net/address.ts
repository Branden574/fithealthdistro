import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { headers } from 'next/headers';

/**
 * The key for hashing addresses. RATE_LIMIT_SALT when it is set; otherwise one derived from the server's secret key, so
 * the per-address limits never silently switch off (without it, one script could spend a site-wide cap for everyone).
 * Never a plain hash: every IPv4 address can be hashed in minutes, so an unkeyed hash would not hide anything.
 */
function addressKey(): string | undefined {
  const salt = process.env.RATE_LIMIT_SALT;
  if (salt) return salt;
  const secret = process.env.SUPABASE_SECRET_KEY;
  return secret ? createHmac('sha256', secret).update('fhd.rate-limit.v1').digest('hex') : undefined;
}

/**
 * What a limit counts as one visitor. An IPv4 address as it is. An IPv6 address by its first 64 bits: one home or office
 * line is handed a whole /64, so counting single IPv6 addresses would give one person billions of fresh allowances.
 */
export function addressGroup(address: string): string {
  const kind = isIP(address);
  if (kind !== 6) return address;
  const lower = address.toLowerCase().split('%')[0];
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);
  if (mapped) return mapped[1];
  // An embedded IPv4 tail ("64:ff9b::1.2.3.4") fills two groups.
  const size = (parts: string[]) => parts.reduce((sum, part) => sum + (part.includes('.') ? 2 : 1), 0);
  const [head, tail] = lower.includes('::') ? lower.split('::') : [lower, undefined];
  const front = head ? head.split(':') : [];
  const back = tail ? tail.split(':') : [];
  const groups = tail === undefined ? front : [...front, ...Array<string>(Math.max(0, 8 - size(front) - size(back))).fill('0'), ...back];
  return `${groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16))
    .join(':')}::/64`;
}

/**
 * A keyed hash of the visitor's address group, for per-address rate limits (the contact form, signing in). The address
 * itself is never stored. On Vercel these headers are set by the platform and cannot be supplied by the visitor. Behind
 * another proxy, check which header it sets before relying on this. Undefined when no address arrived.
 */
export async function addressHash(): Promise<string | undefined> {
  const salt = addressKey();
  if (!salt) return undefined;
  const list = await headers();
  const first = (name: string) => list.get(name)?.split(',')[0]?.trim() || undefined;
  const address = first('x-vercel-forwarded-for') ?? first('x-real-ip') ?? first('x-forwarded-for');
  return address ? createHmac('sha256', salt).update(addressGroup(address)).digest('hex') : undefined;
}
