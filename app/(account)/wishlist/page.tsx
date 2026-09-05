'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { wishlistApi } from '@/api/wishlist.api';
import { ProductGrid } from '@/components/products/ProductGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistApi.get()
      .then(({ data }) => {
        const items = data.data as Array<{ products: Product }>;
        setProducts(items.map((i) => i.products).filter(Boolean));
      })
      .catch(() => toast.error('Could not load your saved items'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">
        Wishlist{' '}
        {products.length > 0 && (
          <span className="text-lg font-normal text-neutral-400">({products.length})</span>
        )}
      </h1>

      {!products.length ? (
        <EmptyState
          icon={Heart}
          title="No saved items"
          description="Tap the heart icon on any product to save it here."
          action={<Link href="/products"><Button>Explore Wigs</Button></Link>}
        />
      ) : (
        <ProductGrid
          products={products}
          wishlistedIds={products.map((p) => p.id)}
        />
      )}
    </div>
  );
}
