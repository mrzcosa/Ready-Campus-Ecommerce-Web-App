import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { CartSummary } from '../components/cart/CartSummary.jsx'
import { ProductVisual } from '../components/products/ProductCard.jsx'
import { money } from '../utils/format.js'

const CHECKOUT_ITEM_KEY = 'readycampus.checkoutItem'
const cartItemKey = (item) => `${item.id}::${item.color || ''}`
const readSelection = () => {
  const saved = localStorage.getItem(CHECKOUT_ITEM_KEY)
  if (saved === null) return null
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
  } catch { return [saved] }
}

export function Cart() {
  const { cart, products, setCartQuantity, removeFromCart, clearCart, notify } = useStore()
  const items = cart.map((entry) => {
    const product = products.find((item) => String(item.id) === String(entry.id))
    return product ? { ...product, quantity: entry.quantity, color: entry.color || null } : null
  }).filter(Boolean)
  const [savedSelection, setSavedSelection] = useState(readSelection)
  const allIds = items.map(cartItemKey)
  const selectedIds = [...new Set((savedSelection === null ? allIds : savedSelection).flatMap((id) => allIds.includes(String(id)) ? [String(id)] : items.filter((item) => String(item.id) === String(id)).map(cartItemKey)))]
  const selectedItems = items.filter((item) => selectedIds.includes(cartItemKey(item)))

  useEffect(() => {
    localStorage.setItem(CHECKOUT_ITEM_KEY, JSON.stringify(selectedIds))
    if (savedSelection === null) setSavedSelection(selectedIds)
  }, [selectedIds, savedSelection])

  const toggleItem = (key) => {
    const currentIds = savedSelection === null ? allIds : savedSelection
    const nextIds = currentIds.includes(key) ? currentIds.filter((selected) => selected !== key) : [...currentIds, key]
    setSavedSelection(nextIds)
    localStorage.setItem(CHECKOUT_ITEM_KEY, JSON.stringify(nextIds))
  }
  const emptyCart = () => {
    if (window.confirm('Clear every item from your cart?')) {
      clearCart()
      localStorage.setItem(CHECKOUT_ITEM_KEY, JSON.stringify([]))
      setSavedSelection([])
      notify('Your cart has been cleared.')
    }
  }

  return <main className="content-page">{items.length > 0 && <Link className="back-link cart-top-link" to="/shop"><ArrowLeft size={15} /> Continue Shopping</Link>}<div className="page-intro compact-intro"><span className="eyebrow">Ready when you are</span><h1>Your Shopping Cart <span className="title-count">{items.reduce((sum, item) => sum + item.quantity, 0)}</span></h1></div>{items.length ? <div className="cart-layout"><section className="cart-items" aria-label="Shopping cart items">{items.map((item) => { const key = cartItemKey(item); return <article className={`cart-item${selectedIds.includes(key) ? ' checkout-item-selected' : ''}`} key={key}><label className="cart-select-item"><input type="checkbox" name="checkout-item" aria-label={`Select ${item.name}${item.color ? ` in ${item.color}` : ''} for checkout`} checked={selectedIds.includes(key)} onChange={() => toggleItem(key)} /></label><Link className="cart-item-photo" to={`/products/${item.id}`}><ProductVisual product={item} /></Link><div className="cart-item-main"><span className="product-category">{item.category} · {item.brand}</span><h2><Link to={`/products/${item.id}`}>{item.name}</Link></h2>{item.color && <span className="cart-item-color">Color: {item.color}</span>}<span className="cart-item-price">{money(item.price)} each</span><div className="cart-item-controls"><div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => setCartQuantity(item.id, item.quantity - 1, item.color)}><Minus size={14} /></button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= item.stock} onClick={() => setCartQuantity(item.id, item.quantity + 1, item.color)}><Plus size={14} /></button></div><button className="remove-item" onClick={() => removeFromCart(item.id, item.color)}><Trash2 size={15} /> Remove</button></div></div><strong className="cart-line-total">{money(item.price * item.quantity)}</strong></article>})}<div className="cart-footer-links"><button className="text-danger" onClick={emptyCart}><Trash2 size={15} /> Clear Cart</button></div></section><div className="cart-selected-summary"><p>{selectedItems.length ? <>Selected for checkout: <strong>{selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}</strong></> : 'Select at least one item to continue.'}</p><CartSummary items={selectedItems} checkoutDisabled={!selectedItems.length} /></div></div> : <div className="empty-state"><span className="empty-state-icon">🛒</span><h2>Your cart is waiting for school supplies</h2><p>Explore stationery, classroom essentials, and more.</p><Link className="button button-orange" to="/shop">Continue Shopping</Link></div>}</main>
}
