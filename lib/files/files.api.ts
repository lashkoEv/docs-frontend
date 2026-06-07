import { apiClient } from '@/lib/api/client';

import { FileInfo, FileType, FileUpload, PrepareUploadPayload } from './files.types';

export const filesApi = {
  prepareUpload: (payload: PrepareUploadPayload): Promise<FileUpload> =>
    apiClient.post<FileUpload>('/files', payload),

  confirmUpload: (fileId: number): Promise<void> =>
    apiClient.patch<void>('/files/status', { fileId }),
};

export const uploadFile = async (file: File, type: FileType): Promise<FileInfo> => {
  const { file: createdFile, upload } = await filesApi.prepareUpload({
    contentType: file.type,
    type,
    originalName: file.name,
  });

  const formData = new FormData();
  Object.entries(upload.fields).forEach(([fieldName, fieldValue]) => {
    formData.append(fieldName, fieldValue);
  });
  formData.append('file', file);

  const response = await fetch(upload.url, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error('Failed to upload the file. Please try again.');
  }

  await filesApi.confirmUpload(createdFile.id);

  return createdFile;
};