'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, FileText, Globe, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogApi } from '@/api/blog.api';
import { BlogFormModal } from '@/components/dashboard/BlogFormModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';
import type { BlogPost } from '@/types';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; post?: BlogPost; nonce: number }>({ open: false, nonce: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    blogApi.adminList()
      .then(({ data }) => setPosts(data.data))
      .catch(() => toast.error('Could not load posts'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => setModal((m) => ({ open: true, post: undefined, nonce: m.nonce + 1 }));
  const openEdit = (post: BlogPost) => setModal((m) => ({ open: true, post, nonce: m.nonce + 1 }));
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSaved = (saved: BlogPost) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      return idx >= 0 ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await blogApi.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Post deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Blog</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" /> New Post
          </Button>
        </div>

        {loading ? <PageSpinner /> : (
          !posts.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-20 text-neutral-400 gap-3">
              <FileText className="h-10 w-10" />
              <p className="text-sm">No blog posts yet — write your first one</p>
              <Button variant="secondary" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Post</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className={`hover:bg-neutral-50/60 transition-colors ${deleting === post.id ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                            {post.cover_image
                              ? <Image src={post.cover_image} alt={post.title} fill className="object-cover" />
                              : <FileText className="m-auto h-5 w-5 text-neutral-300" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 truncate">{post.title}</p>
                            {post.excerpt && (
                              <p className="text-xs text-neutral-400 truncate max-w-sm">{post.excerpt}</p>
                            )}
                            <p className="text-[10px] font-mono text-neutral-300 mt-0.5">/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {post.is_published ? (
                          <Badge variant="success">
                            <Globe className="h-3 w-3 mr-1" /> Published
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <EyeOff className="h-3 w-3 mr-1" /> Draft
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-xs">
                        {formatDate(post.published_at ?? post.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(post)}
                            className="rounded-lg p-1.5 text-neutral-300 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                            aria-label="Edit post">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(post.id, post.title)}
                            className="rounded-lg p-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="Delete post">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <BlogFormModal
        key={modal.nonce}
        open={modal.open}
        onClose={closeModal}
        post={modal.post}
        onSaved={handleSaved}
      />
    </>
  );
}
