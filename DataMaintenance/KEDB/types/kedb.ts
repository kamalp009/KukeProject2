export interface KEDB {
  id: string;
  title: string;
  description: string;
  content: string;
  matchPercentage?: number;
  rank?: number;
  recommended?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface KEDBSearchResponse {
  success: boolean;
  data: KEDB[];
  count: number;
  message?: string;
}

export interface KEDBGenerateResponse {
  success: boolean;
  data: KEDB;
  message?: string;
}

export interface KEDBUpdateResponse {
  success: boolean;
  data: KEDB;
  message?: string;
}