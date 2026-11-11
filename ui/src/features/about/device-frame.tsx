import { Laptop, Smartphone, Tablet, Tv } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/primitives/segmented';
import { cn } from '@/lib/utils';

import {
  DEVICE_FORMS,
  type DeviceForm,
  type PreviewScreen,
  previewPath,
  readySchema,
  showScreenMessage,
} from './screens';

type FormSpec = {
  width: number;
  fit: string;
  bezel: string;
  screen: string;
  viewport: string;
};

const FORMS: Record<DeviceForm, FormSpec> = {
  phone: {
    width: 390,
    fit: 'w-[min(100cqw,calc((100cqh_-_20px)_*_0.4621_+_20px))]',
    bezel: 'rounded-[44px] bg-bezel p-[10px]',
    screen: 'aspect-[390/844] rounded-[34px]',
    viewport: 'h-[844px] w-[390px]',
  },
  tablet: {
    width: 1024,
    fit: 'w-[min(100cqw,calc((100cqh_-_28px)_*_1.4222_+_28px))]',
    bezel: 'rounded-[30px] bg-bezel p-[14px]',
    screen: 'aspect-[1024/720] rounded-[16px]',
    viewport: 'h-[720px] w-[1024px]',
  },
  desktop: {
    width: 1280,
    fit: 'w-[min(100cqw,calc((100cqh_-_34px)_*_1.6_+_2px))]',
    bezel: 'overflow-hidden rounded-xl border border-hairline bg-ground-lift',
    screen: 'aspect-[1280/800]',
    viewport: 'h-[800px] w-[1280px]',
  },
  tv: {
    width: 1600,
    fit: 'w-[min(100cqw,calc((100cqh_-_44px)_*_1.7778_+_16px))]',
    bezel: 'rounded-md bg-bezel p-2',
    screen: 'aspect-[1600/900] rounded-[3px]',
    viewport: 'h-[900px] w-[1600px]',
  },
};

type DeviceFrameProps = {
  form: DeviceForm;
  screen: PreviewScreen;
  label: string;
  decorative?: boolean;
  className?: string;
};

export function DeviceFrame({
  form,
  screen,
  label,
  decorative = false,
  className,
}: DeviceFrameProps) {
  const { t } = useTranslation();
  const [initialScreen] = useState(screen);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const spec = FORMS[form];

  useEffect(() => {
    const target = frame?.contentWindow;
    if (!target) return undefined;
    const show = () => target.postMessage(showScreenMessage(screen), window.location.origin);
    show();
    const onMessage = (event: MessageEvent) => {
      if (event.source === target && readySchema.safeParse(event.data).success) show();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frame, screen]);

  useEffect(() => {
    if (!box) return undefined;
    const update = () =>
      box.style.setProperty('--device-scale', String(box.clientWidth / spec.width));
    update();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(box);
    return () => resize?.disconnect();
  }, [box, spec.width]);

  return (
    <div className={cn('grid size-full place-items-center [container-type:size]', className)}>
      <figure
        data-form={form}
        className={cn('m-0 transition-[width] duration-700 ease-out', spec.fit)}
      >
        <div
          className={cn(
            'shadow-[0_0_0_1px_var(--bezel-rim),0_40px_90px_-30px_var(--shadow),0_0_120px_-30px_color-mix(in_oklch,var(--brand)_35%,transparent)] transition-[border-radius,padding] duration-700 ease-out',
            spec.bezel
          )}
        >
          {form === 'desktop' ? (
            <div
              aria-hidden
              className="border-hairline flex h-8 items-center gap-1.5 border-b px-3"
            >
              <i className="bg-ink-3/50 size-2.5 rounded-full" />
              <i className="bg-ink-3/50 size-2.5 rounded-full" />
              <i className="bg-ink-3/50 size-2.5 rounded-full" />
              <span className="bg-fill-hover text-ink-3 mx-auto rounded-md px-3 font-mono text-[0.6875rem] leading-5">
                {t('about.footer.domain')}
              </span>
            </div>
          ) : null}
          <div
            ref={setBox}
            className={cn(
              'bg-ground relative w-full overflow-hidden [--device-scale:0.25]',
              spec.screen
            )}
          >
            {/* oxlint-disable-next-line react/iframe-missing-sandbox -- the preview is this app on this origin; it needs its scripts and the shared storage that carries theme, language and accent. */}
            <iframe
              ref={setFrame}
              src={previewPath(initialScreen)}
              title={label}
              loading="lazy"
              allow="fullscreen; clipboard-write"
              tabIndex={decorative ? -1 : undefined}
              aria-hidden={decorative || undefined}
              className={cn(
                'absolute top-0 left-0 origin-top-left scale-(--device-scale) border-0',
                spec.viewport,
                decorative && 'pointer-events-none'
              )}
            />
          </div>
        </div>
        {form === 'tv' ? (
          <span
            aria-hidden
            className="bg-bezel mx-auto block h-7 w-[28%] [clip-path:polygon(42%_0,58%_0,60%_70%,100%_76%,100%_100%,0_100%,0_76%,40%_70%)]"
          />
        ) : null}
      </figure>
    </div>
  );
}

const FORM_ICONS = { phone: Smartphone, tablet: Tablet, desktop: Laptop, tv: Tv } as const;

export function DeviceSwitcher({
  value,
  onChange,
}: {
  value: DeviceForm;
  onChange: (form: DeviceForm) => void;
}) {
  const { t } = useTranslation();
  return (
    <Segmented
      glass
      value={value}
      onChange={onChange}
      label={t('about.features.screenLabel')}
      optionClassName="px-3"
      options={DEVICE_FORMS.map((form) => {
        const Icon = FORM_ICONS[form];
        return {
          value: form,
          label: (
            <>
              <Icon />
              {t(`about.features.screens.${form}`)}
            </>
          ),
        };
      })}
    />
  );
}
