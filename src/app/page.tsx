import { useTranslations } from 'next-intl';
import { Building2, Coins, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/routing';

const FEATURES = [
  { icon: Building2, key: 'fractionalOwnership' },
  { icon: Coins, key: 'rentalYield' },
  { icon: ShieldCheck, key: 'verifiedAssets' },
] as const;

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <div className="space-y-16">
      <section className="space-y-6 pt-8 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('subtitle')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/properties">
            <Button>{t('browseProperties')}</Button>
          </Link>
          <a
            href="https://developers.stellar.org/docs/build/smart-contracts/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button variant="secondary">{t('howItWorks')}</Button>
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, key }) => (
          <Card key={key} className="space-y-3">
            <Icon className="text-primary h-6 w-6" aria-hidden />
            <h2 className="font-medium">{t(`features.${key}.title`)}</h2>
            <p className="text-muted-foreground text-sm">{t(`features.${key}.body`)}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
