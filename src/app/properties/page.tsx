'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/Button';
import { listProperties } from '@/services/api';
import { PROPERTY_TYPES } from '@/types/property';
import type { Paginated, Property } from '@/types/property';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

export default function PropertiesPage() {
  const t = useTranslations('Properties');
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get('city') ?? '';
  const type = searchParams.get('type') ?? '';
  const minYield = searchParams.get('minYield') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const [cityInput, setCityInput] = useState(city);
  const [minYieldInput, setMinYieldInput] = useState(minYield);

  const [result, setResult] = useState<
    { ok: true; data: Paginated<Property> } | { ok: false; message: string } | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCityInput(city);
  }, [city]);

  useEffect(() => {
    setMinYieldInput(minYield);
  }, [minYield]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listProperties({
      city: city || undefined,
      type: type || undefined,
      minYield: minYield || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            ok: false,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, type, minYield, page]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if (resetPage) {
        params.delete('page');
      }
      const query = params.toString();
      router.push(query ? `/properties?${query}` : '/properties');
    },
    [router, searchParams],
  );

  const handleCitySubmit = () => {
    updateParams({ city: cityInput.trim() || undefined });
  };

  const handleMinYieldSubmit = () => {
    updateParams({ minYield: minYieldInput.trim() || undefined });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({ type: e.target.value || undefined });
  };

  const handlePrevious = () => {
    if (page > 1) {
      updateParams({ page: String(page - 1) }, false);
    }
  };

  const handleNext = () => {
    updateParams({ page: String(page + 1) }, false);
  };

  const total = result?.ok ? result.data.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted text-sm">{t('subtitle')}</p>
      </div>

      <form
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        role="search"
        aria-label="Filter properties"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-city" className="text-sm font-medium">
            City
          </label>
          <div className="flex gap-2">
            <input
              id="filter-city"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Any city"
              className="border-border bg-surface text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
            <Button type="button" variant="secondary" onClick={handleCitySubmit}>
              Apply
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="filter-type"
            value={type}
            onChange={handleTypeChange}
            className="border-border bg-surface text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-min-yield" className="text-sm font-medium">
            Minimum yield (%)
          </label>
          <div className="flex gap-2">
            <input
              id="filter-min-yield"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={minYieldInput}
              onChange={(e) => setMinYieldInput(e.target.value)}
              placeholder="Any"
              className="border-border bg-surface text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
            <Button type="button" variant="secondary" onClick={handleMinYieldSubmit}>
              Apply
            </Button>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="text-muted text-sm" role="status" aria-live="polite">
          Loading properties…
        </p>
      ) : !result ? (
        <p className="text-muted text-sm" role="status">
          {t('empty')}
        </p>
      ) : !result.ok ? (
        <p className="text-danger text-sm" role="alert">
          {t('apiError', { message: result.message })}
        </p>
      ) : result.data.items.length === 0 ? (
        <p className="text-muted text-sm" role="status">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Pagination"
      >
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrevious}
          disabled={!hasPrevious || loading}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <p className="text-muted text-sm" aria-live="polite">
          Page {page} of {totalPages}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleNext}
          disabled={!hasNext || loading}
          aria-label="Next page"
        >
          Next
        </Button>
      </nav>
    </div>
  );
}