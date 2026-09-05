'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { blogApi } from '@/api/blog.api';
import { formatDate } from '@/utils/formatters';
import type { BlogPost } from '@/types';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border overflow-hidden" style={{ borderColor: '#dedcd7', background: '#fff' }}>
      <div className="w-full aspect-[16/9]" style={{ background: '#dedcd7' }} />
      <div className="p-5">
        <div className="h-5 w-3/4 rounded-lg mb-3" style={{ background: '#dedcd7' }} />
        <div className="h-3 w-full rounded mb-2" style={{ background: '#e9e8e4' }} />
        <div className="h-3 w-4/5 rounded mb-4" style={{ background: '#e9e8e4' }} />
        <div className="h-3 w-24 rounded" style={{ background: '#e9e8e4' }} />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogApi.list()
      .then(({ data }) => setPosts(data.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#f4f4f2', minHeight: '100vh' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">

        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-3" style={{ color: '#8b8881' }}>
            Tips & Inspiration
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: '#171614' }}>
            The Tiuri Blog
          </h1>
          <p className="mt-3 text-sm max-w-lg leading-relaxed" style={{ color: '#6e6b65' }}>
            Wig care tips, styling ideas, and news from Tiuri Nails & Wigs.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !posts.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center"
            style={{ borderColor: '#dedcd7' }}>
            <p className="text-lg font-semibold mb-2" style={{ color: '#171614' }}>Coming soon</p>
            <p className="text-sm" style={{ color: '#8b8881' }}>
              We&apos;re working on some great content. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
                style={{ borderColor: '#dedcd7', background: '#fff' }}
              >
                {/* Cover */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center"
                      style={{ background: '#171614' }}>
                      <span className="text-5xl font-black opacity-10 text-white">T</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  <h2 className="text-base font-semibold leading-snug" style={{ color: '#171614' }}>
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed flex-1 line-clamp-2" style={{ color: '#6e6b65' }}>
                      {post.excerpt}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: '#e9e8e4' }}>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#8b8881' }}>
                      {post.author?.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {post.author.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.published_at ?? post.created_at)}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
