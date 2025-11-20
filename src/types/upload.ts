export interface UploadedFile {
  publicId: string;
  secureUrl: string;
  originalFilename: string;
  format: string;
  bytes: number;
  resourceType: string;
  createdAt: string;
  folder?: string;
  databaseId?: string;
}

export interface UploadResponse {
  file: UploadedFile;
}

export interface DeleteUploadResponse {
  deletedFile: {
    publicId: string;
    originalName: string;
  };
}
