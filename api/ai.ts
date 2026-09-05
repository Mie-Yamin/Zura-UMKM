import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Ambil API key dari Environment Variable server (tanpa embel-embel VITE_)
    const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key server belum dikonfigurasi' });
    }

    try {
        const { messages, model = 'llama-3.3-70b-versatile' } = req.body;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.5,
            }),
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Gagal menghubungi server AI' });
    }
}