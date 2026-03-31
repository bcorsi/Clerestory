export async function POST(request) {
  const { query, address } = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const prompt = `You are an expert commercial real estate intelligence researcher working for a broker specializing in SGV and Inland Empire industrial real estate in Southern California. Your job is to find actionable deal intelligence — not generic company info.

Research this entity aggressively using ALL of these web searches before responding:
Entity: "${query}"
${address ? `Associated property address: ${address}` : ''}

SEARCH 1: "${query}" industrial real estate Southern California owner property
SEARCH 2: "${query}" principals executives CEO owner president contact phone email
SEARCH 3: "${query}" "${address || 'SGV OR "Inland Empire" OR "Los Angeles" OR "San Bernardino"'}" property sale lease warehouse facility
SEARCH 4: "${query}" LinkedIn contact
SEARCH 5: "${query}" news announcement 2024 OR 2025 OR 2026
SEARCH 6: "${query}" site:businesswire.com OR site:prnewswire.com OR site:globenewswire.com
SEARCH 7: "${query}" "Southern California" OR "Los Angeles" OR "Inland Empire" OR "San Gabriel" building warehouse manufacturing facility
SEARCH 8: "${query}" layoffs OR expansion OR relocation OR consolidation OR bankruptcy OR acquisition OR "for sale"

What I need for cold outreach to this property owner:
1. The ACTUAL HUMAN decision maker — who signs checks, who answers a broker call
2. Direct contact info — phone, email, LinkedIn URL  
3. Every industrial property they own or occupy in SGV/IE/SoCal with addresses
4. How long have they owned/occupied (10+ years = strong sell signal)
5. Owner-user or investor? Growing or contracting business?
6. Specific sell signals: refinancing, layoffs, WARN filings, aging owner, succession, portfolio shift
7. ALL recent news and press releases from last 2 years — every article you find, with date, source, URL, and why it matters for real estate
8. Press releases about Southern California facilities, expansions, closures, relocations
9. Company website and any facility/location pages

Return ONLY a JSON object with NO markdown, no backticks, no explanation:
{
  "name": "full legal entity name",
  "type": "REIT | Private Equity | Family Office | Developer | Owner-User | Trust | Corporation | Unknown",
  "principals": ["Name, Title"],
  "decision_maker": "name and title of the person to call",
  "direct_phone": "direct phone or null",
  "direct_email": "email or null",
  "linkedin": "LinkedIn URL or null",
  "city": "headquarters city",
  "website": "full URL or null",
  "portfolio_sf": estimated SF as number or null,
  "hold_period_years": estimated hold period as number or null,
  "sgv_ie_properties": ["list of known SGV/IE/SoCal properties with addresses"],
  "known_markets": ["SGV", "IE West", etc],
  "acquisition_strategy": "buyer, holder, or seller — be specific",
  "recent_activity": "most recent relevant transaction or news",
  "warn_context": "any layoff/WARN filing or business contraction signals",
  "sell_signals": ["specific signals — be concrete, not generic"],
  "news_articles": [
    {
      "date": "YYYY-MM-DD or approximate",
      "headline": "article or press release headline",
      "source": "publication name",
      "url": "URL if found",
      "summary": "1-2 sentences on what it says and why it matters for real estate"
    }
  ],
  "outreach_angle": "single most compelling cold call opener based on what you found — specific, not generic",
  "notes": "other relevant deal intel"
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
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
          }
        ],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    // Extract the final text response (after tool use)
    let text = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          text += block.text;
        }
      }
    }

    // Clean and parse JSON
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      // Find JSON object in the response
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { name: query, notes: clean.slice(0, 500) };
      }
    } catch {
      parsed = { name: query, notes: clean.slice(0, 500) };
    }

    // Save to owner_searches table
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      await supabase.from('owner_searches').insert({
        query,
        address: address || null,
        entity_name: parsed.name,
        result: parsed,
      });
    } catch (e) {
      console.error('Failed to save search:', e);
    }

    return Response.json({ success: true, result: parsed });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
