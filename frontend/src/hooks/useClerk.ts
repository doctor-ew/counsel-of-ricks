import { useMutation } from '@tanstack/react-query'
import * as api from '../api/client'
import type { ClerkMessage } from '../types'

export function useAskClerk() {
  return useMutation({
    mutationFn: ({
      query,
      sessionId,
      conversationHistory,
    }: {
      query: string
      sessionId?: string
      conversationHistory?: ClerkMessage[]
    }) => api.askClerk(query, sessionId, conversationHistory),
  })
}
