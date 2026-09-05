'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/api/admin.api';
import { uploadApi } from '@/api/upload.api';
import { categoriesApi } from '@/api/categories.api';
import { slugify } from '@/utils/formatters';
import type { Product, Category } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSaved: (product: Product) => void;
}

const EMPTY = {
  name: '', slug: '', description: '', price: '', compare_at_price: '',
  stock: '', category_id: '', is_active: true, is_featured: false,
};

const fieldStyle = {
  background: '#f4f4f2',
  border: '1px solid #dedcd7',
  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.07)',
};

// The parent keys this component by product id, so it remounts whenever a
// different product (or "new") is opened. That makes the form's starting
// values plain initial state instead of an effect that syncs from props.
export function ProductFormModal({ open, onClose, product, onSaved }: Props) {
  const [form, setForm] = useState(() => (product ? {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: String(product.price),
    compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
    stock: String(product.stock),
    category_id: '',
    is_active: true,
    is_featured: product.is_featured,
  } : EMPTY));
  const [imageUrls, setImageUrls] = useState<string[]>(
    () => product?.images.map((img) => img.url) ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  // Editing keeps the existing slug; a new product derives it from the name.
  const [slugLocked, setSlugLocked] = useState(!!product);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!product;

  useEffect(() => {
    if (open && categories.length === 0) {
      categoriesApi.list()
        .then(({ data }) => setCategories(data.data))
        .catch(() => {});
    }
  }, [open, categories.length]);

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    set('name', name);
    // Keep slug in sync with name unless the user has edited it manually
    if (!slugLocked) {
      set('slug', slugify(name));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugLocked(true);
    // Only allow valid slug characters while typing
    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
  };

  const removeImage = (index: number) =>
    setImageUrls((prev) => prev.filter((_, i) => i !== index));

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        files.map((f) => uploadApi.image(f, 'products').then((r) => r.data.data.url))
      );
      const uploaded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value);
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (uploaded.length) setImageUrls((prev) => [...prev, ...uploaded]);
      if (failed) toast.error(`${failed} image${failed > 1 ? 's' : ''} failed to upload`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim() || !form.price || !form.stock) {
      toast.error('Name, slug, price, and stock are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        compareAtPrice: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        stock: Number(form.stock),
        categoryIds: form.category_id ? [form.category_id] : [],
        isFeatured: form.is_featured,
        images: imageUrls.length
          ? imageUrls.map((url) => ({ url }))
          : undefined,
      };

      const { data } = isEditing && product
        ? await adminApi.updateProduct(product.id, payload)
        : await adminApi.createProduct(payload);

      toast.success(isEditing ? 'Product updated' : 'Product created');
      onSaved(data.data);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ??
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ??
        (isEditing ? 'Update failed' : 'Create failed');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Product' : 'New Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Multi-image upload ── */}
        <div>
          <p className="mb-2 text-sm font-medium" style={{ color: '#55534e' }}>
            Images{' '}
            <span className="font-normal text-neutral-400">(first image = cover)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={url + i}
                className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                <Image src={url} alt={`Image ${i + 1}`} fill sizes="64px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
                    Cover
                  </span>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/55 p-0.5 text-white transition-colors hover:bg-black/80"
                  aria-label="Remove image">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition-colors hover:border-line-2 hover:bg-mist disabled:opacity-50">
              {uploading
                ? <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                : <Plus className="h-4 w-4 text-neutral-400" />}
              <span className="text-[10px] text-neutral-400">{uploading ? 'Uploading' : 'Add'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">PNG or JPG up to 5 MB each. Select multiple to batch upload.</p>
        </div>

        {/* Name — drives slug auto-generation */}
        <Input
          label="Product Name *"
          value={form.name}
          onChange={handleNameChange}
          placeholder="e.g. Brazilian Lace Front Wig"
          required
        />

        {/* Slug — auto-populated, user can override */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#55534e' }}>
            Slug *{' '}
            {!slugLocked && <span className="font-normal text-neutral-400">(auto-generated from name)</span>}
          </label>
          <div className="relative">
            <input
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="e.g. brazilian-lace-front-wig"
              required
              className="h-11 w-full rounded-xl px-4 pr-16 text-sm text-neutral-900 outline-none transition-all font-mono"
              style={fieldStyle}
            />
            {slugLocked && !isEditing && (
              <button type="button" onClick={() => { setSlugLocked(false); set('slug', slugify(form.name)); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink hover:underline font-sans">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#55534e' }}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={3} placeholder="Describe the product…"
            className="w-full resize-none rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-all"
            style={fieldStyle} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (KES) *" type="number" min="0" step="0.01"
            value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" required />
          <Input label="Compare-at Price" type="number" min="0" step="0.01"
            value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)}
            placeholder="0.00" hint="Leave blank if no sale" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Stock *" type="number" min="0"
            value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#55534e' }}>Category</label>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}
              className="h-11 rounded-xl px-4 text-sm text-neutral-900 outline-none transition-all"
              style={fieldStyle}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer select-none items-center gap-2.5">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300" style={{ accentColor: '#22c55e' }} />
            <span className="text-sm font-medium text-neutral-700">
              Visible to customers
              <span className="ml-1.5 text-xs font-normal text-neutral-400">
                (uncheck to save as draft)
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2.5">
            <input type="checkbox" checked={form.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300" style={{ accentColor: '#8b8881' }} />
            <span className="text-sm font-medium text-neutral-700">Mark as Featured</span>
          </label>
        </div>

        <div className="flex gap-3 border-t border-neutral-100 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" fullWidth loading={saving}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
