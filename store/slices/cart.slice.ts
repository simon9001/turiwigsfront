import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { cartApi } from '@/api/cart.api';
import type { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  open: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  open: false,
  loading: false,
  error: null,
};

export const fetchCartThunk = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.get();
    return data.data;
  } catch {
    return rejectWithValue('Failed to load cart');
  }
});

// After adding an item, re-fetch the full cart so product name/image joins are present
export const addToCartThunk = createAsyncThunk(
  'cart/addItem',
  async (
    payload: { productId?: string; serviceId?: string; variantId?: string; quantity?: number },
    { rejectWithValue }
  ) => {
    try {
      await cartApi.addItem(payload);
      const { data } = await cartApi.get();
      return data.data; // full Cart with products/services joined
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not add to cart';
      return rejectWithValue(msg);
    }
  }
);

export const removeCartItemThunk = createAsyncThunk(
  'cart/removeItem',
  async (id: string, { rejectWithValue }) => {
    try {
      await cartApi.removeItem(id);
      return id;
    } catch {
      return rejectWithValue('Could not remove item');
    }
  }
);

export const updateCartItemThunk = createAsyncThunk(
  'cart/updateItem',
  async ({ id, quantity }: { id: string; quantity: number }, { rejectWithValue }) => {
    try {
      const { data } = await cartApi.updateItem(id, quantity);
      return data.data;
    } catch {
      return rejectWithValue('Could not update item');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    openCart: (state) => { state.open = true; },
    closeCart: (state) => { state.open = false; },
    toggleCart: (state) => { state.open = !state.open; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchCartThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.cart = payload;
      })
      .addCase(fetchCartThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload as string;
      })
      // addToCartThunk now returns the full Cart
      .addCase(addToCartThunk.fulfilled, (state, { payload }) => {
        state.cart = payload;
        state.open = true;
      })
      .addCase(addToCartThunk.rejected, (state, { payload }) => {
        state.error = payload as string;
      })
      .addCase(removeCartItemThunk.fulfilled, (state, { payload: id }) => {
        if (state.cart?.items) {
          state.cart.items = state.cart.items.filter((i) => i.id !== id);
        }
      })
      .addCase(updateCartItemThunk.fulfilled, (state, { payload }: PayloadAction<CartItem>) => {
        if (state.cart?.items) {
          const idx = state.cart.items.findIndex((i) => i.id === payload.id);
          if (idx !== -1) state.cart.items[idx] = { ...state.cart.items[idx], ...payload };
        }
      });
  },
});

export const { openCart, closeCart, toggleCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.cart?.items?.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0;
