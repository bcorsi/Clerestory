import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

// CA EDD WARN report URL
const EDD_WARN_URL = 'https://edd.ca.gov/siteassets/files/jobs_and_training/warn/warn_report.xlsx';

// Counties that map to our markets
const TARGET_COUNTIES = {
  'Los Angeles': 'SGV',
  'San Bernardino': 'IE West',
  'Riverside': 'IE East',
  'Orange': 'OC',
};

// SGV/IE city keywords for finer market assignment
const CITY_MARKET_MAP = {
  'city of industry': 'SGV', 'baldwin park': 'SGV', 'irwindale': 'SGV',
  'el monte': 'SGV', 'azusa': 'SGV', 'covina': 'SGV', 'pomona': 'SGV',
  'walnut': 'SGV', 'rowland heights': 'SGV', 'hacienda heights': 'SGV',
  'ontario': 'IE West', 'fontana': 'IE West', 'rancho cucamonga': 'IE West',
  'chino': 'IE West', 'mira loma': 'IE West', 'jurupa valley': 'IE West',
  'rialto': 'IE West', 'bloomington': 'IE West',
  'san bernardino': 'IE East', 'riverside': 'IE East', 'moreno valley': 'IE East',
  'perris': 'IE East', 'redlands': 'IE East', 'corona': 'IE South',
};

export async function GET(request) {
  try {
    // 1. Download EDD WARN Excel
    const response = await fetch(EDD_WARN_URL, {
      headers: { 'User-Agent': 'Clerestory CRE Intelligence' },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch EDD file', status: response.status },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    // 2. Map EDD columns to our schema
    // EDD WARN columns: Notice Date, Effective Date, Received Date, Company,
    // No. Of Employees, Layoff/Closure, County, City, Address, Zip
    const filings = rows.map(row => ({
      company:       row['Company'] || row['Employer'] || '',
      address:       row['Address'] || '',
      city:          row['City'] || '',
      county:        row['County'] || '',
      zip:           String(row['Zip'] || ''),
      workers:       parseInt(row['No. Of Employees'] || row['Employees'] || 0),
      type:          row['Layoff/Closure'] || row['Type'] || 'Layoff',
      notice_date:   row['Notice Date'] || row['Date'] || '',
      effective_date: row['Effective Date'] || '',
      received_date: row['Received Date'] || '',
    })).filter(f => f.company && f.workers > 0);

    // 3. Filter to our markets only
    const relevant = filings.filter(f => {
      const county = (f.county || '').trim();
      const city = (f.city || '').toLowerCase().trim();
      return TARGET_COUNTIES[county] || CITY_MARKET_MAP[city];
    });

    // 4. Assign market
    const withMarket = relevant.map(f => ({
      ...f,
      market: CITY_MARKET_MAP[f.city.toLowerCase().trim()] ||
              TARGET_COUNTIES[f.county] || 'SGV',
      is_closure: (f.type || '').toLowerCase().includes('clos'),
      workers_label: `${f.workers} workers`,
    }));

    // 5. Return results (Supabase save goes here later)
    return NextResponse.json({
      success: true,
      total_in_file: filings.length,
      relevant_count: withMarket.length,
      filings: withMarket,
      synced_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[warn-sync]', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
