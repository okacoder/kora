import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function tryCatch<T>(
  promise: Promise<T>,
): Promise<{ error: Error | null; data: T | null }> {
  try {
    const result = await promise;
    return { error: null, data: result };
  } catch (error) {
    return { error: error as Error, data: null };
  }
}
