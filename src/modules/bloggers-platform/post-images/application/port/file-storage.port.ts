export type UploadFileStorage = {
  objectKey: string;
  body: Buffer;
  contentType: string;
  contentLength: string;
};

export interface StoredFile {
  objectKey: string;
  etag: string | null;
  checksum?: string | null;
}

export abstract class FileStoragePort {
  abstract upload(input: UploadFileStorage): Promise<StoredFile>;
  abstract delete(objectKey: string): Promise<void>;
}
