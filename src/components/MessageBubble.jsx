export default function MessageBubble({ role, content, isError }) {
  const isUser = role === "user";

  return (
    <div className={`bubble-row ${isUser ? "bubble-row--user" : ""}`}>
      <div className="bubble-label">{isUser ? "You" : "Recommender"}</div>
      <div
        className={`bubble ${isUser ? "bubble--user" : "bubble--assistant"} ${
          isError ? "bubble--error" : ""
        }`}
      >
        {content}
      </div>
    </div>
  );
}
