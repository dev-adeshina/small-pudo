'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Package, MapPin, Truck, ShoppingBag,
  ClipboardList, Search, ShieldCheck, Clock3, Globe2, Menu, X,
  CheckCircle2, ChevronRight, Sparkles, Box, Plane, Warehouse
} from 'lucide-react';
import './homepage.css';

type Journey = 'send' | 'pickup' | 'quote' | 'track' | null;

const journeys = [
  { id: 'send' as const, label: 'Send an item', detail: 'Arrange a delivery', icon: Package, action: 'Start sending' },
  { id: 'quote' as const, label: 'Get a quote', detail: 'See an estimated cost', icon: ClipboardList, action: 'Calculate estimate' },
  { id: 'pickup' as const, label: 'Pick up an item', detail: 'Request a collection', icon: Truck, action: 'Request pickup' },
  { id: 'track' as const, label: 'Track an item', detail: 'Check a tracking reference', icon: Search, action: 'Track item' },
];

const serviceHighlights = [
  { icon: Package, title: 'Send & receive', copy: 'A simpler way to move parcels between people, businesses and places.' },
  { icon: MapPin, title: 'Neighbourhood points', copy: 'Convenient pickup and drop-off through a growing partner network.' },
  { icon: ShoppingBag, title: 'Shop online', copy: 'Discover products in the VeriLyft store and shop in one place.' },
  { icon: Globe2, title: 'Connected logistics', copy: 'A joined-up experience for local movement and wider commerce.' },
];

export default function HomePage() {
  const [journey, setJourney] = useState<Journey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [result, setResult] = useState(false);
  const [trackingRef, setTrackingRef] = useState('');

  function openJourney(next: Journey) {
    setResult(false);
    setJourney(next);
    setMobileOpen(false);
  }

  function submitDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(true);
  }

  const closeJourney = () => { setJourney(null); setResult(false); };

  return (
    <main className="vl-home">
      <header className="vl-nav">
        <Link href="/" className="vl-brand" aria-label="VeriLyft home">
          <Image src="/logo.svg" alt="VeriLyft" width={142} height={42} priority />
        </Link>
        <button className="vl-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <nav className={mobileOpen ? 'vl-nav-links is-open' : 'vl-nav-links'}>
          <a href="#services" onClick={() => setMobileOpen(false)}>Our services</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
          <Link href="/products" onClick={() => setMobileOpen(false)}>Online store</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)}>About us</Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
          <Link href="/account/sign-in" className="vl-signin" onClick={() => setMobileOpen(false)}>Sign in</Link>
          <Link href="/account/register" className="vl-nav-cta" onClick={() => setMobileOpen(false)}>Get started <ArrowUpRight size={16} /></Link>
        </nav>
      </header>

      <section className="vl-hero">
        <div className="vl-hero-image">
          <Image src="/cargox-hero.jpeg" alt="A freight truck travelling along an open highway" fill priority sizes="(max-width: 800px) 100vw, 54vw" />
          <div className="vl-image-shade" />
          <div className="vl-image-caption"><span className="vl-live-dot" /> MOVING WHAT MATTERS</div>
          <div className="vl-image-stamp"><span>VERILYFT</span><strong>Beyond<br />Borders.</strong><small>One connected experience.</small></div>
        </div>
        <div className="vl-hero-copy">
          <span className="vl-eyebrow"><span /> LOGISTICS, MADE MORE HUMAN</span>
          <h1>Move what<br />matters<span>.</span></h1>
          <p>Send, receive, shop and keep things moving. Start with what you need today.</p>
          <div className="vl-hero-actions">
            <button className="vl-button vl-button-dark" onClick={() => openJourney('send')}>Send an item <ArrowUpRight size={18} /></button>
            <Link className="vl-text-link" href="/products">Explore the store <ArrowRight size={17} /></Link>
          </div>
          <div className="vl-hero-trust"><ShieldCheck size={17} /><span>A clearer, more convenient way to move items.</span></div>
        </div>
      </section>

      <section className="vl-choose" id="services">
        <div className="vl-section-top">
          <div><span className="vl-eyebrow">YOUR NEXT STEP STARTS HERE</span><h2>What would you<br className="vl-mobile-break" /> like to do?</h2></div>
          <p>Choose a service to get started. You’re always just a few steps away from where you need to be.</p>
        </div>
        <div className="vl-journey-grid">
          {journeys.map(({ id, label, detail, icon: Icon, action }, index) => (
            <button className={index === 0 ? 'vl-journey-card is-featured' : 'vl-journey-card'} key={id} onClick={() => openJourney(id)}>
              <span className="vl-card-index">0{index + 1}</span>
              <span className="vl-journey-icon"><Icon size={23} strokeWidth={1.7} /></span>
              <span className="vl-journey-title">{label}</span>
              <span className="vl-journey-detail">{detail}</span>
              <span className="vl-journey-action">{action}<ArrowUpRight size={17} /></span>
            </button>
          ))}
          <Link className="vl-journey-card vl-shop-card" href="/products">
            <span className="vl-card-index">05</span><span className="vl-journey-icon"><ShoppingBag size={23} /></span>
            <span className="vl-journey-title">Buy an item</span><span className="vl-journey-detail">Browse the VeriLyft store</span>
            <span className="vl-journey-action">Shop products <ArrowUpRight size={17} /></span>
          </Link>
        </div>
        <div className="vl-demo-note"><Sparkles size={15} /> Service previews on this page are demonstrations and do not create bookings.</div>
      </section>

      <section className="vl-how" id="how-it-works">
        <div className="vl-how-visual">
          <div className="vl-orbit orbit-one" /><div className="vl-orbit orbit-two" />
          <div className="vl-orbit-core"><Globe2 size={54} strokeWidth={1.1} /><span>VERILYFT<br />NETWORK</span></div>
          <div className="vl-orbit-node node-one"><Package size={20} /><small>Send</small></div>
          <div className="vl-orbit-node node-two"><MapPin size={20} /><small>Connect</small></div>
          <div className="vl-orbit-node node-three"><Box size={20} /><small>Receive</small></div>
          <div className="vl-visual-label">A connected journey, from start to finish</div>
        </div>
        <div className="vl-how-copy">
          <span className="vl-eyebrow">SIMPLE BY DESIGN</span>
          <h2>From your hands<br />to the right place.</h2>
          <p>VeriLyft brings useful services together in one experience. Start with a delivery, find a convenient pickup point, or shop for something you need.</p>
          <div className="vl-steps">
            <div><span>01</span><p><strong>Choose what you need</strong><small>Pick a service and tell us a little about it.</small></p></div>
            <div><span>02</span><p><strong>See your next step</strong><small>Get clear information to help you move forward.</small></p></div>
            <div><span>03</span><p><strong>Stay connected</strong><small>Keep your experience simple and in one place.</small></p></div>
          </div>
        </div>
      </section>

      <section className="vl-services">
        <div className="vl-section-top">
          <div><span className="vl-eyebrow">ONE PLATFORM, MORE POSSIBILITIES</span><h2>Everyday movement.<br />Made easier.</h2></div>
          <p>Useful services that bring people, commerce and logistics closer together.</p>
        </div>
        <div className="vl-highlight-grid">
          {serviceHighlights.map(({ icon: Icon, title, copy }, i) => (
            <article className="vl-highlight" key={title}><span className="vl-highlight-no">0{i + 1}</span><Icon size={26} strokeWidth={1.5} /><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="vl-store">
        <div className="vl-store-copy"><span className="vl-eyebrow">THE VERILYFT STORE</span><h2>Find something<br />worth bringing home.</h2><p>Explore products, discover something useful and shop through our online store.</p><Link href="/products" className="vl-button vl-button-light">Explore the store <ArrowUpRight size={18} /></Link></div>
        <div className="vl-store-art" aria-hidden="true"><div className="vl-store-sun" /><div className="vl-store-box box-a"><Package size={55} /></div><div className="vl-store-box box-b"><ShoppingBag size={39} /></div><div className="vl-store-route"><span /><span /><span /></div><span className="vl-store-art-label">DISCOVER · SHOP · RECEIVE</span></div>
      </section>

      <section className="vl-about">
        <div><span className="vl-eyebrow">BEYOND BORDERS</span><h2>Built around the<br />way life moves.</h2></div>
        <div className="vl-about-copy"><p>VeriLyft is building a connected logistics and commerce experience—bringing everyday services together with a focus on convenience, clarity and trust.</p><Link href="/about" className="vl-text-link">Get to know us <ArrowRight size={17} /></Link></div>
      </section>

      <section className="vl-contact">
        <div><span className="vl-eyebrow">LET’S MOVE FORWARD</span><h2>Have a question?<br /><em>We’re here to help.</em></h2></div>
        <div className="vl-contact-action"><p>Talk to our team about VeriLyft services, partnerships or how we can help.</p><Link href="/contact" className="vl-button vl-button-light">Contact VeriLyft <ArrowUpRight size={18} /></Link></div>
      </section>

      <footer className="vl-footer">
        <div className="vl-footer-main"><Link href="/" className="vl-footer-brand"><Image src="/logo.svg" alt="VeriLyft" width={126} height={38} /> <span>Beyond Borders.</span></Link><p>Simple. Convenient. Connected.</p><div className="vl-footer-links"><div><strong>Explore</strong><Link href="/products">Online store</Link><Link href="/about">About us</Link><Link href="/contact">Contact</Link></div><div><strong>Get started</strong><button onClick={() => openJourney('send')}>Send an item</button><button onClick={() => openJourney('quote')}>Get a quote</button><Link href="/account/sign-in">Sign in</Link></div><div><strong>Account</strong><Link href="/account/register">Create account</Link><Link href="/cart">Shopping cart</Link><Link href="/pudo-partner/register">Become a PUDO partner</Link></div></div></div>
        <div className="vl-footer-bottom"><span>© {new Date().getFullYear()} VeriLyft. All rights reserved.</span><span>Move what matters.</span></div>
      </footer>

      {journey && <div className="vl-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeJourney(); }}>
        <section className="vl-modal" role="dialog" aria-modal="true" aria-labelledby="vl-modal-title">
          <button className="vl-modal-close" onClick={closeJourney} aria-label="Close"><X size={20} /></button>
          <div className="vl-modal-heading"><span className="vl-eyebrow">VERILYFT SERVICE PREVIEW</span><h2 id="vl-modal-title">{journey === 'send' ? 'Send an item' : journey === 'pickup' ? 'Request a pickup' : journey === 'quote' ? 'Get an estimate' : 'Track an item'}</h2><p>This is a demonstration only. Nothing will be booked, charged or saved.</p></div>
          {result ? <div className="vl-demo-result"><span className="vl-result-icon"><CheckCircle2 size={28} /></span><h3>{journey === 'track' ? 'Demo tracking preview' : journey === 'quote' ? 'Your illustrative estimate' : 'Your details look good'}</h3>
            {journey === 'quote' ? <><strong className="vl-estimate">₦4,500 – ₦7,500</strong><p>Illustrative demo range only. This is not a live quote and is not valid for booking.</p></> : journey === 'track' ? <><p>Reference <strong>{trackingRef || 'DEMO-12345'}</strong> is being shown as a sample tracking journey.</p><div className="vl-demo-timeline"><span className="done">Request received <small>Sample event</small></span><span>In transit <small>Sample event</small></span><span>Ready for collection <small>Sample event</small></span></div><p className="vl-demo-disclaimer">These are example statuses, not the location or status of a real parcel.</p></> : <p>Your information has only been checked in this page preview. No request or booking has been created.</p>}
            <button className="vl-button vl-button-dark" onClick={closeJourney}>Close preview <ArrowRight size={17} /></button>
          </div> : <form className="vl-demo-form" onSubmit={submitDemo}>
            {journey === 'track' ? <label>Tracking reference<input required value={trackingRef} onChange={(e) => setTrackingRef(e.target.value)} placeholder="e.g. VL-123456" /></label> : <>
              <div className="vl-form-row"><label>{journey === 'pickup' ? 'Your name' : 'Full name'}<input required minLength={2} placeholder="Enter your name" /></label><label>Phone number<input required type="tel" minLength={7} placeholder="+234 ..." /></label></div>
              <label>Email address<input required type="email" placeholder="you@example.com" /></label>
              {journey !== 'pickup' && <div className="vl-form-row"><label>From<input required placeholder="Pickup city or area" /></label><label>To<input required placeholder="Destination city or area" /></label></div>}
              {journey === 'pickup' && <><label>Pickup location<input required placeholder="Enter pickup address or area" /></label><label>Preferred collection date<input required type="date" min={new Date().toISOString().split('T')[0]} /></label></>}
              {journey === 'send' && <div className="vl-form-row"><label>Item type<select required defaultValue=""><option value="" disabled>Select item</option><option>Document</option><option>Parcel</option><option>Box or package</option><option>Other</option></select></label><label>Approx. weight<select defaultValue="Under 5 kg"><option>Under 5 kg</option><option>5–10 kg</option><option>10–20 kg</option><option>Over 20 kg</option></select></label></div>}
              {journey === 'quote' && <div className="vl-form-row"><label>Item type<select required defaultValue=""><option value="" disabled>Select item</option><option>Document</option><option>Parcel</option><option>Box or package</option></select></label><label>Approx. weight<select defaultValue="Under 5 kg"><option>Under 5 kg</option><option>5–10 kg</option><option>10–20 kg</option></select></label></div>}
            </>}
            <button className="vl-button vl-button-dark vl-form-submit" type="submit">{journey === 'track' ? 'View demo tracking' : journey === 'quote' ? 'Show illustrative estimate' : 'Preview details'} <ArrowUpRight size={18} /></button>
            <small className="vl-form-footnote"><ShieldCheck size={14} /> Demo only · Your entries are not sent to a server or stored.</small>
          </form>}
        </section>
      </div>}
    </main>
  );
}
