import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { YieldCalculator } from '@/components/property/YieldCalculator';
import { getProperty } from '@/services/api';
import { formatBps, formatUsdCents, formatNumber } from '@/lib/format';
import { getTokenSupply } from '@/lib/soroban';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getProperty(id);
  if (!result.ok) {
    return { title: 'Property not found' };
  }
  const p = result.data;
  const title = `${p.name} — ${p.location.city}`;
  const description = `${p.name} in ${p.location.city} with an expected yield of ${formatBps(
    p.expectedYieldBps,
  )}.`;
  const url = `/properties/${id}`;
  const images = [`${url}/opengraph-image`];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getProperty(id);
  if (!result.ok) notFound();
  const p = result.data;

  const t = await getTranslations('properties.detail');

  const stats = [
    [t('valuation'), formatUsdCents(p.valuationUsdCents)],
    [t('sharePrice'), formatUsdCents(p.sharePriceUsdCents)],
    [t('totalShares'), formatNumber(p.totalShares)],
    [t('expectedYield'), formatBps(p.expectedYieldBps)],
  ];

  const supply = p.tokenContractId ? await getTokenSupply(p.tokenContractId).catch(() => null) : null;

  const images = p.imageUrl ? [p.imageUrl] : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{p.name}</h1>
        <p className="text-muted flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4" aria-hidden />
          {t('location', {
            address: p.location.address,
            city: p.location.city,
            country: p.location.country,
          })}
        </p>
      </div>
      {images.length > 0 ? (
        <PropertyGallery images={images} propertyName={p.name} />
      ) : (
        <div className="bg-muted/20 text-muted flex aspect-[16/9] w-full items-center justify-center rounded-lg border">
          <span className="text-sm">{t('noImage')}</span>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-muted text-xs uppercase">{label}</p>
            <p className="mt-1 text-lg font-medium">{value}</p>
          </Card>
        ))}
      </div>
      {p.tokenContractId && (
        <Card>
          <p className="text-muted text-xs uppercase">Funding progress</p>
          {supply && supply.ok ? (
            <FundingProgress totalSupply={supply.data.totalSupply} maxSupply={supply.data.maxSupply} />
          ) : (
            <p className="text-muted mt-1 text-sm">Funding progress is currently unavailable.</p>
          )}
        </Card>
      )}
      <YieldCalculator
        sharePriceUsdCents={p.sharePriceUsdCents}
        expectedYieldBps={p.expectedYieldBps}
        availableShares={p.totalShares}
      />
      {p.description && <p className="text-muted max-w-3xl">{p.description}</p>}
    </div>
  );
}

function FundingProgress({ totalSupply, maxSupply }: { totalSupply: bigint; maxSupply: bigint }) {
  const sold = totalSupply;
  const percent = maxSupply > 0n ? Number((sold * 10000n) / maxSupply) / 100 : 0;

  return (
    <div className="mt-2 space-y-2">
      <ProgressBar value={percent} />
      <div className="text-muted flex justify-between text-sm">
        <span>{sold.toLocaleString('en-US')} shares sold</span>
        <span>{percent.toFixed(2)}% funded</span>
      </div>
    </div>
  );
}