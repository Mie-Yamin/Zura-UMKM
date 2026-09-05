import { auth } from "../config/firebase";

// Helper komunikasi aman ke proxy internal /api/ai
async function fetchChatCompletion(messages: Message[]): Promise<string> {
  // 1. Dapatkan pengguna aktif dari Firebase
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Sesi login berakhir atau Anda belum login. Silakan login kembali.");
  }

  // 2. Ambil token JWT terbaru
  const idToken = await currentUser.getIdToken();

  // 3. Kirim ke proxy internal Vercel dengan Bearer Token
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `HTTP error ${response.status} dari server AI`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (content) {
    return content;
  }

  throw new Error("Respon AI kosong.");
}