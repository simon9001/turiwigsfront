'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { formatPrice, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { adminApi } from '@/api/admin.api';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending', 'processing', 'shipped', 'delivered', 'cancelled',
];

const PAYMENT_STATUS_OPTIONS: Exclude<PaymentStatus, 'failed'>[] = ['pending', 'paid', 'refunded'];

const orderStatusVariant: Record<OrderStatus, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  paid: 'info',
  processing: 'info',
  packed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'default',
};

const paymentVariant: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'default',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrdersTableProps {
  orders: Order[];
  /** Path for the "View" link — e.g. '/admin/orders' or '/staff/orders'. */
  basePath: string;
  /** Whether the current user can edit payment status. Staff cannot. */
  canManagePayments: boolean;
  onOrderUpdated: (updated: Order) => void;
}

export function OrdersTable({ orders, basePath, canManagePayments, onOrderUpdated }: OrdersTableProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setBusy(id);
    try {
      const { data } = await adminApi.updateOrderStatus(id, status);
      onOrderUpdated(data.data);
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setBusy(null);
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: Exclude<PaymentStatus, 'failed'>) => {
    setBusy(id);
    try {
      const { data } = await adminApi.updatePaymentStatus(id, payment_status);
      onOrderUpdated(data.data);
      toast.success('Payment status updated');
    } catch {
      toast.error('Failed to update payment status');
    } finally {
      setBusy(null);
    }
  };

  if (!orders.length) {
    return <p className="py-12 text-center text-sm text-neutral-400">No orders found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/80">
            {['Order #', 'Date', 'Amount', 'Order Status', 'Payment', ''].map((h) => (
              <th key={h} className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400',
                h === 'Amount' ? 'text-right' : 'text-left')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {orders.map((order) => (
            <tr
              key={order.id}
              className={cn('transition-colors hover:bg-neutral-50/60', busy === order.id && 'opacity-50 pointer-events-none')}
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-700">
                {order.order_number}
              </td>
              <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                {formatDate(order.created_at)}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                {formatPrice(order.total_amount)}
              </td>

              {/* Order status — editable for both admin and staff */}
              <td className="px-4 py-3">
                <select
                  value={order.order_status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                  className="rounded-full border-0 bg-transparent py-0.5 text-xs font-medium cursor-pointer focus:ring-0 focus:outline-none"
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>

              {/* Payment status — read-only badge for staff; editable for admin */}
              <td className="px-4 py-3">
                {canManagePayments ? (
                  <select
                    value={order.payment_status}
                    onChange={(e) => updatePaymentStatus(order.id, e.target.value as Exclude<PaymentStatus, 'failed'>)}
                    className="rounded-full border-0 bg-transparent py-0.5 text-xs font-medium cursor-pointer focus:ring-0 focus:outline-none"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <Badge variant={paymentVariant[order.payment_status]}>
                    {order.payment_status}
                  </Badge>
                )}
              </td>

              <td className="px-4 py-3 text-right">
                <Link href={`${basePath}/${order.id}`}
                  className="text-xs font-medium text-ink hover:underline whitespace-nowrap">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { orderStatusVariant, paymentVariant };
