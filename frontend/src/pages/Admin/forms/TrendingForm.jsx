import { useState } from "react";
import { inputStyle, saveTrendingPlace } from "../adminFormKit";
import { Field, Row, SectionHeading, ModalShell } from "./formUI";
import { SingleImageUpload, GalleryUpload } from "../ImageUpload";

const BADGES = ["TRENDING", "POPULAR", "HIDDEN GEM", "TONIGHT", "WHAT'S HOT"];

const blank = {
  title: "", slug: "", location: "",
  badge: "TRENDING",
  description: "", longDescription: "",
  image: "", gallery: [], avatars: [],
  lovedCount: 0, order: 0, isActive: true,
};

const toFormState = (item) => ({
  ...blank,
  ...item,
  gallery: item.gallery || [],
  avatars: item.avatars || [],
});

const TrendingForm = ({ trendingItem, onClose, onSaved }) => {
  const isEdit = !!trendingItem?._id;
  const [form, setForm] = useState(trendingItem ? toFormState(trendingItem) : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.image.trim()) {
      setError("Title, location, and a card image are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-") || form.title.trim().toLowerCase().replace(/\s+/g, "-"),
      lovedCount: Number(form.lovedCount) || 0,
      order: Number(form.order) || 0,
    };

    try {
      const saved = await saveTrendingPlace(trendingItem, payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? `Edit ${trendingItem.title}` : "Add Trending Place"}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      saveLabel={isEdit ? "Save Changes" : "Add Trending Place"}
    >
      <SectionHeading>Basics</SectionHeading>
      <Row>
        <Field label="Title *">
          <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Sunset at Ashwem" />
        </Field>
        <Field label="Badge *">
          <select style={inputStyle} value={form.badge} onChange={e => set("badge", e.target.value)}>
            {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Location *">
          <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Ashwem Beach" />
        </Field>
        <Field label="Slug (leave blank to auto-generate)">
          <input style={inputStyle} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="sunset-at-ashwem" />
        </Field>
      </Row>

      <SectionHeading>Story</SectionHeading>
      <Field label="Short Description (card blurb) *">
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Golden skies, soft waves and that perfect Goan calm." />
      </Field>
      <Field label="Long Description (detail page)">
        <textarea style={{ ...inputStyle, minHeight: 90 }} value={form.longDescription} onChange={e => set("longDescription", e.target.value)} />
      </Field>

      <SectionHeading>Media</SectionHeading>
      <SingleImageUpload label="Card Image *" value={form.image} onChange={url => set("image", url)} />
      <GalleryUpload label="Detail Page Gallery" values={form.gallery} onChange={arr => set("gallery", arr)} />
      <GalleryUpload label="Traveller Avatars" values={form.avatars} onChange={arr => set("avatars", arr)} />

      <SectionHeading>Display</SectionHeading>
      <Row>
        <Field label="Loved Count">
          <input type="number" style={inputStyle} value={form.lovedCount} onChange={e => set("lovedCount", e.target.value)} placeholder="2600" />
        </Field>
        <Field label="Display Order">
          <input type="number" style={inputStyle} value={form.order} onChange={e => set("order", e.target.value)} placeholder="0" />
        </Field>
      </Row>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
        Active (visible on homepage)
      </label>
    </ModalShell>
  );
};

export default TrendingForm;