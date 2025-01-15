import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeAppearance } from 'antd-style';
import { ResolvingViewport } from 'next';
import { ReactNode, Suspense } from 'react';
import { isRtlLang } from 'rtl-detect';

import Analytics from '@/components/Analytics';
import BrandTextLoading from '@/components/Loading/BrandTextLoading';
import { DEFAULT_LANG } from '@/const/locale';
import PWAInstall from '@/features/PWAInstall';
import AuthProvider from '@/layout/AuthProvider';
import GlobalProvider from '@/layout/GlobalProvider';
import { RouteVariants } from '@/utils/server/routeVariants';

const inVercel = process.env.VERCEL === '1';

type RootLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ variants: string }>;
};

const RootLayout = async ({ children, modal, params }: RootLayoutProps) => {
  const { variants } = await params;

  const { locale, isMobile, theme } = RouteVariants.deserializeVariants(variants);

  const direction = isRtlLang(locale) ? 'rtl' : 'ltr';

  return (
    <html dir={direction} lang={locale} suppressHydrationWarning>
      <body>
        <GlobalProvider appearance={theme} isMobile={isMobile} locale={locale}>
          <AuthProvider>
            <Suspense fallback={<BrandTextLoading />}>
              {children}
              {!isMobile && modal}
            </Suspense>
          </AuthProvider>
          <PWAInstall />
        </GlobalProvider>
        <Analytics />
        {inVercel && <SpeedInsights />}
      </body>
    </html>
  );
};

export default RootLayout;

export { generateMetadata } from './metadata';

export const generateViewport = async (props: {
  params: Promise<{ variants: string }>;
}): ResolvingViewport => {
  const { variants } = await props.params;
  const { isMobile } = RouteVariants.deserializeVariants(variants);

  const dynamicScale = isMobile ? { maximumScale: 1, userScalable: false } : {};

  return {
    ...dynamicScale,
    initialScale: 1,
    minimumScale: 1,
    themeColor: [
      { color: '#f8f8f8', media: '(prefers-color-scheme: light)' },
      { color: '#000', media: '(prefers-color-scheme: dark)' },
    ],
    viewportFit: 'cover',
    width: 'device-width',
  };
};

export const generateStaticParams = () => {
  const themes: ThemeAppearance[] = ['dark', 'light'];
  const mobileOptions = [true, false];
  // only static for serveral page, other go to dynamtic
  const staticLocales = [DEFAULT_LANG, 'zh-CN'];

  const variants: { variants: string }[] = [];

  for (const locale of staticLocales) {
    for (const theme of themes) {
      for (const isMobile of mobileOptions) {
        variants.push({
          variants: RouteVariants.serializeVariants({ isMobile, locale, theme }),
        });
      }
    }
  }

  return variants;
};
