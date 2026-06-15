import { useEffect, useState } from 'react';
import { fetchTodayInfo, formatTodayDate } from '../utils/todayInfo';

export function useTodayInfo() {
  const [dateLabel] = useState(() => formatTodayDate());
  const [holiday, setHoliday] = useState(null);
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holidayError, setHolidayError] = useState(false);
  const [headlinesError, setHeadlinesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchTodayInfo().then((result) => {
      if (cancelled) {
        return;
      }

      setHoliday(result.holiday);
      setHeadlines(result.headlines);
      setHolidayError(result.holidayError);
      setHeadlinesError(result.headlinesError);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    dateLabel,
    holiday,
    headlines,
    loading,
    holidayError,
    headlinesError,
  };
}
