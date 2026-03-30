import { useEffect } from 'react';
import { sdk } from '../sdk';

export function useSDK() {
  return sdk;
}

export function useSDKLogger(componentName: string) {
  useEffect(() => {
    sdk.logging.system(`${componentName} mounted`);
    return () => {
      sdk.logging.system(`${componentName} unmounted`);
    };
  }, [componentName]);

  return sdk.logging;
}
