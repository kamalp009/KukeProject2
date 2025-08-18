import { z } from "zod";

export const searchKEDBSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

export const generateKEDBSchema = z.object({
  incidentDescription: z.string().min(1, "Incident description cannot be empty"),
});

export interface KEDB {
  id: string;
  title: string;
  description: string;
  content: string;
  matchPercentage: number | null;
  rank: number | null;
  recommended: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SearchRequest {
  id: string;
  query: string;
  createdAt: Date | null;
}

export type InsertSearchRequest = {
  query: string;
};