import { useMutation } from '@tanstack/react-query'
import * as api from '../api/client'
import type { QuestionGenerateRequest } from '../types'

export function useGenerateQuestions() {
  return useMutation({
    mutationFn: ({
      sessionId,
      request,
    }: {
      sessionId: string
      request?: Partial<QuestionGenerateRequest>
    }) => api.generateQuestions(sessionId, request),
  })
}

export function useExportQuestions() {
  return useMutation({
    mutationFn: ({
      sessionId,
      format,
    }: {
      sessionId: string
      format?: 'text' | 'markdown'
    }) => api.exportQuestions(sessionId, format),
  })
}
