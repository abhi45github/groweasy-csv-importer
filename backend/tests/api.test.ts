import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/config exposes CRM metadata (heuristic mode in tests)', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.fields).toContain('email');
    expect(res.body.statuses).toContain('SALE_DONE');
    expect(res.body.sources).toContain('eden_park');
    expect(res.body.provider.heuristic).toBe(true);
  });

  it('POST /api/import extracts records from inline CSV', async () => {
    const csv =
      'Name,Email,Phone,Status,Source\n' +
      'Alice,alice@x.com,+91 9876543210,Interested,Eden Park\n' +
      'Ghost,,,New,';
    const res = await request(app).post('/api/import').send({ csv });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.imported).toBe(1);
    expect(res.body.summary.skipped).toBe(1);

    const alice = res.body.records[0];
    expect(alice.name).toBe('Alice');
    expect(alice.email).toBe('alice@x.com');
    expect(alice.country_code).toBe('+91');
    expect(alice.mobile_without_country_code).toBe('9876543210');
    expect(alice.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(alice.data_source).toBe('eden_park');

    expect(res.body.skipped[0].reason).toBe('missing_email_and_mobile');
  });

  it('POST /api/import accepts a multipart file upload', async () => {
    const csv = 'Name,Email\nBob,bob@x.com';
    const res = await request(app)
      .post('/api/import')
      .attach('file', Buffer.from(csv), 'leads.csv');
    expect(res.status).toBe(200);
    expect(res.body.summary.imported).toBe(1);
  });

  it('returns 400 when no CSV is provided', async () => {
    const res = await request(app).post('/api/import').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('streams newline-delimited events from /api/import/stream', async () => {
    const csv = 'Name,Email\nAlice,alice@x.com\nBob,bob@x.com';
    const res = await request(app).post('/api/import/stream').send({ csv });
    expect(res.status).toBe(200);

    const events = res.text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    expect(events[0].type).toBe('meta');
    expect(events.some((e) => e.type === 'progress')).toBe(true);

    const final = events.find((e) => e.type === 'result');
    expect(final).toBeDefined();
    expect(final.data.summary.imported).toBe(2);
  });
});
