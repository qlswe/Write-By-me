import React, { useEffect, useState } from 'react';
import { useLimits } from '../../hooks/useLimits';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Language, translations } from '../../data/translations';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdsBlockProps {
  lang?: Language;
}

export const AdsBlock: React.FC<AdsBlockProps> = () => {
  return null;
};
