const TYPE_LABELS = {
  K: "Knowledge & Skills",
  P: "Personality & Behavior",
  A: "Ability & Aptitude",
  S: "Simulations",
  B: "Biodata & Situational Judgement",
  C: "Competencies",
  D: "Development & 360",
  E: "Assessment Exercises",
};

function typeCodesToLabels(codeString) {
  if (!codeString) return [];
  return codeString
    .split(/\s+/)
    .filter(Boolean)
    .map((code) => ({ code, label: TYPE_LABELS[code] || code }));
}

export default function RecommendationCard({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="recs">
      <div className="recs__note">
        It is possible that the URLs aren't working because SHL has made his assessments private.
      </div>
      <div className="recs__heading">
        Shortlist <span className="recs__count">{recommendations.length}</span>
      </div>
      <div className="recs__list">
        {recommendations.map((rec, i) => (
          <a
            key={`${rec.url}-${i}`}
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rec-card"
          >
            <div className="rec-card__index">{String(i + 1).padStart(2, "0")}</div>
            <div className="rec-card__body">
              <div className="rec-card__name">{rec.name}</div>
              <div className="rec-card__types">
                {typeCodesToLabels(rec.test_type).map((t) => (
                  <span key={t.code} className="rec-card__badge" title={t.label}>
                    {t.code}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
