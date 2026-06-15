import { useEffect, useMemo, useState } from 'react';

function formatTimezoneLabel(timeZone) {
  if (!timeZone) {
    return '';
  }

  const parts = timeZone.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
}

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      time: now.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
      timeWithSeconds: now.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      timeZone,
      timeZoneLabel: formatTimezoneLabel(timeZone),
    };
  }, [now]);
}
