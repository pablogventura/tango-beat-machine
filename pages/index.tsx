import { GetStaticProps } from 'next';
import Head from 'next/head';
import { BeatMachineUI } from '../components/beat-machine-ui';
import { IMachine } from '../engine/machine-interfaces';
import { loadMachine } from '../services/load-machine';
import { assetUrl } from '../utils/base-path';
import styles from './index.module.css';

interface IHomeProps {
  machine: IMachine;
}

const SITE_URL = 'https://pablogventura.github.io/tango-beat-machine/';
const DESCRIPTION =
  'Interactive tango rhythm machine with bandoneon, piano, bass, and violin. Practice timing with classic arrangements.';

export default function Home({ machine }: IHomeProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <title>Tango Beat Machine</title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href={assetUrl('favicon.ico')} />
        <link href="https://fonts.googleapis.com/css?family=Merriweather:300" rel="stylesheet" />
        <link rel="manifest" href={assetUrl('manifest.json')} />
        <meta name="theme-color" content="#1976d2" />
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content="Tango Beat Machine" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}assets/images/background.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className={styles.homepage}>
        <h1>Tango Beat Machine</h1>

        <div className={styles.appContainer}>
          <BeatMachineUI machine={machine} />
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<IHomeProps> = async () => {
  const machine = await loadMachine('tango.xml');
  return {
    props: {
      machine,
    },
  };
};
