'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { productsApi, type ProductFilters } from '@/api/products.api';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const limit = 12;

  const filters: ProductFilters = {
    page,
    limit,
    search: searchParams.get('search') ?? undefined,
    categorySlug: searchParams.get('categorySlug') ?? undefined,
    featured: searchParams.get('featured') === 'true' ? true : undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) ?? undefined,
    order: (searchParams.get('order') as ProductFilters['order']) ?? undefined,
  };

  const fetchProducts = useCallback(() => {
    return productsApi.list(filters)
      .then(({ data }) => {
        setProducts(data.data);
        setTotal(data.meta.total);
      })
      .catch(() => toast.error('Could not load products'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            {searchParams.get('categorySlug')
              ? searchParams.get('categorySlug')!.replace(/-/g, ' ')
              : 'All Wigs'}
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-neutral-500">{total} products</p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 sm:w-72">
          <Input
            placeholder="Search wigs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md" className="px-3">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Sort */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'Newest', sort: 'created_at', order: 'desc' },
          { label: 'Price: Low', sort: 'price', order: 'asc' },
          { label: 'Price: High', sort: 'price', order: 'desc' },
          { label: 'Name A–Z', sort: 'name', order: 'asc' },
        ].map((opt) => {
          const active =
            (searchParams.get('sort') ?? 'created_at') === opt.sort &&
            (searchParams.get('order') ?? 'desc') === opt.order;
          return (
            <button
              key={opt.label}
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                p.set('sort', opt.sort);
                p.set('order', opt.order);
                router.push(`/products?${p.toString()}`);
              }}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <ProductGrid products={products} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
