import React, { useEffect, useState } from 'react';
import { sdk } from '../../sdk';

export const TimeAgo: React.FC<{ date: any, lang: any, className?: string }> = ({ date, lang, className }) => {
  const [formatted, setFormatted] = useState(sdk.data.formatDate(date, lang));

  useEffect(() => {
    setFormatted(sdk.data.formatDate(date, lang));
    const interval = setInterval(() => {
      setFormatted(sdk.data.formatDate(date, lang));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [date, lang]);

  return <span className={className}>{formatted}</span>;
};
