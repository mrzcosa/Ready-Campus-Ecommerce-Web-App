import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HeroBanner() {
  return <div className="hero-banner">
    <div className="hero-copy">
      <span className="hero-kicker">Back to school essentials</span>
      <h1>School Supplies<br />
      <em>All in One Place!</em>
      </h1><p>Notebooks, pens, art materials, and more<br className="desktop-break" /> for students and teachers.</p>
      <Link className="button button-orange hero-button" to="/shop">Shop Now <ArrowRight size={18} /></Link></div></div>
}
