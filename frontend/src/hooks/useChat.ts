import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/client'

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => api.getMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: false, // Don't auto-refetch, we update manually
  })
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => api.sendMessage(sessionId, message),
    onSuccess: () => {
      // Invalidate messages to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
      // Also refresh ledger
      queryClient.invalidateQueries({ queryKey: ['ledger', sessionId] })
    },
  })
}
