export default async function handler(req, res) {
  try {
    const response = await fetch('https://hook.eu1.make.com/jn86xc2siw682kzp1wh99ueuvkp5eb4q', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'panparagon_monthly_report',
        source: 'PanParagon Monitor',
        period: '2026-08',
        report: 'PanParagon Monitor — test integracji',
        receiptCount: 3,
        stores: [
          { store: 'Test Sklep A', count: 2 },
          { store: 'Test Sklep B', count: 1 }
        ],
        sentAt: new Date().toISOString()
      })
    });
    const text = await response.text();
    res.status(response.ok ? 200 : response.status).json({ ok: response.ok, status: response.status, response: text });
  } catch (error) {
    res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}
