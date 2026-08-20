import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJournals } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import Footer from "../../components/Footer/Footer";
import { theme } from "../../Theme";
import { LoadingState, EmptyState } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";

const JournalPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getJournals()
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ background: theme.colors.bgPage, minHeight: "100vh" }}>
      <SEO
        path="/journal"
        title="Journal"
        description="Notes, stories and honest tips from TruGoa — real Goa, written by people who know it."
      />

      <div style={{ padding: `48px ${isMobile ? "16px" : theme.spacing.pagePadding}` }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: isMobile ? 32 : 44,
            fontWeight: theme.typography.weightBold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            The TruGoa Journal
          </h1>
          <p style={{
            fontSize: 15, color: theme.colors.textMuted, marginTop: 10,
            maxWidth: 560, marginLeft: "auto", marginRight: "auto",
          }}>
            Notes from the road — stories, guides and honest tips from people who actually know Goa.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading the journal..." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="📝"
            title="Nothing published yet"
            subtitle="The first journal entries are on the way — check back soon."
          />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
            maxWidth: 1200,
            margin: "0 auto",
          }}>
            {entries.map((entry) => (
              <article
                key={entry.slug}
                onClick={() => navigate(`/journal/${entry.slug}`)}
                style={{
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.lg,
                  overflow: "hidden",
                  boxShadow: theme.shadows.card,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  transition: theme.transitions.fast,
                }}
              >
                <div style={{
                  aspectRatio: "16 / 10",
                  backgroundImage: `url(${entry.coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  background: theme.colors.bgSurface,
                }} />
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <h2 style={{
                    fontFamily: theme.typography.fontDisplay,
                    fontSize: 19,
                    fontWeight: theme.typography.weightBold,
                    color: theme.colors.textPrimary,
                    margin: 0,
                    lineHeight: 1.3,
                  }}>
                    {entry.title}
                  </h2>
                  {entry.excerpt && (
                    <p style={{
                      fontSize: 13.5, color: theme.colors.textBody, lineHeight: 1.55,
                      margin: 0,
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {entry.excerpt}
                    </p>
                  )}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 10,
                    fontSize: 12, color: theme.colors.textMuted,
                  }}>
                    {entry.author && <span>{entry.author}</span>}
                    {entry.author && entry.readTime && <span>·</span>}
                    {entry.readTime && <span>{entry.readTime}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default JournalPage;
