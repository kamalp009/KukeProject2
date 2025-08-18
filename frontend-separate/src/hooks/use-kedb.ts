import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSearchKEDBs() {
  return useMutation({
    mutationFn: async (incidentDescription: string) => {
      const response = await apiRequest("POST", "/api/kedbs/search", { 
        incidentDescription 
      });
      return response.json();
    },
  });
}

export function useGenerateKEDB() {
  return useMutation({
    mutationFn: async (incidentDescription: string) => {
      const response = await apiRequest("POST", "/api/kedbs/generate", { 
        incidentDescription 
      });
      return response.json();
    },
  });
}

export function useUpdateKEDB() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const response = await apiRequest("PUT", `/api/kedbs/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kedbs"] });
    },
  });
}
