import { z } from 'zod';
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from '../../types/crm';

/**
 * Zod schema describing a single CRM record as returned by the LLM.
 *
 * The schema is intentionally lenient — the model may omit fields or emit an
 * empty string. Coercion & strict business rules live in `normalize.ts`; this
 * layer's job is only to guarantee the *shape* is safe to work with.
 */
export const crmRecordSchema = z
  .object({
    created_at: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    country_code: z.string().optional(),
    mobile_without_country_code: z.string().optional(),
    company: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    lead_owner: z.string().optional(),
    crm_status: z
      .union([z.enum(CRM_STATUS_VALUES), z.literal('')])
      .optional(),
    crm_note: z.string().optional(),
    data_source: z
      .union([z.enum(DATA_SOURCE_VALUES), z.literal('')])
      .optional(),
    possession_time: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const crmBatchSchema = z.object({
  records: z.array(crmRecordSchema),
});

export type CrmRecordInput = z.infer<typeof crmRecordSchema>;
