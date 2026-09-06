import { useState, useRef, useCallback } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBar from "./components/InputBar.jsx";
import { sendChatMessage } from "./api/chat.js";

const MAX_TURNS = 8;

const API_BASE = import.meta.env.VITE_API_URL;
const HEALTH_ENDPOINT = `${API_BASE}/health`;
const WAKE_MAX_ATTEMPTS = 20;      // ~60s cold-start coverage
const WAKE_RETRY_DELAY_MS = 3000;
const WAKE_FETCH_TIMEOUT_MS = 8000;

export default function App() {
  const [backendStatus, setBackendStatus] = useState("idle"); // idle | waking | ready | failed
  const [wakeAttempt, setWakeAttempt] = useState(0);
  const cancelledRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [endOfConversation, setEndOfConversation] = useState(false);
  const [error, setError] = useState("");

  const fetchWithTimeout = async (url, ms) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const startWaking = useCallback(async () => {
    cancelledRef.current = false;
    setBackendStatus("waking");
    setWakeAttempt(0);

    for (let i = 1; i <= WAKE_MAX_ATTEMPTS; i++) {
      if (cancelledRef.current) return;
      setWakeAttempt(i);

      const ok = await fetchWithTimeout(HEALTH_ENDPOINT, WAKE_FETCH_TIMEOUT_MS);
      if (ok) {
        setBackendStatus("ready");
        return;
      }
      await new Promise((r) => setTimeout(r, WAKE_RETRY_DELAY_MS));
    }

    setBackendStatus("failed");
  }, []);

  const turnCount = messages.length;
  const reachedLimit = turnCount >= MAX_TURNS;
  const inputDisabled = loading || endOfConversation || reachedLimit;

  async function handleSend(text) {
    setError("");
    const updatedMessages = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const data = await sendChatMessage(updatedMessages);

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: data.reply },
      ]);
      setRecommendations(data.recommendations || []);
      setEndOfConversation(Boolean(data.end_of_conversation));
    } catch (err) {
      setError(err.message || "Something went wrong talking to the backend.");
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "I couldn't reach the recommender service. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setRecommendations([]);
    setEndOfConversation(false);
    setError("");
  }

  let placeholder = "Describe the role, seniority, and skills you're hiring for…";
  if (reachedLimit) placeholder = "Conversation limit reached — start a new chat.";
  if (endOfConversation) placeholder = "Shortlist confirmed — start a new chat to continue.";

  if (backendStatus !== "ready") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header__title">SHL Assessment Recommender</div>
        </header>

        <div className="wake-screen">
          {backendStatus === "idle" && (
            <>
              <p className="wake-screen__text">
                This is a personal project hosted on a free-tier server. It
                sleeps when idle — click below to start it up before chatting.
              </p>
              <button className="wake-screen__button" onClick={startWaking}>
                Start Conversation
              </button>
            </>
          )}

          {backendStatus === "waking" && (
            <>
              <div className="wake-screen__spinner" />
              <p className="wake-screen__text">
                Waking up the backend… this can take up to a minute on the
                first visit (attempt {wakeAttempt}/{WAKE_MAX_ATTEMPTS}).
              </p>
            </>
          )}

          {backendStatus === "failed" && (
            <>
              <p className="wake-screen__text">
                Couldn't reach the backend after several tries. It might just
                be slow to start — want to try again?
              </p>
              <button className="wake-screen__button" onClick={startWaking}>
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title">SHL Assessment Recommender</div>
        <button className="app-header__reset" onClick={handleReset}>
          New chat
        </button>
      </header>

      <ChatWindow
        messages={messages}
        recommendations={recommendations}
        loading={loading}
      />

      {(endOfConversation || reachedLimit) && (
        <div className="status-banner">
          {endOfConversation
            ? "Shortlist confirmed — this conversation has ended."
            : "Maximum turn limit reached — please start a new conversation."}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <InputBar
        onSend={handleSend}
        disabled={inputDisabled}
        placeholder={placeholder}
      />
    </div>
  );
}