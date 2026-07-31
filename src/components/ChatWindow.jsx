import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

export default function ChatWindow({ messages, recommendations, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, recommendations, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-window">
      {isEmpty && (
        <div className="empty-state">
          <div className="empty-state__eyebrow">SHL Assessment Recommender</div>
          <div className="empty-state__title">
            Describe the role you're hiring for.
          </div>
          <div className="empty-state__hint">
            e.g. "Mid-level backend developer, strong in Python and system design"
          </div>
        </div>
      )}

      {messages.map((m, i) => (
        <MessageBubble key={i} role={m.role} content={m.content} />
      ))}

      <RecommendationCard recommendations={recommendations} />

      {loading && (
        <div className="bubble-row">
          <div className="bubble-label">Recommender</div>
          <div className="bubble bubble--assistant bubble--typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
