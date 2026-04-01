export async function POST(request) {
  const { market, industry } = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const prompt = `You are a commercial real estate intelligence analyst specializing in SGV and Inland Empire industrial real estate in Southern California. Search for recent Chapter 11 or Chapter 7 bankruptcy filings by ${industry} companies in ${market}.

Run ALL of these searches before responding:
SEARCH 1: ${industry} company Chapter 11 bankruptcy filing ${market} 2024 2025 2026
SEARCH 2: ${industry} Chapter 7 bankruptcy Southern California industrial warehouse 2024 2025
SEARCH 3: ${industry} company bankruptcy "lease rejection" OR "facility closure" OR "plant closing" ${market}
SEARCH 4: ${industry} bankruptcy PACER court filing Southern California industrial real estate
SEARCH 5: ${industry} company "Chapter 11" OR "Chapter 7" warehouse manufacturing distribution ${market} site:businesswire.com OR site:prnewswire.com OR site:reuters.com OR site:wsj.com

For each filing found provide:
- Company name and facility location (city, address if known)
- Filing date and chapter (11 or 7)
- Number of employees and estimated facility size if known
- Real estate status — are they rejecting leases? Closing facilities? Selling assets?
- CRE opportunity — what space is likely coming available and when?
- Source (court filing, news article, URL)

Focus ONLY on companies with physical industrial, warehouse, manufacturing, or distribution facilities in Southern California. List 5-8 actionable filings. Be specific with dates and sources. If you cannot find 5 real filings, return fewer — do not fabricate.

Return ONLY a JSON object with NO markdown, no backticks, no explanation:
{
  "market": "${market}",
  "industry": "${industry}",
  "filings": [
    {
      "company": "company name",
      "location": "city and address if known",
      "filing_date": "YYYY-MM-DD or approximate month/year",
      "chapter": 11,
      "employees": number or null,
      "facility_size": "estimated SF or acreage or null",
      "real_estate_status": "what is happening with their space — rejecting leases, closing facilities, selling assets",
      "cre_opportunity": "specific opportunity — what space, when, why it matters",
      "source": "publication or court name",
      "source_url": "URL if found or null",
      "urgency": "high | medium | low"
    }
  ],
  "summary": "2-3 sentence market summary of what these filings mean for industrial vacancy in this market"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    let text = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') text += block.text;
      }
    }

    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { filings: [], summary: clean.slice(0, 300) };
    } catch {
      parsed = { filings: [], summary: clean.slice(0, 300) };
    }

    return Response.json({ success: true, result: parsed });
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
