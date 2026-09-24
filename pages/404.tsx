import Head from 'next/head';
import { assetUrl, getBasePath } from '../utils/base-path';
import styles from './404.module.css';

export default function Error404() {
  const homeHref = `${getBasePath() || ''}/` || '/';
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <title>Not Found - Tango Beat Machine</title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href={assetUrl('favicon.ico')} />
        <link href="https://fonts.googleapis.com/css?family=Merriweather:300" rel="stylesheet" />
        <meta name="theme-color" content="#1976d2" />
        <meta name="description" content="Page not found - Tango Beat Machine" />
      </Head>

      <div className={styles.page}>
        <h1>Page Not Found (404)</h1>

        <a href={homeHref}>Take me home</a>
      </div>
    </>
  );
}
