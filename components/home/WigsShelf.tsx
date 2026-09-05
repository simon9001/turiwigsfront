'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products.api';
import { addToCartThunk } from '@/store/slices/cart.slice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { formatPrice, getDiscountPercent } from '@/utils/formatters';
import { useGallery } from '@/hooks/useGallery';
import type { Product } from '@/types';

/* Buying happens here without leaving the homepage. Stock and discount are
   the only two places colour appears, and both of them mean something. */

function Skeleton() {
  return <div className="card h-[26rem] animate-pulse bg-mist" />;
}

export function WigsShelf() {
  const dispatch = useAppDispatch();
  const { wigs: shots } = useGallery();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    productsApi
      .list({ featured: true, limit: 8 })
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function addToCart(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(product.id);
    try {
      await dispatch(addToCartThunk({ productId: product.id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to your cart`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'That did not go through. Try again.');
    } finally {
      setAdding(null);
    }
  }

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-paper px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">Wigs on the shelf</h2>
            <p className="measure mt-2 text-sm text-slate">
              Human hair, ready to go. Collect from the shop or have it delivered
              anywhere in Kenya.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            All wigs
          </Link>
        </header>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
            : products.map((product, i) => {
                const img =
                  product.images?.[0]?.url ?? shots[i % Math.max(shots.length, 1)]?.src;
                const onSale =
                  !!product.compare_at_price && product.compare_at_price > product.price;
                const low = product.stock > 0 && product.stock <= 3;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="card card-hover group flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] bg-mist">
                      {img && (
                        <Image
                          src={img}
                          alt={product.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          loading={i < 2 ? 'eager' : 'lazy'}
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}

                      {onSale && (
                        <span
                          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                          style={{ background: 'var(--alert)' }}
                        >
                          {getDiscountPercent(product.price, product.compare_at_price!)}% off
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-base font-semibold tabular-nums text-ink">
                          {formatPrice(product.price)}
                        </p>
                        {onSale && (
                          <p className="text-[13px] tabular-nums text-mute line-through">
                            {formatPrice(product.compare_at_price!)}
                          </p>
                        )}
                      </div>

                      <p className="mt-1.5 flex-1 text-[13px]">
                        {product.stock <= 0 ? (
                          <span className="text-mute">Out of stock</span>
                        ) : low ? (
                          <span style={{ color: 'var(--alert)' }}>
                            Only {product.stock} left
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ok)' }}>In stock</span>
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => addToCart(e, product)}
                        disabled={adding === product.id || product.stock <= 0}
                        className="btn btn-primary btn-sm mt-4 w-full"
                      >
                        {product.stock <= 0
                          ? 'Sold out'
                          : adding === product.id
                            ? 'Adding'
                            : 'Add to cart'}
                      </button>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
