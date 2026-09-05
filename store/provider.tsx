'use client';

import { Provider } from 'react-redux';
import { store } from './index';

// `store` is a module singleton, so it is already stable across renders —
// holding it in a ref added nothing and read that ref during render.
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
