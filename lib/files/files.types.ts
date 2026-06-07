export enum FileType {
  AVATAR = 1,
}

export enum FileStatus {
  PENDING = 1,
  LOADED = 2,
}

export interface FileInfo {
  id: number;
  name: string;
  originalName: string | null;
  mimeType: string | null;
  type: FileType;
  status: FileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

export interface FileUpload {
  file: FileInfo;
  upload: PresignedPost;
}

export interface PrepareUploadPayload {
  contentType: string;
  type: FileType;
  originalName: string;
}