'use client';

import { useState, useRef } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { blogApi } from '@/api/blog.api';
import { uploadApi } from '@/api/upload.api';
import { slugify } from '@/utils/formatters';
import type { BlogPost } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  post?: BlogPost;
  onSaved: (post: BlogPost) => void;
}

const EMPTY = { title: '', slug: '', excerpt: '', content: '', coverImage: '', isPublished: true };

const fieldStyle = {
  background: '#f4f4f2',
  border: '1px solid #dedcd7',
  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.07)',
};

// Keyed by post id in the parent, so a fresh instance mounts per post and
// the starting values are plain initial state, not a props-sync effect.
export function BlogFormModal({ open, onClose, post, onSaved }: Props) {
  const [form, setForm] = useState(() => (post ? {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    content: post.content,
    coverImage: post.cover_image ?? '',
    isPublished: post.is_published,
  } : EMPTY));
  const [slugLocked, setSlugLocked] = useState(!!post);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!post;

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    set('title', title);
    if (!slugLocked) set('slug', slugify(title));
  };

  const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.image(file, 'promotions');
      set('coverImage', data.data.url);
    } catch {
      toast.error('Cover image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error('Title, slug and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        isPublished: form.isPublished,
      };
      const { data } = isEditing && post
        ? await blogApi.update(post.id, payload)
        : await blogApi.create(payload);
      toast.success(isEditing ? 'Post updated' : 'Post created');
      onSaved(data.data);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (isEditing ? 'Update failed' : 'Create failed');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Post' : 'New Blog Post'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Cover image */}
        <div>
          <p className="mb-2 text-sm font-medium" style={{ color: '#55534e' }}>Cover Image</p>
          <div className="flex items-center gap-3">
            {form.coverImage ? (
              <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border"
                style={{ borderColor: '#dedcd7' }}>
                <Image src={form.coverImage} alt="Cover" fill className="object-cover" />
                <button type="button" onClick={() => set('coverImage', '')}
                  className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white hover:bg-black/80"
                  aria-label="Remove cover">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                className="flex h-20 w-32 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors hover:border-line-2 hover:bg-mist disabled:opacity-50"
                style={{ borderColor: '#dedcd7' }}>
                {uploading
                  ? <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  : <ImagePlus className="h-5 w-5 text-neutral-400" />}
                <span className="text-[10px] text-neutral-400">{uploading ? 'Uploading…' : 'Add Cover'}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
          </div>
        </div>

        {/* Title */}
        <Input label="Title *" value={form.title} onChange={handleTitleChange}
          placeholder="e.g. How to care for your wig" required />

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#55534e' }}>
            Slug *{' '}
            {!slugLocked && <span className="font-normal text-neutral-400">(auto-generated)</span>}
          </label>
          <div className="relative">
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugLocked(true);
                set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
              }}
              placeholder="e.g. how-to-care-for-your-wig"
              required
              className="h-11 w-full rounded-xl px-4 pr-16 text-sm text-neutral-900 outline-none font-mono"
              style={fieldStyle}
            />
            {slugLocked && !isEditing && (
              <button type="button"
                onClick={() => { setSlugLocked(false); set('slug', slugify(form.title)); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans hover:underline"
                style={{ color: '#8b8881' }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#55534e' }}>
            Excerpt <span className="font-normal text-neutral-400">(shown in listing)</span>
          </label>
          <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)}
            rows={2} placeholder="Short summary of the post…"
            className="w-full resize-none rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none"
            style={fieldStyle} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#55534e' }}>Content *</label>
          <textarea value={form.content} onChange={(e) => set('content', e.target.value)}
            rows={10} placeholder="Write your post here… (Markdown supported)"
            required
            className="w-full resize-y rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none font-mono leading-relaxed"
            style={fieldStyle} />
        </div>

        {/* Publish toggle */}
        <label className="flex cursor-pointer select-none items-center gap-2.5">
          <input type="checkbox" checked={form.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300" style={{ accentColor: '#22c55e' }} />
          <span className="text-sm font-medium text-neutral-700">
            Published
            <span className="ml-1.5 text-xs font-normal text-neutral-400">(uncheck to save as draft)</span>
          </span>
        </label>

        <div className="flex gap-3 border-t border-neutral-100 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" fullWidth loading={saving}>
            {isEditing ? 'Save Changes' : 'Create Post'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
