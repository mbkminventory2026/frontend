import { type Component } from 'vue';

export type DetailFieldType = 'text' | 'date' | 'number' | 'currency' | 'badge' | 'file' | 'image';

export interface DetailField {
  key: string;
  label: string;
  type?: DetailFieldType;
  variant?: 'default' | 'file' | 'image';
  formatter?: (val: any) => string;
  icon?: Component;
  className?: string;
  span?: 'col-1' | 'col-2' | 'full';
}

export type DetailSchema = DetailField[];
