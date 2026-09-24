import { useEffect, useState } from 'react';
import { DOMParser } from 'xmldom';
import { IMachine } from '../engine/machine-interfaces';
import { MachineXMLLoader } from '../engine/machine-xml-loader.service';

export function useMachine(url: string) {
  const [machine, setMachine] = useState<IMachine | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const req = await fetch(url);
        const resp = await req.text();
        const xml = new DOMParser().parseFromString(resp, 'text/xml');
        const loader = new MachineXMLLoader();
        const loaded = loader.loadMachine(xml);
        if (!cancelled) {
          setMachine(loaded);
        }
      } catch (error) {
        console.error('Failed to load machine', error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return machine;
}
