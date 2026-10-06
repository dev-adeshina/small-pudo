'use client';

import Image from 'next/image';
import Link from "next/link";


import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  X,
  Globe2,
  ShoppingCart,
  ShieldCheck,
  PackagePlus,
  Recycle,
  Store,
  Factory,
  PackageCheck,
  Route,
  Ship,
  Plane,
  Truck,
  Warehouse,
  Bike,
  Home,
  Car
} from 'lucide-react';

import { FormEvent, useState } from 'react';
import { useCart } from "@/context/cart-context";

const services = [
  {
    number: '01',
    title: 'Verified Sales',
    text: 'A verified network of neighbourhood pickup and drop-off points backed by secure escrow, ensuring unbroken custody.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Delivery Routes',
    text: 'B2B supply chain rail connecting manufacturers and sub-dealers straight to retail shelves without stock-outs.',
    icon: Truck,
  },
  {
    number: '03',
    title: 'Warehousing',
    text: 'State-of-the-art mega-warehouses enabling true same-day delivery and vertical retail fulfillment nationwide.',
    icon: Store,
  },
  {
    number: '04',
    title: 'Received',
    text: 'Funds remain safely in escrow until goods are inspected and confirmed at final handover, ensuring no release without receipt.',
    icon: PackagePlus,
  },
];

const industries = ['Commerce', 'Delivery', 'Ride', 'Escrow', 'Item Quality Verification', 'Secure Errand', 'Qaulified Artisan'];

export default function App() {



  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { getItemCount } = useCart();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <main>
      <section className="hero-shell">
        <Image
          className="hero-image"
          src="/cargox-hero.jpeg"
          alt="Cargo truck travelling on a highway at sunset"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 94vw"
        />
        <div className="hero-tint" />

        <header className="nav">
          <a className="logo" href="#top" aria-label="VeriLyft Group">


            <Image
              className="logo ml-8 mt-8"
              src="/logo.svg"
              width={60}
              height={20}
              alt="Cargo truck travelling on a highway at sunset"
              priority
              sizes="(max-width: 900px) 100vw, 94vw"
            />
          </a>

          <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
            <Link href="/about" onClick={() => setMenuOpen(false)}><b> Buy an Item </b> <ChevronDown size={15} /></Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}><b> Verify an Item  </b><ChevronDown size={15} /></Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)}><b> Contact Agent </b> <ChevronDown size={15} /></Link>
            
            <div className="dropdown">
              <button className="dropdown-trigger" onClick={() => setDropdownOpen(!dropdownOpen)} aria-expanded={dropdownOpen}>
                <b>Browse Products</b>
                <ChevronDown size={15} className={dropdownOpen ? "rotate" : ""} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link
                    href="/products/food"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Food
                  </Link>

                  <Link
                    href="/products/fashion"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Fashion
                  </Link>

                  <Link
                    href="/products/sanitary"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Sanitary
                  </Link>

                  <Link
                    href="/products/home-wares"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Home Wares
                  </Link>

                  <Link
                    href="/products/stationeries"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Stationeries
                  </Link>

                  <Link
                    href="/products/utilities"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Utilities
                  </Link>

                  <Link
                    href="/products/automobile"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Automobile
                  </Link>

                  <Link
                    href="/products/furniture"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Furniture
                  </Link>

                  <Link
                    href="/products/lighting"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Lighting
                  </Link>

                  <Link
                    href="/products/cosmetics"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Cosmetics
                  </Link>

                  <Link
                    href="/products/electronics"
                    onClick={() => { setDropdownOpen(false), setMenuOpen(false) }}
                  >
                    Electronics
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/cart"
              className="cart-link"
              aria-label={`Shopping cart with ${getItemCount()} items`}
            >
              <ShoppingCart size={20} />
              <span>Cart</span>

              {getItemCount() > 0 && (
                <span className="cart-count">
                  {getItemCount()}
                </span>
              )}
            </Link>
          </nav>

          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <div className="hero-copy" id="top">
          <p className="kicker">Verilyft / 2026</p>

          <h1><span className="font-bold">MOVE</span><span>ANYTHING </span><b> FROM YOUR</b><span> POCKET</span></h1>
          <p className="hero-lead">
            Logistics shaped by scale,
            <br />
            powered by precision.
          </p>
        </div>

        <div className="hero-map">
          <div className="world-dots" aria-hidden="true" />
          <div className="route route-one wave" />
          <div className="route route-two wave" />
          <span className="route-dot dot-a" />
          <span className="route-dot dot-b" />
          <span className="route-dot dot-c" />
          <span className="route-dot dot-d" />
          <div className="transport transport-truck"><Truck size={23} /></div>
          <div className="transport transport-home"><Home size={23} /></div>
          <div className="transport transport-bike"><Bike size={23} /></div>
          <div className="transport transport-car"><Car size={23} /></div>
          <p>We ensure full transparency at every stage to build trust and drive results.</p>
        </div>

        <div className="hero-bottom">
          <div className="metric">
            <strong>3M+</strong>
            <span>
              tons of cargo
              <br />
              successfully delivered
              <br />
              without delays
            </span>
            <span className="metric-icon">
              <PackageCheck size={22} />
            </span>

          </div>
          <a href="#contact" className="pill-button">Send Item <span><ArrowUpRight size={22} /></span></a>
          <a href="#contact" className="pill-button">Pick up item <span><ArrowUpRight size={22} /></span></a>
        </div>
      </section>

      <section className="intro" id="company">
        <div className="section-label">01 / THE NETWORK</div>
        <div>
          <h2>Driving commerce forward <em>every mile of the way.</em></h2>
          <p>
            From a trusted neighbourhood delivery network to a national
            distribution engine—we are building Africa’s ultimate
            logistics and commerce infrastructure
          </p>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <div><span className="section-label">02 / WHAT WE DO</span><h2>Connecting logistics and <em> COMMERCE.</em></h2></div>
          <p>
            {/* A seamless B2B supply chain connecting manufacturers, sub-dealers, wholesalers, and retail shelves on one shared logistics rail */}
            We are building Africa’s ultimate logistics and commerce infrastructure—connecting every buyer, seller, and manufacturer through a seamless, five-part ecosystem.
          </p>
        </div>

        <div className="service-grid">
          {services.map(({ number, title, text, icon: Icon }) => (
            <article className="service-card" key={number}>
              <span className="service-number">{number}</span>
              <Icon className="service-icon" size={30} strokeWidth={1.6} />
              <h3>{title}</h3>
              <p>{text}</p>
              <a href="#contact" aria-label={`Learn about ${title}`}>Explore <ArrowUpRight size={18} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="industries" id="industries">
        <div className="industry-copy">
          <span className="section-label">03 / INDUSTRIES</span>
          <h2>Precision where <em>it counts.</em></h2>
          <p>
            Every transaction has a different rhythm.
            Our logistics and commerce architecture adapts to yours—from
            neighbourhood pickup points to nationwide distribution.
          </p>
        </div>
        <div className="industry-list">
          {industries.map((industry, index) => (
            <a href="#contact" key={industry}><span>0{index + 1}</span>{industry}<ArrowUpRight size={20} /></a>
          ))}
        </div>
      </section>

      <section className="cta" id="contact">
        <div>
          <span className="section-label">04 / START A CONVERSATION</span>
          <h2>Ready to move<br /><em>further?</em></h2>
        </div>
        <div className="cta-side">
          <p>Stay ahead of Africa's logistics and commerce evolution.</p>
          <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Drop your email to get our latest roadmap updates, insights, and ecosystem news." aria-label="Email address" required />
            <button type="submit" aria-label="Submit email"><ArrowUpRight size={22} /></button>
          </form>
          {submitted && <small>Thanks — we&apos;ll be in touch.</small>}
        </div>
      </section>

      <footer>
        <div className="footer-logo">
          <Image
            className="logo ml-8 mt-8"
            src="/logo.svg"
            width={30}
            height={10}
            alt="Cargo truck travelling on a highway at sunset"
            priority
            sizes="(max-width: 900px) 100vw, 94vw"
          />
        </div>
        <div className="footer-note">Move anything<br />From your pocket.</div>
        <div className="footer-links"><a href="#services">Products</a><a href="#industries">Delievery</a><a href="#company"> About US</a><a href="#contact">Contact</a></div>
        <div className="copyright">© 2026 VeriLyft</div>
      </footer>
    </main>
  );
}

