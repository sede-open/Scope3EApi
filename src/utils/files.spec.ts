import { validatePDFExtensions, validatePDFHeaders } from './files';

const validPDF = {
  fieldname: 'file',
  originalname: 'test.pdf',
  encoding: 'buffer',
  mimetype: 'application/pdf',
  size: 12331,
  buffer: Buffer.from('%PDF-fhqwhgads%%EOF', 'utf8'),
} as Express.Multer.File;

const pdfWithIncorrectMimetype = {
  ...validPDF,
  mimetype: 'application/octastream',
};

const pdfWithIncorrectExtension = {
  ...validPDF,
  originalname: 'test.text',
};

const pdfWithIncorrectHeaders = {
  ...validPDF,
  buffer: Buffer.from('fhqwhgads', 'utf8'),
};

describe('files utils', () => {
  describe('validatePDFExtensions()', () => {
    it('should return true when the file is a valid PDF file', () => {
      const result = validatePDFExtensions(validPDF);
      expect(result).toBe(true);
    });

    it('should return false when mimetype is NOT application/pdf', () => {
      const result = validatePDFExtensions(pdfWithIncorrectMimetype);
      expect(result).toBe(false);
    });

    it('should return false when the extension is NOT .pdf', () => {
      const result = validatePDFExtensions(pdfWithIncorrectExtension);
      expect(result).toBe(false);
    });
  });

  describe('validatePDFHeaders()', () => {
    it('should return true when the file is a valid PDF file', () => {
      const result = validatePDFHeaders(validPDF);
      expect(result).toBe(true);
    });

    it('should return false when the pdf has invalid headers', () => {
      const result = validatePDFHeaders(pdfWithIncorrectHeaders);
      expect(result).toBe(false);
    });
  });
});
