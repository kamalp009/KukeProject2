import React, { createContext, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEDB, KEDBSearchResponse, KEDBGenerateResponse, KEDBUpdateResponse } from "../types/kedb";

interface KEDBApiContextType {
  baseUrl: string;
}

const KEDBApiContext = createContext<KEDBApiContextType | null>(null);

export const KEDBApiProvider: React.FC<{ baseUrl: string; children: React.ReactNode }> = ({ 
  baseUrl, 
  children 
}) => {
  return (
    <KEDBApiContext.Provider value={{ baseUrl }}>
      {children}
    </KEDBApiContext.Provider>
  );
};

const useKEDBApiContext = () => {
  const context = useContext(KEDBApiContext);
  if (!context) {
    throw new Error("KEDB hooks must be used within KEDBApiProvider");
  }
  return context;
};

async function apiRequest(url: string, method: string, data?: any): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}

export function useSearchKEDBs() {
  const { baseUrl } = useKEDBApiContext();
  
  return useMutation<KEDBSearchResponse, Error, string>({
    mutationFn: async (incidentDescription: string) => {
      const response = await apiRequest(`${baseUrl}/kedbs/search`, "POST", { 
        incidentDescription 
      });
      return response.json();
    },
  });
}

export function useGenerateKEDB() {
  const { baseUrl } = useKEDBApiContext();
  
  return useMutation<KEDBGenerateResponse, Error, string>({
    mutationFn: async (incidentDescription: string) => {
      const response = await apiRequest(`${baseUrl}/kedbs/generate`, "POST", { 
        incidentDescription 
      });
      return response.json();
    },
  });
}

export function useUpdateKEDB() {
  const { baseUrl } = useKEDBApiContext();
  const queryClient = useQueryClient();
  
  return useMutation<KEDBUpdateResponse, Error, { id: string; updates: Partial<KEDB> }>({
    mutationFn: async ({ id, updates }) => {
      const response = await apiRequest(`${baseUrl}/kedbs/${id}`, "PUT", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kedbs"] });
    },
  });
}