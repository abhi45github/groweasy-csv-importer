import { Router } from 'express';
import { upload } from '../middleware/upload';
import { handleImport, handleImportStream } from '../controllers/import.controller';
import { resolveProvider } from '../services/ai/providers';
import { describeProvider } from '../services/ai/extractor';
import { env } from '../config/env';
import {
  CRM_FIELDS,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
} from '../types/crm';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/** Public configuration the frontend uses to render field metadata & the provider badge. */
router.get('/config', (_req, res) => {
  res.json({
    provider: describeProvider(resolveProvider()),
    fields: CRM_FIELDS,
    statuses: CRM_STATUS_VALUES,
    sources: DATA_SOURCE_VALUES,
    limits: {
      maxRows: env.extraction.maxRows,
      maxUploadMb: env.extraction.maxUploadMb,
      batchSize: env.extraction.batchSize,
    },
  });
});

router.post('/import', upload.single('file'), handleImport);
router.post('/import/stream', upload.single('file'), handleImportStream);

export default router;
