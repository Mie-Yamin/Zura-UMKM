export const config = {
    runtime: 'edge', // Berjalan cepat di Edge Network Vercel
};

// 1. In-Memory Rate Limiter (10 request per menit per akun)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(uid: string, limit = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(uid);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(uid, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (record.count >= limit) {
        return true;
    }

    record.count += 1;
    return false;
}

// 2. Verifikasi Token Pengguna via Google Identity Toolkit
async function verifyFirebaseToken(idToken: string): Promise<string | null> {
    try {
        const firebaseApiKey =
            process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;

        if (!firebaseApiKey) {
            // Fallback decoding dasar jika env key belum termuat
            const parts = idToken.split('.');
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            return payload.user_id || payload.sub || null;
        }

        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            }
        );

        if (!res.ok) return null;
        const data = await res.json();
        return data.users?.[0]?.localId || null;
    } catch (err) {
        console.error('Token verification error:', err);
        return null;
    }
}

// 3. Allow-list Model Resmi (Mencegah penyerang memakai model mahal)
const ALLOWED_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
];

export default async function handler(req: Request) {
    // Hanya izinkan method POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // A. Periksa Keberadaan Authorization Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized: Akses ditolak, token tidak ditemukan.' }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // B. Validasi Firebase ID Token
    const idToken = authHeader.split('Bearer ')[1]?.trim();
    const uid = await verifyFirebaseToken(idToken);
    if (!uid) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized: Token login tidak valid atau kadaluarsa.' }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // C. Periksa Batas Panggilan (Rate Limit)
    if (isRateLimited(uid)) {
        return new Response(
            JSON.stringify({
                error: 'Terlalu banyak permintaan (Rate limit tercapai). Harap tunggu 1 menit.',
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                },
            }
        );
    }

    // D. Periksa Konfigurasi Kunci Server
    const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: 'Konfigurasi AI di server belum lengkap.' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    try {
        // E. Batasi Ukuran Body Request (Maks 35 KB)
        const rawBody = await req.text();
        if (rawBody.length > 35_000) {
            return new Response(
                JSON.stringify({ error: 'Ukuran payload terlalu besar.' }),
                {
                    status: 413,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const { messages, model = 'llama-3.3-70b-versatile', temperature = 0.3 } =
            JSON.parse(rawBody);

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Format pesan percakapan tidak valid.' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // F. Sanitasi Pilihan Model
        const selectedModel = ALLOWED_MODELS.includes(model)
            ? model
            : 'llama-3.3-70b-versatile';

        // G. Teruskan Request ke Provider AI Resmi
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: selectedModel,
                messages,
                temperature: Math.min(Math.max(Number(temperature) || 0.3, 0.1), 1.0),
            }),
        });

        const data = await response.text();
        return new Response(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error?.message || 'Terjadi kesalahan internal proxy.' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}