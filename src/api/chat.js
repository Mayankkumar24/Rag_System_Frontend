const API_URL = import.meta.env.VITE_API_URL;

/**
 * Sends the full conversation history to the backend.
 * The backend is stateless — it expects the entire messages
 * array (all previous turns + the newest user message) on
 * every request, and returns the next assistant turn.
 *
 * @param {{role: "user"|"assistant", content: string}[]} messages
 * @returns {Promise<{reply: string, recommendations: Array, end_of_conversation: boolean}>}
 */
export async function sendChatMessage(messages) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not set. Add it to a .env file."
    );
  }

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Backend returned ${res.status}${text ? `: ${text}` : ""}`
    );
  }

  return res.json();
}
