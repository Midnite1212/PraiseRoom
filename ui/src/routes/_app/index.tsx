import { createFileRoute, Link } from '@tanstack/react-router';
import { Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {t('home.greeting', { name: session.fullName })}
        </CardTitle>
        <CardDescription>{t('home.intro')}</CardDescription>
        <div className="pt-2">
          <Button asChild>
            <Link to="/songs">
              <Music />
              {t('home.browseSongs')}
            </Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
