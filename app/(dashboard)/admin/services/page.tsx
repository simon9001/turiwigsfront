'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin.api';
import { ServiceFormModal } from '@/components/dashboard/ServiceFormModal';
import { formatPrice } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Service } from '@/types';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; service?: Service; nonce: number }>({ open: false, nonce: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listAdminServices()
      .then(({ data }) => setServices(data.data))
      .catch(() => toast.error('Could not load services'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => setModal((m) => ({ open: true, service: undefined, nonce: m.nonce + 1 }));
  const openEdit = (service: Service) => setModal((m) => ({ open: true, service, nonce: m.nonce + 1 }));
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSaved = (saved: Service) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      return idx >= 0
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...prev];
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminApi.deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success('Service deleted');
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
          <h1 className="text-2xl font-bold text-neutral-900">Services</h1>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {loading ? <PageSpinner /> : (
          !services.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-20 text-neutral-400 gap-3">
              <Scissors className="h-10 w-10" />
              <p className="text-sm">No services yet — add your first one</p>
              <Button variant="secondary" size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Service
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Service</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Duration</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {services.map((service) => (
                    <tr
                      key={service.id}
                      className={`hover:bg-neutral-50/60 transition-colors ${deleting === service.id ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                            {service.images[0]
                              ? <Image src={service.images[0].url} alt={service.name} fill className="object-cover" />
                              : <Scissors className="m-auto h-4 w-4 text-neutral-300" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-800 truncate">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-neutral-400 truncate max-w-xs">{service.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(service.price)}</td>
                      <td className="px-4 py-3 text-center text-neutral-500">
                        {service.duration_minutes} min
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-500">
                        {service.capacity}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={service.is_featured ? 'info' : 'default'}>
                          {service.is_featured ? 'Featured' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(service)}
                            className="rounded-lg p-1.5 text-neutral-300 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                            aria-label="Edit service"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id, service.name)}
                            className="rounded-lg p-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="Delete service"
                          >
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

      <ServiceFormModal
        key={modal.nonce}
        open={modal.open}
        onClose={closeModal}
        service={modal.service}
        onSaved={handleSaved}
      />
    </>
  );
}
