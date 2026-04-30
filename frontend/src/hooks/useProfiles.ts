import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/client'

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: api.getProfiles,
  })
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => api.getProfile(profileId!),
    enabled: !!profileId,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof api.createProfile>[0]) => api.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      data,
    }: {
      profileId: string
      data: Parameters<typeof api.updateProfile>[1]
    }) => api.updateProfile(profileId, data),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => api.deleteProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useAddDocumentToProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      documentId,
      familiarityLevel,
    }: {
      profileId: string
      documentId: string
      familiarityLevel?: 'authored' | 'familiar' | 'mentioned'
    }) => api.addDocumentToProfile(profileId, documentId, familiarityLevel),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] })
    },
  })
}

export function useRemoveDocumentFromProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      documentId,
    }: {
      profileId: string
      documentId: string
    }) => api.removeDocumentFromProfile(profileId, documentId),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] })
    },
  })
}
