'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCcw, PackageCheck, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { adminApi } from '@/api/admin.api';
import { formatPrice, formatDateTime } from '@/utils/formatters';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

// ─── Status helpers ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_OPTIONS: Exclude<PaymentStatus, 'failed'>[] = ['pending', 'paid', 'refunded'];

const orderVariant: Record<OrderStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning', paid: 'info', processing: 'info', packed: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger', refunded: 'default',
};

// Delivery stages shown as a visual stepper
const DELIVERY_STAGES: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'processing', label: 'Processing',  icon: Clock        },
  { status: 'packed',     label: 'Packed',       icon: PackageCheck },
  { status: 'shipped',    label: 'In Transit',   icon: Truck        },
  { status: 'delivered',  label: 'Delivered',    icon: CheckCircle2 },
];

const DELIVERY_ORDER = ['processing', 'packed', 'shipped', 'delivered'];
function deliveryIndex(status: OrderStatus) {
  return DELIVERY_ORDER.indexOf(status);
}
const paymentVariant: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning', paid: 'success', failed: 'danger', refunded: 'default',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface OrderDetailViewProps {
  orderId: string;
  /** Path for the back link — '/admin/orders' or '/staff/orders'. */
  backHref: string;
  /** When false, payment actions are hidden and payment status is a read-only badge. */
  canManagePayments: boolean;
}

export function OrderDetailView({ orderId, backHref, canManagePayments }: OrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.getOrder(orderId)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleOrderStatus = async (status: OrderStatus) => {
    if (!order) return;
    setBusy(true);
    try {
      const { data } = await adminApi.updateOrderStatus(order.id, status);
      setOrder(data.data);
      toast.success('Order status updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentStatus = async (payment_status: Exclude<PaymentStatus, 'failed'>) => {
    if (!order) return;
    setBusy(true);
    try {
      const { data } = await adminApi.updatePaymentStatus(order.id, payment_status);
      setOrder(data.data);
      toast.success('Payment status updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    if (!window.confirm(`Refund order ${order.order_number}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { data } = await adminApi.refundOrder(order.id);
      setOrder(data.data);
      toast.success('Refund initiated');
    } catch {
      toast.error('Refund failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!order) return (
    <div className="text-center py-16">
      <p className="text-neutral-400">Order not found.</p>
      <Link href={backHref} className="mt-4 inline-block text-sm text-ink hover:underline">← Back</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href={backHref}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">{order.order_number}</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={orderVariant[order.order_status]}>{order.order_status}</Badge>
          <Badge variant={paymentVariant[order.payment_status]}>{order.payment_status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Items</h2>
            </div>
            {order.order_items?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/60 border-b border-neutral-100">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400">Product</th>
                    <th className="px-5 py-2.5 text-center text-xs font-medium text-neutral-400">Qty</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-neutral-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-neutral-800">{item.product_snapshot.name}</p>
                        {item.product_snapshot.sku && (
                          <p className="text-xs text-neutral-400 font-mono">{item.product_snapshot.sku}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center text-neutral-500">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-semibold">{formatPrice(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-6 text-sm text-neutral-400">No items.</p>
            )}

            {/* Totals */}
            <div className="px-5 py-4 bg-neutral-50/60 border-t border-neutral-100 space-y-1.5">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>−{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Shipping</span><span>{formatPrice(order.shipping_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total</span><span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </section>

          {/* Shipping address */}
          {order.addresses && (
            <section className="rounded-2xl border border-neutral-100 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-3">Shipping Address</h2>
              <address className="not-italic text-sm text-neutral-600 leading-relaxed">
                {order.addresses.street}<br />
                {order.addresses.city}
                {order.addresses.county && `, ${order.addresses.county}`}<br />
                {order.addresses.country}
              </address>
            </section>
          )}

          {order.notes && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 mb-1">Notes</h2>
              <p className="text-sm text-neutral-600">{order.notes}</p>
            </section>
          )}
        </div>

        {/* Right: actions panel */}
        <div className="space-y-4">
          {/* Delivery stage stepper */}
          <section className="rounded-2xl border border-neutral-100 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-800">Delivery Status</h2>
              <Badge variant={orderVariant[order.order_status]}>{order.order_status}</Badge>
            </div>

            {/* Visual stepper */}
            {!['cancelled', 'refunded', 'pending', 'paid'].includes(order.order_status) && (
              <div className="relative flex items-center justify-between">
                {/* connector line */}
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-neutral-100 z-0" />
                <div
                  className="absolute left-0 top-4 h-0.5 z-0 transition-all duration-500"
                  style={{
                    background: '#171614',
                    width: `${(deliveryIndex(order.order_status) / (DELIVERY_STAGES.length - 1)) * 100}%`,
                  }}
                />
                {DELIVERY_STAGES.map((stage, i) => {
                  const done = deliveryIndex(order.order_status) > i;
                  const current = order.order_status === stage.status;
                  return (
                    <div key={stage.status} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center transition-all"
                        style={
                          done || current
                            ? { background: '#171614', boxShadow: current ? '0 0 0 3px rgba(23,22,20,0.25)' : 'none' }
                            : { background: '#e9e8e4', border: '1px solid #dedcd7' }
                        }
                      >
                        <stage.icon className="h-3.5 w-3.5" style={{ color: done || current ? '#171614' : '#8b8881' }} />
                      </div>
                      <span className="text-[9px] font-semibold text-center leading-tight"
                        style={{ color: done || current ? '#171614' : '#8b8881' }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* One-click stage advance buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {DELIVERY_STAGES.filter((s) => s.status !== order.order_status).map((stage) => {
                const isNext = deliveryIndex(stage.status) === deliveryIndex(order.order_status) + 1;
                return (
                  <button
                    key={stage.status}
                    onClick={() => handleOrderStatus(stage.status)}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-50"
                    style={isNext
                      ? { background: '#171614', color: '#ffffff' }
                      : { background: '#f4f4f2', border: '1px solid #dedcd7', color: '#6e6b65' }
                    }
                  >
                    <stage.icon className="h-3 w-3" />
                    {stage.label}
                  </button>
                );
              })}
            </div>

            {/* Cancel option */}
            {!['cancelled', 'delivered', 'refunded'].includes(order.order_status) && (
              <button
                onClick={() => handleOrderStatus('cancelled')}
                disabled={busy}
                className="w-full text-xs text-red-400 hover:text-red-600 transition-colors py-1 disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </section>

          {/* Payment section */}
          <section className="rounded-2xl border bg-white shadow-sm p-5 space-y-3"
            style={{ borderColor: canManagePayments ? 'rgba(23,22,20,0.25)' : undefined }}>
            <h2 className="text-sm font-semibold text-neutral-800">Payment</h2>

            {canManagePayments ? (
              <>
                <select
                  value={order.payment_status}
                  onChange={(e) => handlePaymentStatus(e.target.value as Exclude<PaymentStatus, 'failed'>)}
                  disabled={busy}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/25 bg-white"
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {order.payment_status === 'paid' && (
                  <Button
                    variant="danger"
                    fullWidth
                    size="sm"
                    loading={busy}
                    onClick={handleRefund}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Refund Order
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Badge variant={paymentVariant[order.payment_status]}>
                  {order.payment_status}
                </Badge>
                <p className="text-xs text-neutral-400">Contact an admin to change payment status.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
