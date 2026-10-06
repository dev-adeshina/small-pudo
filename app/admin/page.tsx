"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Package,
  Users,
  Wallet,
  Clock3,
  LogOut,
  Truck,
  ShoppingBag,
  Tags,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";

const stats = [
  {
    label: "TOTAL ORDERS",
    value: "248",
    change: "+12.4%",
    icon: Package,
  },
  {
    label: "CUSTOMERS",
    value: "1,284",
    change: "+8.2%",
    icon: Users,
  },
  {
    label: "REVENUE",
    value: "₦4.82M",
    change: "+14.8%",
    icon: Wallet,
  },
  {
    label: "PENDING",
    value: "18",
    change: "Needs attention",
    icon: Clock3,
  },
];

const recentOrders = [
  {
    id: "#VL-10248",
    customer: "Adebayo Stores",
    service: "Standard Delivery",
    status: "In Transit",
    amount: "₦8,500",
  },
  {
    id: "#VL-10247",
    customer: "Tola Kitchen",
    service: "Express Delivery",
    status: "Delivered",
    amount: "₦12,000",
  },
  {
    id: "#VL-10246",
    customer: "Mide Fashion",
    service: "Pickup",
    status: "Pending",
    amount: "₦5,500",
  },
  {
    id: "#VL-10245",
    customer: "Green Basket",
    service: "Standard Delivery",
    status: "Delivered",
    amount: "₦7,200",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {
        router.replace("/admin/sign-in");
        return;
      }

      if (!user.emailVerified) {
        router.replace(
          `/admin/verify-email?email=${encodeURIComponent(
            user.email ?? ""
          )}`
        );
        return;
      }

      setAdminEmail(user.email ?? "");
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await logoutAdmin();
    router.replace("/admin/sign-in");
  }

  if (checkingAuth) {
    return (
      <main className="admin-loading">
        <span>Loading workspace...</span>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-logo">
          <Image
            src="/logo.svg"
            width={60}
            height={20}
            alt="VeriLyft"
            priority
          />
        </Link>

        <div className="admin-header-right">
          <span className="admin-email">{adminEmail}</span>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="admin-shell">
        <section className="admin-welcome">
          <div>
            <span className="eyebrow">ADMIN / DASHBOARD</span>

            <h1>
              Good morning.
              <br />
              <em>Let's move.</em>
            </h1>

            <p>
              Manage your VeriLyft operations, orders and customers from one
              place.
            </p>
          </div>

          <div className="admin-date">
            <span>02 / OCTOBER / 2026</span>
            <strong>VERILYFT HQ</strong>
          </div>
        </section>

        <section className="admin-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="admin-stat-card" key={stat.label}>
                <div className="admin-stat-top">
                  <span>{stat.label}</span>
                  <Icon size={19} strokeWidth={1.8} />
                </div>

                <strong>{stat.value}</strong>

                <small>{stat.change}</small>
              </article>
            );
          })}
        </section>

        <section className="admin-content-grid">
          <div className="admin-panel admin-orders">
            <div className="admin-panel-heading">
              <div>
                <span className="section-label">01 / ORDERS</span>
                <h2>Recent orders</h2>
              </div>

              <Link href="/admin/orders">
                View all
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="orders-list">
              {recentOrders.map((order) => (
                <div className="order-row" key={order.id}>
                  <div className="order-id">
                    <strong>{order.id}</strong>
                    <span>{order.customer}</span>
                  </div>

                  <div className="order-service">
                    <Truck size={16} />
                    <span>{order.service}</span>
                  </div>

                  <span
                    className={`order-status ${order.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {order.status}
                  </span>

                  <strong className="order-amount">{order.amount}</strong>
                </div>
              ))}
            </div>
          </div>

          <aside className="admin-side">
            <div className="admin-panel quick-actions">
              <div className="admin-panel-heading">
                <div>
                  <span className="section-label">02 / ACTIONS</span>
                  <h2>Quick actions</h2>
                </div>
              </div>

              <Link href="/admin/orders" className="admin-action">
                <span>
                  <Package size={18} />
                  Manage orders
                </span>
                <ArrowUpRight size={17} />
              </Link>

              <Link href="/admin/customers" className="admin-action">
                <span>
                  <Users size={18} />
                  View customers
                </span>
                <ArrowUpRight size={17} />
              </Link>

              <Link href="/admin/services" className="admin-action">
                <span>
                  <ShoppingBag size={18} />
                  Manage services
                </span>
                <ArrowUpRight size={17} />
              </Link>

              <Link
                href="/admin/products"
                className="admin-action"
              >
                <span>
                  <Package size={18} />
                  Manage products
                </span>

                <ArrowUpRight size={17} />
              </Link>

              <Link href="/admin/categories" className="admin-action">
                <span>
                  <Tags size={18} />
                  Manage categories
                </span>

                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="admin-panel admin-notice">
              <span className="section-label">03 / STATUS</span>

              <div className="status-indicator">
                <span />
                All systems operational
              </div>

              <p>
                VeriLyft services are running normally. No critical issues
                require your attention.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}