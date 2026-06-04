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

export const hasFile = (obj: Record<string, any>) => {
  return Object.values(obj).some(
    (val) => val instanceof File || (Array.isArray(val) && val[0] instanceof File)
  )
}

export const prepareFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.keys(data).forEach((key) => {
    const val = data[key]
    if (Array.isArray(val)) {
      val.forEach((item: any) => formData.append(`${key}[]`, item))
    } else {
      formData.append(key, val)
    }
  })
  return formData
}

export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost
      );
    }
    prev = [...curr];
  }
  return prev[b.length]!;
}

export function isSimilarName(name1: string, name2: string): boolean {
  const n1 = name1.trim().toLowerCase();
  const n2 = name2.trim().toLowerCase();
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;

  const maxLen = Math.max(n1.length, n2.length);
  const dist = getLevenshteinDistance(n1, n2);

  if (dist <= 2) return true;

  if (maxLen >= 4) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }

  return false;
}