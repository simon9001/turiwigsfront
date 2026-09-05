'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, PackageCheck, Truck, CheckCircle2, Package } from 'lucide-react';
import { ordersApi } from '@/api/orders.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { PayButton } from '@/components/payments/PayButton';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '@/types';

// ─── Delivery timeline ────────────────────────────────────────────────────────

const STAGES: { status: OrderStatus; label: string; desc: string; icon: React.ElementType }[] = [
  { status: 'processing', label: 'Processing',  desc: 'We\'re preparing your order',       icon: Clock        },
  { status: 'packed',     label: 'Packed',       desc: 'Your wig is packed & ready to ship', icon: PackageCheck },
  { status: 'shipped',    label: 'In Transit',   desc: 'Your order is on its way',           icon: Truck        },
  { status: 'delivered',  label: 'Delivered',    desc: 'Order delivered — enjoy!',            icon: CheckCircle2 },
];

const STAGE_ORDER = ['processing', 'packed', 'shipped', 'delivered'];

function stageIndex(status: OrderStatus) {
  return STAGE_ORDER.indexOf(status);
}

function DeliveryTimeline({ status }: { status: OrderStatus }) {
  const currentIdx = stageIndex(status);
  if (currentIdx === -1) return null;

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: '#dedcd7', background: '#fff' }}>
      <h2 className="text-sm font-semibold" style={{ color: '#171614' }}>Delivery Progress</h2>

      <div className="space-y-0">
        {STAGES.map((stage, i) => {
          const done = currentIdx > i;
          const current = currentIdx === i;
          const pending = currentIdx < i;
          return (
            <div key={stage.status} className="flex gap-3">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={
                    done
                      ? { background: '#171614' }
                      : current
                      ? { background: '#171614', boxShadow: '0 0 0 3px rgba(23,22,20,0.2)' }
                      : { background: '#e9e8e4', border: '1px solid #dedcd7' }
                  }
                >
                  <stage.icon
                    className="h-3.5 w-3.5"
                    style={{ color: done ? '#ffffff' : current ? '#171614' : '#c9c6bf' }}
                  />
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className="w-0.5 flex-1 my-1"
                    style={{ background: done ? '#171614' : '#dedcd7', minHeight: 20 }}
                  />
                )}
              </div>

              {/* Text column */}
              <div className="pb-4 pt-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-none"
                  style={{ color: done || current ? '#171614' : '#8b8881' }}
                >
                  {stage.label}
                  {current && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                      style={{ background: 'rgba(23,22,20,0.15)', color: '#8b8881' }}>
                      Current
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: pending ? '#c9c6bf' : '#6e6b65' }}>
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning', paid: 'info', processing: 'info', packed: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger', refunded: 'danger',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersApi.get(id).then(({ data }) => setOrder(data.data)).catch(() => toast.error('Could not load this order'))
                                                             .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(id, 'Cancelled by customer');
      toast.success('Order cancelled');
      router.push('/account/orders');
    } catch { toast.error('Could not cancel order'); }
    finally { setCancelling(false); }
  };

  if (loading) return <PageSpinner />;
  if (!order) return <div className="p-10 text-center text-neutral-500">Order not found</div>;

  const showTimeline = ['processing', 'packed', 'shipped', 'delivered'].includes(order.order_status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6" style={{ minHeight: '100vh', background: '#f4f4f2' }}>
      <Link href="/account/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#8b8881' }}>
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between rounded-2xl border p-5"
          style={{ borderColor: '#dedcd7', background: '#fff' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4" style={{ color: '#8b8881' }} />
              <h1 className="text-lg font-bold" style={{ color: '#171614' }}>{order.order_number}</h1>
            </div>
            <p className="text-xs" style={{ color: '#8b8881' }}>{formatDate(order.created_at)}</p>
          </div>
          <Badge variant={statusVariant[order.order_status] ?? 'default'}>
            {order.order_status === 'shipped' ? 'In Transit' : order.order_status}
          </Badge>
        </div>

        {/* Delivery timeline */}
        {showTimeline && <DeliveryTimeline status={order.order_status} />}

        {/* Items */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: '#dedcd7', background: '#fff' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#171614' }}>Items</h2>
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium" style={{ color: '#171614' }}>{item.product_snapshot.name}</p>
                {item.product_snapshot.sku && (
                  <p className="text-xs font-mono" style={{ color: '#8b8881' }}>SKU: {item.product_snapshot.sku}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold" style={{ color: '#171614' }}>{formatPrice(item.total_price)}</p>
                <p className="text-xs" style={{ color: '#8b8881' }}>×{item.quantity} @ {formatPrice(item.unit_price)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-2xl border p-5 space-y-2 text-sm" style={{ borderColor: '#dedcd7', background: '#fff' }}>
          <div className="flex justify-between" style={{ color: '#6e6b65' }}>
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between" style={{ color: '#6e6b65' }}>
            <span>Shipping</span><span>{formatPrice(order.shipping_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ color: '#171614', borderColor: '#e9e8e4' }}>
            <span>Total</span><span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {/* Pay now if pending */}
        {order.payment_status === 'pending' && order.order_status !== 'cancelled' && (
          <PayButton
            orderId={order.id}
            amount={order.total_amount}
            amountFormatted={formatPrice(order.total_amount)}
            label="Complete Payment"
            onSuccess={() => { toast.success('Payment received!'); router.push('/payment/success'); }}
          />
        )}

        {/* Cancel */}
        {['pending'].includes(order.order_status) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full text-sm text-center py-2 transition-colors disabled:opacity-50"
            style={{ color: '#ef4444' }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}
