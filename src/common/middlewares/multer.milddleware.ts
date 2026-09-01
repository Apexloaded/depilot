import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const supportedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!supportedMimeTypes.has(file.mimetype)) {
      callback(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  },
});

export const multipart = (req: Request, res: Response, next: NextFunction) => {
  // Only invoke multer for actual multipart bodies; let JSON/urlencoded
  // requests pass through untouched to your normal body parser.
  if (!req.is('multipart/form-data')) {
    return next();
  }

  upload.array('files', 5)(req, res, (error: unknown) => {
    if (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid file upload';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
};
