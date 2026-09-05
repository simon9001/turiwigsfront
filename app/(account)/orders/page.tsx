'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { ordersApi } from '@/api/orders.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning', paid: 'info', processing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger', refunded: 'danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then(({ data }) => setOrders(data.data)).catch(() => toast.error('Could not load your orders'))
                                                             .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">My Orders</h1>

      {!orders.length ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your order history will appear here."
          action={<Link href="/products"><Button>Start Shopping</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-200 p-5 hover:border-neutral-400 hover:bg-neutral-50 transition-all"
            >
              <div className="space-y-1">
                <p className="font-semibold text-neutral-900">{order.order_number}</p>
                <p className="text-xs text-neutral-400">{formatDate(order.created_at)}</p>
                <Badge variant={statusVariant[order.order_status] ?? 'default'}>
                  {order.order_status}
                </Badge>
              </div>
              <p className="text-base font-bold text-neutral-900">{formatPrice(order.total_amount)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
