import type { AppProps } from 'next/app';
import { GoogleAnalyticsScript } from '../components/google-analytics';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <GoogleAnalyticsScript />
    </>
  );
}

export default MyApp;
