import { useEffect, useMemo, useState } from 'react';
import { faviconSourcesForDomain, iconUsesSoftEdges } from '../utils/favicon';

export default function ShortcutIcon({ domain }) {
  const sources = useMemo(() => faviconSourcesForDomain(domain), [domain]);
  const softEdges = useMemo(() => iconUsesSoftEdges(domain), [domain]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [domain, sources]);

  return (
    <img
      className={`app-item-icon${softEdges ? ' app-item-icon--soft' : ''}`}
      src={sources[sourceIndex]}
      alt=""
      draggable={false}
      onError={() => {
        setSourceIndex((current) => (
          current < sources.length - 1 ? current + 1 : current
        ));
      }}
    />
  );
}
