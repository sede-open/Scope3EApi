export interface IFile {
  id: string;
  originalFilename: string;
  azureBlobFilename: string;
  mimetype: string;
  sizeInBytes: number;
  companyId: string;
  createdBy: string;
}
