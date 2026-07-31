import { useState } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBar from "./components/InputBar.jsx";
import { sendChatMessage } from "./api/chat.js";

const MAX_TURNS = 8;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [endOfConversation, setEndOfConversation] = useState(false);
  const [error, setError] = useState("");

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
