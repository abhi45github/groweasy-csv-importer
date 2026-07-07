import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

/**
 * In-memory multipart upload for a single CSV file under the field name "file".
 * Files never touch disk — we parse straight from the buffer.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.extraction.maxUploadMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const okType =
      /csv|excel|text\/plain|application\/octet-stream/i.test(file.mimetype) ||
      /\.csv$/i.test(file.originalname);
    if (okType) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Only CSV files are supported.'));
    }
  },
});
