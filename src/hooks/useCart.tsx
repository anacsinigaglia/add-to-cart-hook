import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartItems = [...cart]; //not to work directly with cart (immutability)
      const item = cartItems.find((product) => product.id === productId);
      const itemStock = (await api.get(`/stock/${productId}`)).data.amount;
      const cartQuantity = item ? item.amount : 0;

      if (cartQuantity >= itemStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (item) {
        item.amount++;
      }

      const productData = (await api.get(`/products/${productId}`)).data;
      cartItems.push({ ...productData, amount: 1 });
      setCart(cartItems); //att cart thru setCart as expected (immutability)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartItems));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const cartItems = [...cart]; //not to work directly with cart (immutability)
      const item = cartItems.find((product) => product.id === productId);

      if (item) {
        item.amount = 0;
      }

      setCart(cartItems); //att cart thru setCart as expected (immutability)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartItems));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return useContext(CartContext);
}
