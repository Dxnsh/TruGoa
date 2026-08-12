import { useState } from "react";
import { theme } from "../../Theme";
import { adminCreateStory, adminUpdateStory } from "../../services/api";
import { inputStyle, labelStyle } from "./adminFormKit";
import { SingleImageUpload } from "./ImageUpload";

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const sectionHeadStyle = {
  fontFamily: theme.typography.fontDisplay,
  fontSize: 13,
  fontWeight: theme.typography.weightBold,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: theme.colors.textMuted,
  borderTop: `1px solid ${theme.colors.borderLight}`,
  margin: "24px 0 14px",
  paddingTop: 20,
};

const smallBtn = (variant = "default") => ({
  background: variant === "danger" ? theme.colors.dangerBg : theme.colors.bgSurface,
  color: variant === "danger" ? theme.colors.danger : theme.colors.textBody,
  border: `1px solid ${variant === "danger" ? theme.colors.danger + "40" : theme.colors.borderLight}`,
  borderRadius: theme.radii.md, padding: "6px 14px", fontSize: 12,
  fontWeight: theme.typography.weightBold, cursor: "pointer",
  fontFamily: theme.typography.fontBody,
});

const blankArticle = () => ({
  slug: "", title: "", excerpt: "", image: "", readTime: "", pullQuote: "",
  location: "", latitude: "", longitude: "",
  introTitle: "", introBody: "",
  activities: [],
  nearestAirport: "", nearestRailway: "",
});

const blankTop = {
  category: "", slug: "", title: "", desc: "", image: "", readTime: "",
  manifestoTitle: "", manifestoText1: "", manifestoText2: "",
};

const toFormState = (story) => ({
  ...blankTop,
  ...story,
  stories: (story.stories || []).map(a => ({
    ...blankArticle(),
    ...a,
    latitude:  a.latitude  != null ? String(a.latitude)  : "",
    longitude: a.longitude != null ? String(a.longitude) : "",
    activities: a.activities || [],
  })),
});

/* ── one activity row inside an article ─────────────────────── */
function ActivityRow({ activity, onChange, onRemove }) {
  return (
    <div style={{
      border: `1px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.md,
      padding: 12, marginBottom: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button type="button" style={smallBtn("danger")} onClick={onRemove}>Remove</button>
      </div>
      <input style={inputStyle} placeholder="Activity title" value={activity.title}
        onChange={e => onChange({ ...activity, title: e.target.value })} />
      <div style={{ height: 8 }} />
      <textarea style={{ ...inputStyle, minHeight: 40 }} placeholder="Description"
        value={activity.desc} onChange={e => onChange({ ...activity, desc: e.target.value })} />
      <SingleImageUpload label="Activity Image" value={activity.image} onChange={url => onChange({ ...activity, image: url })} />
    </div>
  );
}

/* ── one article (sub-story) editor ──────────────────────────── */
function ArticleEditor({ article, index, onChange, onRemove }) {
  const [open, setOpen] = useState(true);
  const set = (field, value) => onChange({ ...article, [field]: value });

  const addActivity = () => set("activities", [...article.activities, { title: "", desc: "", image: "" }]);
  const updateActivity = (i, next) => {
    const activities = [...article.activities];
    activities[i] = next;
    set("activities", activities);
  };
  const removeActivity = (i) => set("activities", article.activities.filter((_, idx) => idx !== i));

  return (
    <div style={{
      border: `1.5px solid ${theme.colors.borderLight}`, borderRadius: theme.radii.lg,
      marginBottom: 16, overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", background: theme.colors.bgSurface, cursor: "pointer",
      }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary }}>
          Article {index + 1}{article.title ? ` — ${article.title}` : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
          <button type="button" style={smallBtn()} onClick={() => setOpen(o => !o)}>{open ? "Collapse" : "Expand"}</button>
          <button type="button" style={smallBtn("danger")} onClick={onRemove}>Remove Article</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Slug *"><input style={inputStyle} value={article.slug} onChange={e => set("slug", e.target.value)} /></Field>
            <Field label="Title *"><input style={inputStyle} value={article.title} onChange={e => set("title", e.target.value)} /></Field>
          </div>

          <Field label="Excerpt">
            <textarea style={{ ...inputStyle, minHeight: 50 }} value={article.excerpt} onChange={e => set("excerpt", e.target.value)} />
          </Field>

          <SingleImageUpload label="Article Image" value={article.image} onChange={url => set("image", url)} />
          <Field label="Read Time"><input style={inputStyle} value={article.readTime} onChange={e => set("readTime", e.target.value)} placeholder="5 min read" /></Field>

          {/* ── The Story ── shown right after the hero on the page */}
          <div style={sectionHeadStyle}>The Story</div>
          <Field label="Intro Title">
            <input style={inputStyle} value={article.introTitle} onChange={e => set("introTitle", e.target.value)} />
          </Field>
          <Field label="Intro Body">
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={article.introBody} onChange={e => set("introBody", e.target.value)} />
          </Field>
          <Field label="Pull Quote">
            <input style={inputStyle} value={article.pullQuote} onChange={e => set("pullQuote", e.target.value)} />
          </Field>

          {/* ── Unique Experiences ── shown next on the page */}
          <div style={sectionHeadStyle}>Unique Experiences</div>
          <div style={{ marginBottom: 8 }}>
            {article.activities.map((act, i) => (
              <ActivityRow key={i} activity={act} onChange={next => updateActivity(i, next)} onRemove={() => removeActivity(i)} />
            ))}
            <button type="button" style={smallBtn()} onClick={addActivity}>+ Add Activity</button>
          </div>

          {/* ── Trip Info ── the sidebar next to the story: map + nearest airport/railway */}
          <div style={sectionHeadStyle}>Trip Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Location"><input style={inputStyle} value={article.location} onChange={e => set("location", e.target.value)} placeholder="Agonda, South Goa" /></Field>
            <Field label="Latitude"><input style={inputStyle} type="number" step="any" value={article.latitude} onChange={e => set("latitude", e.target.value)} /></Field>
            <Field label="Longitude"><input style={inputStyle} type="number" step="any" value={article.longitude} onChange={e => set("longitude", e.target.value)} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Nearest Airport"><input style={inputStyle} value={article.nearestAirport} onChange={e => set("nearestAirport", e.target.value)} placeholder="Bodh Gaya Airport (GAY)" /></Field>
            <Field label="Nearest Railway Station"><input style={inputStyle} value={article.nearestRailway} onChange={e => set("nearestRailway", e.target.value)} placeholder="Gaya Junction Railway Station (GAYA)" /></Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main form ────────────────────────────────────────────────── */
const StoryForm = ({ story, onClose, onSaved }) => {
  const isEdit = !!story?._id;
  const [form, setForm] = useState(story ? toFormState(story) : { ...blankTop, stories: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addArticle = () => set("stories", [...form.stories, blankArticle()]);
  const updateArticle = (i, next) => {
    const stories = [...form.stories];
    stories[i] = next;
    set("stories", stories);
  };
  const removeArticle = (i) => set("stories", form.stories.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category.trim() || !form.slug.trim() || !form.title.trim() || !form.image.trim()) {
      setError("Category, slug, title and image are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      stories: form.stories.map(a => ({
        ...a,
        latitude:  a.latitude  ? Number(a.latitude)  : undefined,
        longitude: a.longitude ? Number(a.longitude) : undefined,
      })),
    };

    try {
      const saved = isEdit
        ? await adminUpdateStory(story._id, payload)
        : await adminCreateStory(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 900 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 901, background: "white", borderRadius: theme.radii.xl,
        width: "94%", maxWidth: 840, maxHeight: "88vh", overflowY: "auto",
        boxShadow: theme.shadows.modal, border: `1px solid ${theme.colors.borderLight}`,
        fontFamily: theme.typography.fontBody,
      }}>
        <div style={{
          position: "sticky", top: 0, background: "white", zIndex: 1,
          padding: "20px 28px", borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{
            fontFamily: theme.typography.fontDisplay, fontSize: 20,
            fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
          }}>
            {isEdit ? `Edit ${story.title}` : "New Story Collection"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: theme.colors.textMuted, cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Category *"><input style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} placeholder="DESTINATIONS" /></Field>
            <Field label="Slug *"><input style={inputStyle} value={form.slug} onChange={e => set("slug", e.target.value)} /></Field>
          </div>

          <Field label="Title *"><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} /></Field>
          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.desc} onChange={e => set("desc", e.target.value)} />
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>
              Used for search results and social previews. Also shown as the first paragraph on the page itself, above the Opening Section text below.
            </div>
          </Field>

          <SingleImageUpload label="Cover Image *" value={form.image} onChange={url => set("image", url)} />
          <Field label="Read Time"><input style={inputStyle} value={form.readTime} onChange={e => set("readTime", e.target.value)} placeholder="8 min read" /></Field>

          {/* ── Opening section — shown right under the hero on /stories/:slug ── */}
          <div style={sectionHeadStyle}>Opening Section (shown on the page)</div>
          <Field label="Title">
            <input style={inputStyle} value={form.manifestoTitle} onChange={e => set("manifestoTitle", e.target.value)} />
          </Field>
          <Field label="Paragraph 1">
            <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.manifestoText1} onChange={e => set("manifestoText1", e.target.value)} />
          </Field>
          <Field label="Paragraph 2 (optional)">
            <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.manifestoText2} onChange={e => set("manifestoText2", e.target.value)} />
          </Field>

          <div style={{ marginTop: 24, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle}>Articles in this Collection</label>
            <button type="button" style={smallBtn()} onClick={addArticle}>+ Add Article</button>
          </div>

          {form.stories.map((article, i) => (
            <ArticleEditor
              key={i}
              article={article}
              index={i}
              onChange={next => updateArticle(i, next)}
              onRemove={() => removeArticle(i)}
            />
          ))}

          {error && (
            <div style={{
              background: theme.colors.dangerBg, border: `1px solid ${theme.colors.danger}40`,
              borderRadius: theme.radii.md, padding: "10px 14px", fontSize: 13,
              color: theme.colors.danger, margin: "16px 0",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{
              background: "none", border: `1.5px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.md, padding: "12px 22px", fontSize: 14,
              fontWeight: theme.typography.weightMedium, color: theme.colors.textBody,
              cursor: "pointer", fontFamily: theme.typography.fontBody,
            }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              background: saving ? theme.colors.borderLight : theme.colors.primary,
              border: "none", borderRadius: theme.radii.md, padding: "12px 26px", fontSize: 14,
              fontWeight: theme.typography.weightBold, color: "white",
              cursor: saving ? "not-allowed" : "pointer", fontFamily: theme.typography.fontBody,
            }}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Story Collection"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default StoryForm;
