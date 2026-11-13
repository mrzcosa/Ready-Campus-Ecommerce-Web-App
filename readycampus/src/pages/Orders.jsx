import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageCheck } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { ProductVisual } from '../components/products/ProductCard.jsx'
import { formatDate, money } from '../utils/format.js'

const purchaseTabs = [
  { id: 'all', label: 'All' },
  { id: 'pay', label: 'To Pay' },
  { id: 'ship', label: 'To Ship' },
  { id: 'receive', label: 'To Receive' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returns', label: 'Return/Refund' },
]
const statusesByTab = {
  pay: ['Pending'],
  ship: ['Confirmed', 'Processing', 'Ready for Shipment'],
  receive: ['Shipped', 'Out for Delivery'],
  completed: ['Delivered'],
  cancelled: ['Cancelled'],
  returns: [],
}

export function Orders() {
  const { user, orders, updateOrderStatus, requestOrderRefund, notify } = useStore()
  const [activeTab, setActiveTab] = useState('all')
  const userOrders = user ? orders.filter((order) => order.customer?.email?.toLowerCase() === user.email.toLowerCase()) : orders
  const visibleOrders = activeTab === 'all' ? userOrders : activeTab === 'returns' ? userOrders.filter((order) => order.refundRequested) : userOrders.filter((order) => statusesByTab[activeTab]?.includes(order.status))
  const emptyTitle = activeTab === 'returns' ? 'No return or refund requests' : 'No purchases yet'
  const emptyDescription = activeTab === 'returns' ? 'Return and refund requests are not available in this storefront demo.' : activeTab === 'all' ? 'Your confirmed checkout orders will appear here.' : `You do not have any orders in “${purchaseTabs.find((tab) => tab.id === activeTab)?.label}” yet.`

  return <main className="content-page purchases-page">
    <div className="page-intro purchases-intro"><span className="eyebrow">Your account</span><h1>My Purchases</h1><p>Keep track of your orders and their status.</p></div>
    <div className="purchase-tabs" role="tablist" aria-label="Filter purchases by status">{purchaseTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
    {visibleOrders.length ? <div className="purchase-order-list">{visibleOrders.map((order) => <article className="purchase-order-card" key={order.reference}>
      <header><span><PackageCheck size={17} /> Order placed {formatDate(order.date)}</span><strong>{order.reference}</strong><span className={`purchase-status status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></header>
      <div className="purchase-order-items">{order.items.map((item) => <div className="purchase-order-item" key={`${order.reference}-${item.id}-${item.color || ''}`}><Link to={`/products/${item.id}`}><ProductVisual product={item} /></Link><div><Link to={`/products/${item.id}`}><strong>{item.name}</strong></Link>{item.color && <span>Color: {item.color}</span>}<span>Qty: {item.quantity}</span></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div>
      <footer><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · Total <strong>{money(order.total)}</strong></span>{order.status === 'Out for Delivery' && <button className="purchase-received-button" type="button" onClick={() => { updateOrderStatus(order.reference, 'Delivered'); notify('Order marked as received.') }}>Order Received</button>}{order.status === 'Delivered' && <button className="purchase-received-button" type="button" disabled={order.refundRequested} onClick={() => { requestOrderRefund(order.reference); notify('Demo refund request saved in this browser.') }}>{order.refundRequested ? 'Refund requested' : 'Request a refund'}</button>}<Link className="purchase-track-link" to={`/track-order/${order.reference}`}>Track order</Link></footer>
    </article>)}</div> : <section className="purchase-empty"><h2>{emptyTitle}</h2><p>{emptyDescription}</p>{activeTab !== 'returns' && <Link className="button button-orange" to="/shop">Explore products</Link>}</section>}
    <p className="purchase-demo-note">Orders are saved in this browser. E-wallet payment and shipment tracking are demo features and do not contact a payment or delivery provider.</p>
  </main>
}




