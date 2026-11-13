import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, LockKeyhole, X } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { CartSummary } from '../components/cart/CartSummary.jsx'
import { money } from '../utils/format.js'

const PAYMENT_METHODS = ['Cash on Delivery', 'E-wallet', 'Bank account']
const cartItemKey = (item) => `${item.id}::${item.color || ''}`
const readAddresses = () => {
  try { return JSON.parse(localStorage.getItem('readycampus.addresses')) || [] } catch { return [] }
}

export function Checkout() {
  const { cart, products, user, createOrder, notify } = useStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [selectedCartIds] = useState(() => {
    const stored = localStorage.getItem('readycampus.checkoutItem')
    if (stored === null) return null
    try { const parsed = JSON.parse(stored); return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)] } catch { return [stored] }
  })
  const [addresses] = useState(readAddresses)
  const [form, setForm] = useState({
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email || '', phone: user?.phone || '', building: '', street: '', barangay: '',
    city: '', province: '', postalCode: '', addressLabel: 'Home', delivery: 'Standard Delivery',
    payment: 'Cash on Delivery', notes: '',
  })
  const items = useMemo(() => cart.map((entry) => {
    const product = products.find((item) => String(item.id) === String(entry.id))
    return product ? { ...product, quantity: entry.quantity, color: entry.color || null } : null
  }).filter(Boolean).filter((item) => selectedCartIds === null || selectedCartIds.some((id) => String(id) === cartItemKey(item) || String(id) === String(item.id))), [cart, products, selectedCartIds])
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }))
  const close = () => navigate('/cart')

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !busy) close() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [busy])

  const selectAddress = (event) => {
    const selected = addresses.find((address) => String(address.id) === event.target.value)
    if (!selected) {
      setForm((value) => ({ ...value, building: '', street: '', barangay: '', city: '', province: '', postalCode: '', addressLabel: 'Home' }))
      return
    }
    setForm((value) => ({ ...value, fullName: selected.recipient || value.fullName, phone: selected.phone || value.phone, street: selected.street || '', barangay: selected.barangay || '', city: selected.city || '', province: selected.province || '', postalCode: selected.postalCode || '', addressLabel: selected.label || 'Home' }))
  }

  const continueToPayment = (event) => {
    const addressStep = event.currentTarget.closest('form').querySelector('.checkout-address-step')
    if (!addressStep.reportValidity()) return
    setError('')
    setStep(2)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy || step !== 3) return
    setBusy(true)
    setError('')
    try {
      const order = await createOrder({
        customer: { fullName: form.fullName, email: form.email, phone: form.phone },
        address: { building: form.building, street: form.street, barangay: form.barangay, city: form.city, province: form.province, postalCode: form.postalCode, label: form.addressLabel },
        delivery: form.delivery,
        payment: form.payment,
        notes: form.notes,
      }, selectedCartIds === null ? null : items.map(cartItemKey))
      notify('Your demo order was created.')
      navigate(`/order-confirmation/${order.reference}`)
    } catch (cause) {
      setError(cause.message || 'Unable to create this demo order. Please review your cart.')
      setBusy(false)
    }
  }

  if (!items.length) return <main className="content-page"><div className="empty-state"><h1>Nothing to check out</h1><p>Add school supplies to your cart before checkout.</p><button className="button button-orange" onClick={() => navigate('/shop')}>Browse supplies</button></div></main>

  return (
    <main className="checkout-modal-backdrop checkout-wizard-backdrop">
      <section className="checkout-wizard" role="dialog" aria-modal="true" aria-labelledby="checkout-wizard-title">
        <header className="checkout-wizard-header">
          <div><span className="eyebrow">Step {step} of 3</span><h1 id="checkout-wizard-title">{step === 1 ? 'Delivery address' : step === 2 ? 'Payment method' : 'Review order'}</h1></div>
          <button className="checkout-modal-close" type="button" aria-label="Close checkout" onClick={close}><X size={20} /></button>
        </header>
        <div className="checkout-wizard-steps" aria-label="Checkout progress">
          {['Delivery address', 'Payment method', 'Review order'].map((label, index) => <div className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} key={label}><span>{step > index + 1 ? <Check size={14} /> : index + 1}</span><b>{label}</b></div>)}
        </div>
        <form className="checkout-wizard-form" onSubmit={submit}>
          {step === 1 && <fieldset className="checkout-address-step"><legend>Add the delivery details for your selected items.</legend>
            {addresses.length > 0 && <label className="wizard-field wizard-wide">Saved delivery address<select defaultValue="new" onChange={selectAddress}><option value="new">Enter a new address</option>{addresses.map((address) => <option value={address.id} key={address.id}>{address.label} — {address.recipient}, {address.street}</option>)}</select></label>}
            <div className="checkout-wizard-grid">
              <label className="wizard-field">Full name<input required autoComplete="name" name="fullName" value={form.fullName} onChange={change} /></label>
              <label className="wizard-field">Phone number<input required type="tel" autoComplete="tel" pattern="[+0-9 ()-]{7,20}" name="phone" value={form.phone} onChange={change} /></label>
              <label className="wizard-field wizard-wide">Email address<input required type="email" autoComplete="email" name="email" value={form.email} onChange={change} /></label>
              <label className="wizard-field">Barangay<input required name="barangay" value={form.barangay} onChange={change} /></label>
              <label className="wizard-field">City / Municipality<input required name="city" value={form.city} onChange={change} /></label>
              <label className="wizard-field">Province<input required name="province" value={form.province} onChange={change} /></label>
              <label className="wizard-field">Postal code<input required inputMode="numeric" pattern="[0-9]{4}" maxLength="4" name="postalCode" value={form.postalCode} onChange={change} /></label>
              <label className="wizard-field wizard-wide">Street, building, house number<textarea required rows="2" name="street" value={form.street} onChange={change} placeholder="Street, building, house number" /></label>
              <label className="wizard-field">Address label<select name="addressLabel" value={form.addressLabel} onChange={change}><option>Home</option><option>Work</option><option>School</option><option>Other</option></select></label>
              <label className="wizard-field wizard-wide">Delivery notes (optional)<textarea rows="2" name="notes" value={form.notes} onChange={change} placeholder="Landmarks or delivery instructions" /></label>
            </div>
          </fieldset>}
          {step === 2 && <section className="checkout-wizard-panel"><p className="checkout-wizard-help">Choose how you would like to pay for this demo order.</p><fieldset className="checkout-payment checkout-payment-choice"><legend>Select payment method</legend><div className="payment-options payment-options-vertical">{PAYMENT_METHODS.map((method) => <label className={form.payment === method ? 'selected' : ''} key={method}><input type="radio" name="payment" value={method} checked={form.payment === method} onChange={change} /><span><strong>{method === 'E-wallet' ? 'Pay with E-wallet' : method}</strong><small>{method === 'Cash on Delivery' ? 'Pay when your order arrives.' : 'Demo option only. No payment is processed.'}</small></span></label>)}</div></fieldset><p className="checkout-wizard-disclaimer">E-wallet and bank account are not connected; no payment will be processed.</p></section>}
          {step === 3 && <section className="checkout-wizard-panel checkout-review"><div className="checkout-review-address"><h2>Deliver to</h2><strong>{form.fullName} · {form.phone}</strong><p>{form.street}, {form.barangay}, {form.city}, {form.province} {form.postalCode}</p><button type="button" onClick={() => setStep(1)}>Edit address</button></div><div className="checkout-review-address"><h2>Payment</h2><strong>{form.payment}</strong><p>{form.delivery}</p><button type="button" onClick={() => setStep(2)}>Edit payment</button></div><div className="checkout-review-items"><h2>Items ({items.reduce((total, item) => total + item.quantity, 0)})</h2>{items.map((item) => <div key={cartItemKey(item)}><span>{item.name}{item.color && ` · ${item.color}`} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><CartSummary items={items} checkout /></section>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <footer className="checkout-wizard-footer">{step > 1 ? <button type="button" className="checkout-wizard-back" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button> : <button type="button" className="checkout-wizard-back" onClick={close}>Cancel</button>}{step < 3 ? <button type="button" className="button button-orange checkout-wizard-continue" onClick={step === 1 ? continueToPayment : () => setStep(3)}>Continue</button> : <button className="button button-orange checkout-wizard-continue" type="submit" disabled={busy}><LockKeyhole size={16} />{busy ? 'Creating order…' : 'Place Demo Order'}</button>}</footer>
        </form>
      </section>
    </main>
  )
}






