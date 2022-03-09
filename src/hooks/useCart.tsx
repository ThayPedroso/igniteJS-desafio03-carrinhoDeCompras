import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const updatedCart = [...cart]
      const productExistsInCart = updatedCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      const currentAmount = productExistsInCart ? productExistsInCart.amount : 0
      const updatedAmount = currentAmount + 1

      if (updatedAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (productExistsInCart) {
        productExistsInCart.amount = updatedAmount
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct)
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.find(product => product.id === productId)

      if (productExistsInCart) {
        const filteredCart = cart.filter((product: Product) => product.id !== productId)

        setCart(filteredCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart))
      } else {
        toast.error('Erro na remoção do produto')
        return
      }

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const productExistsInCart = cart.find(product => product.id === productId)
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      if (!productExistsInCart) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }

      if (amount < 1 || stockAmount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      productExistsInCart.amount = amount

      const filteredCart = cart.filter((product: Product) => product.id !== productId)

      const updatedCart = [...filteredCart, productExistsInCart]

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
      return
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
  const context = useContext(CartContext);

  return context;
}
