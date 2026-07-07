/* Throwaway manual smoke test: `npx tsx scripts/smoke.ts <path-to-csv>` */
import { readFileSync } from 'node:fs';
import { parseCsv } from '../src/services/csv/csvParser';
import { resolveProvider } from '../src/services/ai/providers';
import { extractLeads } from '../src/services/ai/extractor';

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: tsx scripts/smoke.ts <csv>');
  const csv = readFileSync(path, 'utf-8');
  const parsed = parseCsv(csv, 5000);
  const provider = resolveProvider();
  console.log('Headers:', parsed.headers);
  console.log('Provider:', provider ? `${provider.name} (${provider.model})` : 'heuristic fallback');

  const result = await extractLeads({
    headers: parsed.headers,
    rows: parsed.rows,
    provider,
    onProgress: (e) =>
      console.log(
        `  progress: batch ${e.completedBatches}/${e.totalBatches} | imported ${e.imported} | skipped ${e.skipped}`,
      ),
  });

  console.log('\nSTATS:', JSON.stringify(result.stats, null, 2));
  console.log('\nRECORDS:');
  console.table(
    result.records.map((r) => ({
      row: r.rowNumber,
      name: r.name,
      email: r.email,
      cc: r.country_code,
      mobile: r.mobile_without_country_code,
      city: r.city,
      status: r.crm_status,
      source: r.data_source,
      possession: r.possession_time,
      note: (r.crm_note ?? '').slice(0, 40),
    })),
  );
  console.log('\nSKIPPED:');
  console.table(result.skipped.map((s) => ({ row: s.rowNumber, reason: s.reason })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
