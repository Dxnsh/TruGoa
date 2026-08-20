import { useState, useEffect, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJournalBySlug } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import Footer from "../../components/Footer/Footer";
import { theme } from "../../Theme";
import { LoadingState } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";

// Turns **bold** and *italic* markers into React nodes. Deliberately limited
// to these two tokens (no raw HTML) so admin-authored content can't inject
// arbitrary markup.
const parseInline = (line, keyPrefix) => {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(line))) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b-${i}`}>{match[1]}</strong>);
    } else {
      parts.push(<em key={`${keyPrefix}-i-${i}`}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
    i++;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
};

const FormattedContent = ({ content }) => (
  <>
    {content.split(/\n{2,}/).map((paragraph, pi) => (
      <p key={pi} style={{ margin: "0 0 22px" }}>
        {paragraph.split("\n").map((line, li, arr) => (
          <Fragment key={li}>
            {parseInline(line, `${pi}-${li}`)}
            {li < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    ))}
  </>
);

const JournalPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setEntry(null);

    getJournalBySlug(slug)
      .then((data) => { if (!cancelled) setEntry(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingState message="Loading entry..." />;

  if (notFound || !entry) return (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <p style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 8 }}>404</p>
      <h1 style={{ fontFamily: theme.typography.fontDisplay, fontSize: 28, color: theme.colors.textPrimary }}>
        This entry doesn't exist.
      </h1>
      <button
        onClick={() => navigate("/journal")}
        style={{
          marginTop: 20, background: theme.colors.primary, color: "white", border: "none",
          borderRadius: theme.radii.md, padding: "12px 24px", fontSize: 14,
          fontWeight: theme.typography.weightBold, cursor: "pointer",
          fontFamily: theme.typography.fontBody,
        }}
      >
        Back to the Journal
      </button>
    </div>
  );

  return (
    <div style={{ background: theme.colors.bgPage, minHeight: "100vh" }}>
      <SEO
        path={`/journal/${slug}`}
        title={entry.title}
        description={entry.excerpt?.slice(0, 160) || `${entry.title} — from the TruGoa journal.`}
        image={entry.coverImage}
        type="article"
      />

      <div style={{
        aspectRatio: isMobile ? "4 / 3" : "21 / 8",
        backgroundImage: `url(${entry.coverImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />

      <div style={{
        maxWidth: 760, margin: "0 auto",
        padding: `40px ${isMobile ? "20px" : "24px"} 80px`,
      }}>
        <h1 style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: isMobile ? 28 : 38,
          fontWeight: theme.typography.weightBold,
          color: theme.colors.textPrimary,
          lineHeight: 1.2,
          margin: "0 0 12px",
        }}>
          {entry.title}
        </h1>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 32,
          fontSize: 13, color: theme.colors.textMuted,
        }}>
          {entry.author && <span>{entry.author}</span>}
          {entry.author && entry.readTime && <span>·</span>}
          {entry.readTime && <span>{entry.readTime}</span>}
        </div>

        <div style={{ fontSize: 16, lineHeight: 1.8, color: theme.colors.textBody }}>
          <FormattedContent content={entry.content} />
        </div>

        {entry.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 36 }}>
            {entry.tags.map((tag) => (
              <span key={tag} style={{
                background: theme.colors.primaryLight, color: theme.colors.primaryText,
                borderRadius: theme.radii.pill, padding: "4px 12px", fontSize: 12,
                fontWeight: theme.typography.weightMedium,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default JournalPostPage;
