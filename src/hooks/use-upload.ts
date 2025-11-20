import { useMutation } from '@tanstack/react-query';

import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/types/api';
import type { UploadedFile, DeleteUploadResponse } from '@/types/upload';

interface UploadFileParams {
  file: File;
  purpose?: string;
  examId?: string;
  submissionId?: string;
}

export function useUploadFile() {
  return useMutation<UploadedFile, Error, UploadFileParams>({
    mutationFn: async ({ file, purpose = 'exam_submission', examId, submissionId }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (purpose) formData.append('purpose', purpose);
      if (examId) formData.append('examId', examId);
      if (submissionId) formData.append('submissionId', submissionId);

      const response = await apiClient.post<ApiResponse<{ file: UploadedFile }>>(
        '/api/upload/single',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      return response.data.data.file;
    },
    onError: (error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message || 'No se pudo subir el archivo. Intenta nuevamente.',
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteUpload() {
  return useMutation<void, Error, { publicId: string }>({
    mutationFn: async ({ publicId }) => {
      await apiClient.delete<ApiResponse<DeleteUploadResponse>>(`/api/upload/${publicId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error al eliminar archivo',
        description: error.message || 'No se pudo eliminar el archivo.',
        variant: 'destructive'
      });
    }
  });
}
