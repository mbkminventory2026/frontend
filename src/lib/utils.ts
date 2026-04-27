import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toSnakeCase = (str: string) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const mapPayloadToSnakeCase = (obj: Record<string, any>) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[toSnakeCase(key)] = obj[key];
    return acc;
  }, {} as Record<string, any>)
};