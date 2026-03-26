import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Force Node.js runtime — child_process is not available in Edge runtime
export const runtime = 'nodejs';

export async function POST(request) {
  let outputPath = null;

  try {
    const inputs = await request.json();

    // Unique temp file per request (avoids collisions under concurrent load)
    outputPath = join('/tmp', `uw_model_${Date.now()}_${Math.random().toString(36).slice(2)}.xlsx`);
    const scriptPath = join(process.cwd(), 'generate_uw_model.py');

    // Sanity-check the script exists before shelling out
    if (!existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'generate_uw_model.py not found in project root.' },
        { status: 500 },
      );
    }

    // Run Python — execFileSync keeps args as an array (no shell injection)
    execFileSync('python3', [scriptPath, JSON.stringify(inputs), outputPath], {
      timeout: 45_000,           // 45 s — generous for cold pip install of openpyxl
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (!existsSync(outputPath)) {
      return NextResponse.json(
        { error: 'Model generation succeeded but output file was not found.' },
        { status: 500 },
      );
    }

    const fileBuffer = readFileSync(outputPath);

    // Safe filename from deal name
    const raw  = (inputs.dealName ?? 'UW_Model').replace(/[^\w\s-]/g, '').trim();
    const slug = raw.replace(/\s+/g, '_') || 'UW_Model';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Clerestory_UW_${slug}_${date}.xlsx`;

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export-model] error:', err?.message ?? err);

    // Surface a clear message for the two most common failure modes
    if (err?.code === 'ENOENT' || err?.message?.includes('python3')) {
      return NextResponse.json(
        {
          error:
            'Python 3 is not available on this server. ' +
            'Install Python 3 and run: pip install openpyxl',
        },
        { status: 503 },
      );
    }

    const stderr = err?.stderr ?? '';
    if (stderr.includes('ModuleNotFoundError') || stderr.includes('openpyxl')) {
      return NextResponse.json(
        { error: 'Missing Python dependency. Run: pip install openpyxl' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Export failed: ' + (err?.message ?? 'Unknown error') },
      { status: 500 },
    );
  } finally {
    // Clean up temp file regardless of outcome
    if (outputPath && existsSync(outputPath)) {
      try { unlinkSync(outputPath); } catch (_) {}
    }
  }
}
