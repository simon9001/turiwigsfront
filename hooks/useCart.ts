'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import {
  fetchCartThunk,
  addToCartThunk,
  removeCartItemThunk,
  updateCartItemThunk,
  toggleCart,
  selectCartCount,
  selectCartTotal,
} from '@/store/slices/cart.slice';

/**
 * Loads the cart once for the whole app. Called from LayoutShell — putting it
 * in useCart meant every component that wanted `count` or `addItem` fired its
 * own request (three of them on the cart page alone).
 */
export function useCartSync(enabled = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (enabled && token) dispatch(fetchCartThunk());
  }, [enabled, token, dispatch]);
}

export function useCart() {
  const dispatch = useAppDispatch();
  const { cart, open, loading } = useAppSelector((s) => s.cart);
  const count = useAppSelector(selectCartCount);
  const total = useAppSelector(selectCartTotal);

  return {
    cart,
    open,
    loading,
    count,
    total,
    toggle: () => dispatch(toggleCart()),
    addItem: (payload: { productId?: string; serviceId?: string; variantId?: string; quantity?: number }) =>
      dispatch(addToCartThunk(payload)).unwrap(),
    removeItem: (id: string) => dispatch(removeCartItemThunk(id)),
    updateItem: (id: string, quantity: number) => dispatch(updateCartItemThunk({ id, quantity })),
  };
}
