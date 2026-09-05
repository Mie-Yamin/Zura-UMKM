import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verify as cryptoVerify, createPublicKey } from 'crypto';

// ─── KONFIGURASI KEAMANAN ────────────────────────────────────────────────────
// Hanya model yang diizinkan (allow-list) untuk mencegah abuse model mahal
const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'grok-2-latest',
  'grok-3',
]);

// Batas maksimum ukuran body request (bytes) ~ 1MB
const MAX_BODY_BYTES = 1024 * 1024;

// Batas maksimum pesan dalam satu percakapan
const MAX_MESSAGES = 30;

// Cache public key Firebase (kunci publik untuk verifikasi JWT ID token)
let certsCache: {
  expiresAt: number;
  certs: Record<string, string>; // kid -> PEM public key
} | null = null;

const CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

async function getPublicCerts(): Promise<Record<string, string> | null> {
  if (certsCache && certsCache.expiresAt > Date.now()) {
    return certsCache.certs;
  }

  try {
    const res = await fetch(CERT_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const certs: Record<string, string> = await res.json();
    certsCache = { expiresAt: Date.now() + CACHE_TTL_MS, certs };
    return certs;
  } catch {
    return null;
  }
}

// Dekode header JWT (base64url) tanpa verifikasi
function decodeJwtHeader(token: string): { kid?: string; alg?: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    return JSON.parse(headerJson);
  } catch {
    return null;
  }
}

// Dekode payload JWT (base64url) tanpa verifikasi
function decodeJwtPayload(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

// Verifikasi tanda tangan JWT RS256 menggunakan public key Firebase
function verifySignature(
  token: string,
  publicKeyPem: string
): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [, , signatureB64] = parts;

  try {
    const publicKey = createPublicKey(publicKeyPem);
    // Re-build signable data "header.payload"
    const signable = `${parts[0]}.${parts[1]}`;
    return cryptoVerify(
      'sha256',
      Buffer.from(signable, 'utf8'),
      publicKey,
      Buffer.from(signatureB64, 'base64url')
    );
  } catch {
    return false;
  }
}

// Verifikasi penuh Firebase ID Token (tanpa firebase-admin)
async function verifyFirebaseIdToken(token: string): Promise<string | null> {
  const header = decodeJwtHeader(token);
  const payload = decodeJwtPayload(token);
  if (!header || !payload || header.alg !== 'RS256' || !header.kid) {
    return null;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  // Validasi issuer & audience (harus cocok dengan project Firebase)
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    return null;
  }
  if (payload.aud !== projectId) {
    return null;
  }

  // Cek masa berlaku (exp) - izinkan leeway 5 menit
  const exp = Number(payload.exp || 0);
  const leeway = 5 * 60;
  if (exp === 0 || exp < Math.floor(Date.now() / 1000) - leeway) {
    return null;
  }

  // Ambil public key sesuai kid lalu verifikasi tanda tangan
  const certs = await getPublicCerts();
  if (!certs || !certs[header.kid]) return null;
  if (!verifySignature(token, certs[header.kid])) return null;

  // ID pengguna yang sah
  return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya terima POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Batasi ukuran body untuk mencegah body flooding
  const rawLength = req.headers['content-length'];
  if (rawLength && Number(rawLength) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request body terlalu besar' });
  }

  // Ambil & verifikasi Firebase ID Token dari header Authorization
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!idToken) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const verifiedUid = await verifyFirebaseIdToken(idToken);
  if (!verifiedUid) {
    return res.status(401).json({ error: 'Token autentikasi tidak valid' });
  }

  // Ambil API key dari Environment Variable server (tanpa embel-embel VITE_)
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key server belum dikonfigurasi' });
  }

  try {
    const { messages, model = 'llama-3.3-70b-versatile' } = req.body ?? {};

    // Validasi messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages tidak valid' });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: 'Terlalu banyak pesan dalam percakapan' });
    }

    // Allow-list model (cegah abuse model mahal / arbitrary)
    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: 'Model tidak diizinkan' });
    }

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
