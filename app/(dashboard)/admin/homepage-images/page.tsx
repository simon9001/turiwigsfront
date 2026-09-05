'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Upload, Trash2, CheckCircle, XCircle, ImagePlus,
  LayoutDashboard, GripVertical, Eye, EyeOff, Loader2,
  ArrowUpDown, Save,
} from 'lucide-react';
import { homepageImagesApi, type HomepageImage, type HomepageSection } from '@/api/homepage-images.api';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = HomepageSection;

interface Tab {
  id: TabId;
  label: string;
  description: string;
  hasMetadata: boolean; // hero cards need label/caption/href
}

const TABS: Tab[] = [
  {
    id:          'hero',
    label:       'Hero Carousel',
    description: 'Images displayed in the homepage hero carousel. Each image can have a label (badge), caption, and link.',
    hasMetadata: true,
  },
  {
    id:          'philosophy_nails',
    label:       'Nails Gallery',
    description: 'Fan-scatter gallery for the Nails section. Minimum 3 images recommended; 6–11 ideal.',
    hasMetadata: false,
  },
  {
    id:          'philosophy_wigs',
    label:       'Wigs Gallery',
    description: 'Fan-scatter gallery for the Wigs section. Minimum 3 images recommended.',
    hasMetadata: false,
  },
  {
    id:          'cta',
    label:       'Book CTA Collage',
    description: 'Photo collage background for the "Book Your Appointment" section. 9 images fill the grid perfectly.',
    hasMetadata: false,
  },
];

// ─── Style tokens ─────────────────────────────────────────────────────────────
const GOLD  = '#8b8881';
const DARK  = '#171614';
const GREEN = '#10b981';
const RED   = '#ef4444';

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; type: 'success' | 'error'; text: string }

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, push };
}

// ─── Upload form per section ──────────────────────────────────────────────────
interface UploadFormProps {
  section: HomepageSection;
  hasMetadata: boolean;
  nextSortOrder: number;
  onSuccess: (img: HomepageImage) => void;
  onError: (msg: string) => void;
}

function UploadForm({ section, hasMetadata, nextSortOrder, onSuccess, onError }: UploadFormProps) {
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel]     = useState('');
  const [caption, setCaption] = useState('');
  const [href, setHref]       = useState('/services');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  function pickFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await homepageImagesApi.create({
        file,
        section,
        label:       hasMetadata ? label   : undefined,
        caption:     hasMetadata ? caption : undefined,
        href:        hasMetadata ? href    : undefined,
        sort_order:  nextSortOrder,
      });
      onSuccess(data.data!);
      setFile(null);
      setPreview(null);
      setLabel('');
      setCaption('');
      setHref('/services');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Upload failed';
      onError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(160deg,#ffffff,#f4f4f2)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        padding: '1.5rem',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ImagePlus size={18} color={GOLD} />
        <span className="font-bold text-sm uppercase tracking-widest" style={{ color: DARK }}>
          Add New Image
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${preview ? GOLD : 'rgba(0,0,0,0.15)'}`,
          borderRadius: 12,
          background: preview ? 'transparent' : 'rgba(23,22,20,0.03)',
          cursor: 'pointer',
          minHeight: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          transition: 'border-color 0.2s',
          marginBottom: '1rem',
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Upload size={32} color="rgba(0,0,0,0.2)" />
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>
              Drag &amp; drop an image here, or <span style={{ color: GOLD }}>click to browse</span>
            </p>
            <p className="text-xs" style={{ color: 'rgba(0,0,0,0.3)' }}>JPEG, PNG, WebP or GIF · Max 8 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
        />
      </div>

      {/* Hero-specific metadata */}
      {hasMetadata && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: DARK }}>
                Badge Label
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. NAILS"
                maxLength={20}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.12)', fontSize: 13,
                  outline: 'none', background: '#fff',
                }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: DARK }}>
                Link (href)
              </label>
              <input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/services"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.12)', fontSize: 13,
                  outline: 'none', background: '#fff',
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1" style={{ color: DARK }}>
              Caption Text
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Expert manicures crafted to perfection."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)', fontSize: 13,
                outline: 'none', background: '#fff',
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          background: file && !uploading
            ? `#171614`
            : 'rgba(0,0,0,0.06)',
          border: 'none',
          cursor: file && !uploading ? 'pointer' : 'not-allowed',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: file && !uploading ? '#000' : 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
      >
        {uploading ? (
          <><Loader2 size={16} className="animate-spin" /> Uploading…</>
        ) : (
          <><Upload size={16} /> Upload Image</>
        )}
      </button>
    </div>
  );
}

// ─── Image card ───────────────────────────────────────────────────────────────
interface ImageCardProps {
  img: HomepageImage;
  hasMetadata: boolean;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onSave: (id: string, updates: Partial<HomepageImage>) => void;
}

function ImageCard({ img, hasMetadata, onDelete, onToggleActive, onSave }: ImageCardProps) {
  const [deleting, setDeleting]   = useState(false);
  const [toggling, setToggling]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [label, setLabel]         = useState(img.label ?? '');
  const [caption, setCaption]     = useState(img.caption ?? '');
  const [href, setHref]           = useState(img.href ?? '');
  const [sortOrder, setSortOrder] = useState(String(img.sort_order));
  const [saving, setSaving]       = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    setDeleting(true);
    try { await onDelete(img.id); } finally { setDeleting(false); }
  }

  async function handleToggle() {
    setToggling(true);
    try { await onToggleActive(img.id, !img.is_active); } finally { setToggling(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(img.id, {
        label:      hasMetadata ? label   : img.label,
        caption:    hasMetadata ? caption : img.caption,
        href:       hasMetadata ? href    : img.href,
        sort_order: parseInt(sortOrder, 10) || 0,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: img.is_active
          ? 'linear-gradient(160deg,#ffffff,#f4f4f2)'
          : 'rgba(0,0,0,0.04)',
        border: `1px solid ${img.is_active ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.12)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        opacity: img.is_active ? 1 : 0.7,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ aspectRatio: '4/3' }}>
        <Image src={img.url} alt="" fill className="object-cover" sizes="280px" />
        {/* Active badge */}
        <div
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: img.is_active ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.5)',
            color: '#fff',
          }}
        >
          {img.is_active ? 'Active' : 'Hidden'}
        </div>
        {/* Sort order badge */}
        <div
          className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
        >
          #{img.sort_order}
        </div>
      </div>

      {/* Metadata / edit */}
      <div style={{ padding: '0.75rem' }}>
        {hasMetadata && !editing && (
          <div className="mb-2">
            {img.label   && <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>{img.label}</p>}
            {img.caption && <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.5)' }}>{img.caption}</p>}
            {img.href    && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.3)' }}>{img.href}</p>}
          </div>
        )}

        {editing && (
          <div className="flex flex-col gap-2 mb-3">
            {hasMetadata && (
              <>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Badge label"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 12,
                    border: '1px solid rgba(0,0,0,0.15)', outline: 'none', width: '100%',
                  }}
                />
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 12,
                    border: '1px solid rgba(0,0,0,0.15)', outline: 'none', width: '100%',
                  }}
                />
                <input
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="Link href"
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 12,
                    border: '1px solid rgba(0,0,0,0.15)', outline: 'none', width: '100%',
                  }}
                />
              </>
            )}
            <div className="flex items-center gap-2">
              <GripVertical size={14} color="rgba(0,0,0,0.35)" />
              <input
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                type="number"
                min={0}
                placeholder="Sort order"
                style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, width: '100%',
                  border: '1px solid rgba(0,0,0,0.15)', outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {editing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8, border: 'none',
                background: `#171614`, cursor: 'pointer',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <ArrowUpDown size={12} /> Edit
            </button>
          )}

          <button
            onClick={handleToggle}
            disabled={toggling}
            title={img.is_active ? 'Hide from homepage' : 'Show on homepage'}
            style={{
              padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
              cursor: 'pointer', background: '#fff',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            {toggling
              ? <Loader2 size={13} className="animate-spin" color="rgba(0,0,0,0.4)" />
              : img.is_active
                ? <EyeOff size={13} color="rgba(0,0,0,0.45)" />
                : <Eye size={13} color={GREEN} />}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete image"
            style={{
              padding: '6px 8px', borderRadius: 8,
              border: `1px solid rgba(${deleting ? '0,0,0,0.1' : '239,68,68,0.3'})`,
              cursor: 'pointer', background: '#fff',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            {deleting
              ? <Loader2 size={13} className="animate-spin" color={RED} />
              : <Trash2 size={13} color={RED} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomepageImagesPage() {
  const [activeTab, setActiveTab]   = useState<TabId>('hero');
  const [imageMap, setImageMap]     = useState<Partial<Record<HomepageSection, HomepageImage[]>>>({});
  const [loading, setLoading]       = useState(true);
  const { toasts, push }            = useToast();

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const images     = imageMap[activeTab] ?? [];

  // Fetch all sections in one shot
  useEffect(() => {
    homepageImagesApi.listAdmin()
      .then(({ data }) => {
        setImageMap((data.data ?? {}) as Partial<Record<HomepageSection, HomepageImage[]>>);
      })
      .catch(() => push('error', 'Failed to load homepage images'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewImage(img: HomepageImage) {
    setImageMap((prev) => ({
      ...prev,
      [img.section]: [...(prev[img.section] ?? []), img].sort((a, b) => a.sort_order - b.sort_order),
    }));
    push('success', 'Image uploaded successfully');
  }

  async function handleDelete(id: string) {
    try {
      await homepageImagesApi.remove(id);
      setImageMap((prev) => {
        const updated = { ...prev };
        for (const section of Object.keys(updated) as HomepageSection[]) {
          updated[section] = updated[section]?.filter((img) => img.id !== id);
        }
        return updated;
      });
      push('success', 'Image deleted');
    } catch {
      push('error', 'Failed to delete image');
    }
  }

  async function handleToggleActive(id: string, is_active: boolean) {
    try {
      const { data } = await homepageImagesApi.update(id, { is_active });
      const updated = data.data!;
      setImageMap((prev) => {
        const section = updated.section;
        return {
          ...prev,
          [section]: (prev[section] ?? []).map((img) => img.id === id ? updated : img),
        };
      });
      push('success', is_active ? 'Image shown on homepage' : 'Image hidden from homepage');
    } catch {
      push('error', 'Failed to update image');
    }
  }

  async function handleSave(id: string, updates: Partial<HomepageImage>) {
    try {
      const { data } = await homepageImagesApi.update(id, updates as Parameters<typeof homepageImagesApi.update>[1]);
      const updated = data.data!;
      setImageMap((prev) => {
        const section = updated.section;
        return {
          ...prev,
          [section]: (prev[section] ?? [])
            .map((img) => img.id === id ? updated : img)
            .sort((a, b) => a.sort_order - b.sort_order),
        };
      });
      push('success', 'Image updated');
    } catch {
      push('error', 'Failed to save changes');
    }
  }

  const nextSortOrder = images.length > 0
    ? Math.max(...images.map((i) => i.sort_order)) + 1
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f2', padding: '2rem' }}>

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.type === 'success' ? '#171614' : '#7f1d1d',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              animation: 'fadeInDown 0.3s ease',
            }}
          >
            {t.type === 'success'
              ? <CheckCircle size={15} color={GREEN} />
              : <XCircle    size={15} color="#f87171" />}
            {t.text}
          </div>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard size={22} color={GOLD} />
          <h1 className="text-2xl font-bold" style={{ color: DARK }}>Homepage Images</h1>
        </div>
        <p className="text-sm" style={{ color: 'rgba(23,22,20,0.55)' }}>
          Manage the images shown in the Hero carousel, Nails &amp; Wigs galleries, and the Book CTA collage.
          Images are stored in Cloudinary and served live to the website.
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(0,0,0,0.06)' }}>
        {TABS.map((tab) => {
          const count = imageMap[tab.id]?.length ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.03em',
                transition: 'all 0.2s',
                background: activeTab === tab.id
                  ? `#171614`
                  : 'transparent',
                color: activeTab === tab.id ? '#000' : 'rgba(0,0,0,0.5)',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(23,22,20,0.3)' : 'none',
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 6,
                  background: activeTab === tab.id ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.08)',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: 11,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab description ─────────────────────────────────────────────── */}
      <p className="text-sm mb-6 max-w-2xl" style={{ color: 'rgba(23,22,20,0.55)' }}>
        {currentTab.description}
      </p>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin" color={GOLD} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload form — left column */}
          <div className="lg:col-span-1">
            <UploadForm
              section={activeTab}
              hasMetadata={currentTab.hasMetadata}
              nextSortOrder={nextSortOrder}
              onSuccess={handleNewImage}
              onError={(msg) => push('error', msg)}
            />
          </div>

          {/* Image grid — right columns */}
          <div className="lg:col-span-3">
            {images.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center rounded-2xl"
                style={{
                  minHeight: 280,
                  border: '2px dashed rgba(0,0,0,0.1)',
                  background: 'rgba(23,22,20,0.02)',
                }}
              >
                <ImagePlus size={40} color="rgba(0,0,0,0.15)" />
                <p className="mt-3 text-sm font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>
                  No images yet for this section
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(0,0,0,0.25)' }}>
                  Static fallback images will be shown on the homepage until you upload here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((img) => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    hasMetadata={currentTab.hasMetadata}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onSave={handleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
