import { useState } from "react";
import {
  inputStyle, toList, saveBusiness,
  blankOpeningHours, openingHoursToForm, openingHoursFromForm,
} from "../adminFormKit";
import { Field, Row, SectionHeading, ModalShell, PinField } from "./formUI";
import { SingleImageUpload, GalleryUpload } from "../ImageUpload";
import OpeningHoursEditor from "../OpeningHoursEditor";

const AREAS = ["north-goa", "south-goa", "panaji", "central-goa"];
const PRICE_LEVELS = ["budget", "mid", "premium"];

const blank = {
  name: "", location: "", area: "", googleMapUrl: "", latitude: null, longitude: null,
  tagline: "", description: "", localTip: "",
  highlights: "", mustTry: "",
  priceRange: "", priceLevel: "", openingHours: blankOpeningHours(), openingHoursNote: "", phone: "", website: "",
  scamAlert: "", safetyTip: "",
  heroImage: "", gallery: [], tags: "",
  featured: false, editorPick: false,
};

const toFormState = (biz) => ({
  ...blank,
  ...biz,
  highlights: (biz.highlights || []).join(", "),
  mustTry:    (biz.mustTry    || []).join(", "),
  tags:       (biz.tags       || []).join(", "),
  gallery:    biz.gallery || [],
  openingHours: openingHoursToForm(biz.openingHours),
  openingHoursNote: biz.openingHoursNote || "",
});

const NightlifeForm = ({ business, onClose, onSaved }) => {
  const isEdit = !!business?._id;
  const [form, setForm] = useState(business ? toFormState(business) : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError("Name and location are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      category: "nightlife",
      highlights: toList(form.highlights),
      mustTry:    toList(form.mustTry),
      tags:       toList(form.tags),
      openingHours: openingHoursFromForm(form.openingHours) ?? null,
    };

    try {
      const saved = await saveBusiness(business, payload);
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
      title={isEdit ? `Edit ${business.name}` : "Add Nightlife Spot"}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      saveLabel={isEdit ? "Save Changes" : "Add Spot"}
    >
      <SectionHeading>Basics</SectionHeading>
      <Row>
        <Field label="Name *">
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tito's Lane" />
        </Field>
        <Field label="Area">
          <select style={inputStyle} value={form.area} onChange={e => set("area", e.target.value)}>
            <option value="">Select area</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </Row>
      <Field label="Location *">
        <input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Baga, North Goa" />
      </Field>
      <Field label="Google Maps URL">
        <input style={inputStyle} value={form.googleMapUrl} onChange={e => set("googleMapUrl", e.target.value)} placeholder="https://maps.google.com/?q=..." />
      </Field>
      <PinField
        latitude={form.latitude}
        longitude={form.longitude}
        mapUrl={form.googleMapUrl}
        onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
      />

      <SectionHeading>Story</SectionHeading>
      <Field label="Tagline">
        <input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Goa's after-dark hotspot" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.description} onChange={e => set("description", e.target.value)} />
      </Field>
      <Field label="Local Tip">
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.localTip} onChange={e => set("localTip", e.target.value)} />
      </Field>
      <Row>
        <Field label="Highlights (comma separated)">
          <input style={inputStyle} value={form.highlights} onChange={e => set("highlights", e.target.value)} placeholder="Live DJ, beachside seating" />
        </Field>
        <Field label="Must Try (comma separated)">
          <input style={inputStyle} value={form.mustTry} onChange={e => set("mustTry", e.target.value)} placeholder="Signature cocktails" />
        </Field>
      </Row>

      <SectionHeading>Pricing & Hours</SectionHeading>
      <Row>
        <Field label="Price Range">
          <input style={inputStyle} value={form.priceRange} onChange={e => set("priceRange", e.target.value)} placeholder="₹1,000–₹2,500 for two" />
        </Field>
        <Field label="Price Level">
          <select style={inputStyle} value={form.priceLevel} onChange={e => set("priceLevel", e.target.value)}>
            <option value="">Select price level</option>
            {PRICE_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </Row>
      <OpeningHoursEditor value={form.openingHours} onChange={oh => set("openingHours", oh)} />
      <Row>
        <Field label="Hours Note (freeform, optional)">
          <input style={inputStyle} value={form.openingHoursNote} onChange={e => set("openingHoursNote", e.target.value)} placeholder="Last entry 1am · Ladies' night Weds" />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} />
        </Field>
      </Row>
      <Field label="Website">
        <input style={inputStyle} value={form.website} onChange={e => set("website", e.target.value)} />
      </Field>

      <SectionHeading>Media</SectionHeading>
      <SingleImageUpload label="Hero Image" value={form.heroImage} onChange={url => set("heroImage", url)} />
      <GalleryUpload label="Gallery Images" values={form.gallery} onChange={arr => set("gallery", arr)} />

      <SectionHeading>Safety</SectionHeading>
      <Row>
        <Field label="Scam Alert">
          <input style={inputStyle} value={form.scamAlert} onChange={e => set("scamAlert", e.target.value)} />
        </Field>
        <Field label="Safety Tip">
          <input style={inputStyle} value={form.safetyTip} onChange={e => set("safetyTip", e.target.value)} />
        </Field>
      </Row>

      <SectionHeading>Tags & Flags</SectionHeading>
      <Field label="Tags (comma separated)">
        <input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="hidden, popular, editors-pick" />
      </Field>
      <div style={{ display: "flex", gap: 24, marginBottom: 4 }}>
        {[{ key: "featured", label: "Featured" }, { key: "editorPick", label: "Editor's Pick" }].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
    </ModalShell>
  );
};

export default NightlifeForm;
