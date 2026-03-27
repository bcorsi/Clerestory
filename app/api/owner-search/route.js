export async function POST(request) {
  const { query } = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are a commercial real estate research assistant specializing in SGV and Inland Empire industrial real estate.
Find ownership and portfolio information for: "${query}"
Focus on industrial property ownership in Southern California.
Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "name": "entity name",
  "type": "REIT | Private Equity | Family Office | Developer | Owner-User | Unknown",
  "city": "headquarters city",
  "state": "CA",
  "portfolio_sf": estimated square footage as number or null,
  "properties_count": estimated number of properties or null,
  "known_markets": ["SGV", "IE West"],
  "acquisition_strategy": "brief description of their buying strategy",
  "website": "domain or null",
  "notes": "any relevant intel about their industrial RE activity"
}`
        }]
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { name: query, notes: text.slice(0, 200) }; }
    return Response.json({ success: true, result: parsed });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
