import { useEffect, useState } from "react";
import {
  getAdminTrendingPlaces,
  createTrendingPlace,
  updateTrendingPlace,
  deleteTrendingPlace,
} from "../../services/api";
import "./adminTrendingPlaces.css";

const BLANK_FORM = {
  title: "", slug: "", location: "", description: "", longDescription: "",
  badge: "TRENDING", image: "", gallery: "", avatars: "",
  lovedCount: 0, order: 0, isActive: true,
};

const AdminTrendingPlaces = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await getAdminTrendingPlaces());
    } catch {
      setError("Failed to load trending places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const openCreate = () => { setEditingId(null); setForm(BLANK_FORM); setShowForm(true); };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      ...item,
      gallery: (item.gallery || []).join(", "),
      avatars: (item.avatars || []).join(", "),
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      lovedCount: Number(form.lovedCount) || 0,
      order: Number(form.order) || 0,
      gallery: form.gallery.split(",").map((s) => s.trim()).filter(Boolean),
      avatars: form.avatars.split(",").map((s) => s.trim()).filter(Boolean),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    };
    try {
      if (editingId) await updateTrendingPlace(editingId, payload);
      else await createTrendingPlace(payload);
      setShowForm(false);
      loadItems();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trending place?")) return;
    try {
      await deleteTrendingPlace(id);
      loadItems();
    } catch {
      setError("Failed to delete");
    }
  };

  return (
    <div className="atp-root">
      <div className="atp-head">
        <h2>Trending Places</h2>
        <button className="atp-add" onClick={openCreate}>+ Add Trending Place</button>
      </div>

      {error && <p className="atp-error">{error}</p>}

      {loading ? <p>Loading&hellip;</p> : (
        <table className="atp-table">
          <thead>
            <tr>
              <th>Order</th><th>Image</th><th>Title</th><th>Badge</th>
              <th>Location</th><th>Loved</th><th>Active</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.order}</td>
                <td><img src={item.image} alt="" className="atp-thumb" /></td>
                <td>{item.title}</td>
                <td>{item.badge}</td>
                <td>{item.location}</td>
                <td>{item.lovedCount}</td>
                <td>{item.isActive ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => openEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="atp-modal-backdrop" onClick={() => setShowForm(false)}>
          <form className="atp-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>{editingId ? "Edit" : "Add"} Trending Place</h3>

            <label>Title
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>Slug (URL-safe, auto-formatted on save)
              <input name="slug" value={form.slug} onChange={handleChange} required />
            </label>
            <label>Location
              <input name="location" value={form.location} onChange={handleChange} required />
            </label>
            <label>Badge
              <select name="badge" value={form.badge} onChange={handleChange}>
                <option>TRENDING</option>
                <option>POPULAR</option>
                <option>HIDDEN GEM</option>
                <option>TONIGHT</option>
                <option>WHAT'S HOT</option>
              </select>
            </label>
            <label>Short Description
              <textarea name="description" value={form.description} onChange={handleChange} required />
            </label>
            <label>Long Description (detail page)
              <textarea name="longDescription" value={form.longDescription} onChange={handleChange} />
            </label>
            <label>Card Image URL
              <input name="image" value={form.image} onChange={handleChange} required />
            </label>
            <label>Gallery Image URLs (comma-separated)
              <input name="gallery" value={form.gallery} onChange={handleChange} />
            </label>
            <label>Avatar URLs (comma-separated)
              <input name="avatars" value={form.avatars} onChange={handleChange} />
            </label>
            <label>Loved Count
              <input type="number" name="lovedCount" value={form.lovedCount} onChange={handleChange} />
            </label>
            <label>Display Order
              <input type="number" name="order" value={form.order} onChange={handleChange} />
            </label>
            <label className="atp-checkbox">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active (visible on homepage)
            </label>

            <div className="atp-modal-actions">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTrendingPlaces;s