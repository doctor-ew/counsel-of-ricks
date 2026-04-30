import { useQuery } from '@tanstack/react-query'
import * as api from '../api/client'

export function useLedger(sessionId: string) {
  return useQuery({
    queryKey: ['ledger', sessionId],
    queryFn: () => api.getLedger(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}
