import { describe, it, expect } from 'vitest';
import {
  buildHeaderMapping,
  guessSource,
  guessStatus,
  heuristicMapBatch,
} from '../src/services/ai/fallbackMapper';

describe('buildHeaderMapping', () => {
  it('maps common header names to CRM fields', () => {
    const m = buildHeaderMapping(['Full Name', 'Email Address', 'Phone Number', 'City']);
    expect(m.fieldToHeader.name).toBe('Full Name');
    expect(m.fieldToHeader.email).toBe('Email Address');
    expect(m.fieldToHeader.mobile_without_country_code).toBe('Phone Number');
    expect(m.fieldToHeader.city).toBe('City');
  });

  it('matches plural / glued header variants', () => {
    const m = buildHeaderMapping(['Emails', 'Phone Numbers']);
    expect(m.fieldToHeader.email).toBe('Emails');
    expect(m.fieldToHeader.mobile_without_country_code).toBe('Phone Numbers');
  });

  it('detects split first/last name columns', () => {
    const m = buildHeaderMapping(['First Name', 'Last Name', 'Email']);
    expect(m.firstNameHeader).toBe('First Name');
    expect(m.lastNameHeader).toBe('Last Name');
  });
});

describe('guessStatus', () => {
  it.each([
    ['Interested', 'GOOD_LEAD_FOLLOW_UP'],
    ['Warm lead', 'GOOD_LEAD_FOLLOW_UP'],
    ['Not Reachable', 'DID_NOT_CONNECT'],
    ['Not Interested', 'BAD_LEAD'],
    ['Bad', 'BAD_LEAD'],
    ['Closed Won', 'SALE_DONE'],
    ['Booked', 'SALE_DONE'],
    ['random text', ''],
  ])('maps "%s" → %s', (input, expected) => {
    expect(guessStatus(input)).toBe(expected);
  });
});

describe('guessSource', () => {
  it.each([
    ['leads on demand', 'leads_on_demand'],
    ['Meridian Tower Campaign', 'meridian_tower'],
    ['Eden Park', 'eden_park'],
    ['Varah Swamy', 'varah_swamy'],
    ['Sarjapur Plots', 'sarjapur_plots'],
    ['Google Ads', ''],
  ])('maps "%s" → %s', (input, expected) => {
    expect(guessSource(input)).toBe(expected);
  });
});

describe('heuristicMapBatch', () => {
  it('produces one record per row with mapped fields', () => {
    const headers = ['Name', 'Emails', 'Phone Numbers', 'Lead Stage', 'Where From'];
    const rows = [
      {
        Name: 'Ravi',
        Emails: 'ravi@x.com',
        'Phone Numbers': '9876500011',
        'Lead Stage': 'Warm',
        'Where From': 'leads on demand',
      },
    ];
    const out = heuristicMapBatch(rows, headers);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Ravi');
    expect(out[0].email).toBe('ravi@x.com');
    expect(out[0].crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(out[0].data_source).toBe('leads_on_demand');
  });

  it('combines split first/last name columns', () => {
    const out = heuristicMapBatch(
      [{ 'First Name': 'Daniel', 'Last Name': 'Roberts', Email: 'd@x.com' }],
      ['First Name', 'Last Name', 'Email'],
    );
    expect(out[0].name).toBe('Daniel Roberts');
  });
});
