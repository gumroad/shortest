import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function baseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.BASE_URL) {
    return process.env.BASE_URL
  }
  throw new Error('No base URL found. Please set BASE_URL or deploy to Vercel.')
}
