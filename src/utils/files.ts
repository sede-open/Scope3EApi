import path from 'path';

export const validatePDFExtensions = (file: Express.Multer.File) => {
  const isValidMimetype = ['application/pdf'].includes(file.mimetype);
  const isValidExtension = path.extname(file.originalname) === '.pdf';

  return isValidMimetype && isValidExtension;
};

export const validatePDFHeaders = (file: Express.Multer.File) => {
  const buffer = file.buffer;
  const areValidPDFHeaders =
    Buffer.isBuffer(buffer) &&
    buffer.lastIndexOf('%PDF-') === 0 &&
    buffer.lastIndexOf('%%EOF') > -1;

  return areValidPDFHeaders;
};
