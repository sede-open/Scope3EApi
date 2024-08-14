import { Router, Response, NextFunction, Request } from 'express';
import multer from 'multer';
import getStream from 'into-stream';

import { AzureBlobClient } from '../clients/AzureBlobClient';
import { authenticate } from '../middleware/expressAuth';
import { handleErrors } from '../middleware/handleErrors';
import { hasRole } from '../middleware/hasRole';
import { validatePDFExtensions, validatePDFHeaders } from '../utils/files';
import { MAX_PDF_FILE_SIZE_IN_BYTES } from '../constants/files';
import { RoleName } from '../types';
import {
  UnsupportedMediaTypeError,
  UnauthorisedError,
  BadRequestError,
} from '../utils/errors';
import { getOrCreateDBConnection } from '../dbConnection';
import { FileEntity } from '../entities/File';
import { logger } from '../utils/logger';

const inMemoryStorage = multer.memoryStorage();
const emissionVerificationUploadStrategy = multer({
  storage: inMemoryStorage,
  fileFilter: (_, file, callback) => {
    const hasValidPDFExtensions = validatePDFExtensions(file);
    if (!hasValidPDFExtensions) {
      callback(new UnsupportedMediaTypeError());
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_PDF_FILE_SIZE_IN_BYTES,
  },
}).single('file');

export const router = Router();

router.use(authenticate);

router.post(
  '/emission-verification',
  [hasRole([RoleName.SupplierEditor]), emissionVerificationUploadStrategy],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) {
        throw new UnauthorisedError();
      }

      if (!req.file) {
        throw new BadRequestError();
      }

      const hasValidPDFHeaders = validatePDFHeaders(req.file);
      if (!hasValidPDFHeaders) {
        throw new UnsupportedMediaTypeError();
      }

      const dbConnection = await getOrCreateDBConnection();
      const blobService = new AzureBlobClient(
        process.env.AZURE_STORAGE_CONNECTION_STRING ?? ''
      );

      // container names can include only lowercase letters
      const containerId = req.user.companyId.toLowerCase();
      const currentTimestamp = new Date().getTime();

      const file = new FileEntity();
      file.mimetype = req.file.mimetype;
      file.originalFilename = req.file.originalname;
      file.azureBlobFilename = `${currentTimestamp}-${file.originalFilename}`;
      file.sizeInBytes = req.file.size;
      file.companyId = req.user.companyId;
      file.createdBy = req.user.id;

      const fileStream = getStream(req.file.buffer);
      const fileStreamLength = req.file.buffer.length;

      await blobService.uploadFile({
        containerId,
        fileStream,
        fileStreamLength,
        fileName: file.azureBlobFilename,
      });

      // @TODO :: if the db fails to save, the file should be deleted
      await dbConnection.getRepository(FileEntity).save(file);

      res.status(200).send(file);
      res.end();
    } catch (err) {
      logger.error(err, 'Emission verification file upload failed');
      next(err);
    }
  }
);

router.use(handleErrors);
