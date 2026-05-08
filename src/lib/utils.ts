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