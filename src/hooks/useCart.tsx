import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    return storagedCart ? JSON.parse(storagedCart) : [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartItems = [...cart]; //not to work directly with cart (immutability)
      const item = cart.find((product) => product.id === productId);
      const { data: stockData } = await api.get<Stock>(`/stock/${productId}`);
      const cartQuantity = item ? item.amount : 0;

      if (cartQuantity >= stockData.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (item) {
        item.amount++;
      }

      const { data: productData } = await api.get<Product>(
        `/products/${productId}`
      );
      cartItems.push({ ...productData, amount: 1 });
      setCart(cartItems);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartItems));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const cartItems = [...cart]; //not to work directly with cart (immutability)
      const item = cart.find((product) => product.id === productId);

      if (!item) {
        toast.error("Erro na remoção do produto");
        return;
      }

      item.amount = 0;
      setCart(cartItems);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartItems));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const { data: stockData } = await api.get<Stock>(`/stock/${productId}`);
      if (amount > stockData.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const itemExists = cart.some((item) => item.id === productId);
      if (!itemExists) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const updatedCart = cart.map((item) =>
        item.id === productId ? { ...item, amount } : item
      );

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
