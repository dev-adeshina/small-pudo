import Link from "next/link";

import { getCategories } from "@/lib/firebase/categories";
import { getProducts } from "@/lib/firebase/products";

const fallbackImage =
  "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80";

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

export default async function ProductsPage() {
  const [allCategories, allProducts] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const categories = allCategories.filter(
    (category) => category.isActive
  );

  const products = allProducts.filter(
    (product) => product.isActive
  );

  const featuredProducts = products.filter(
    (product) => product.featured
  );

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Shop introduction */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
          <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="transition hover:text-red-600">
              Home
            </Link>

            <span>/</span>

            <span className="text-neutral-900">Shop</span>
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
            Discover our marketplace
          </span>

          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Find what you need.
                <span className="block text-red-600">
                  Shop with ease.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">
                Explore products across our marketplace and find
                the things that make everyday life easier.
              </p>
            </div>

            <div className="text-sm text-neutral-500">
              {products.length}{" "}
              {products.length === 1 ? "product" : "products"} available
            </div>
          </div>
        </div>
      </section>

      {/* Category menu */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Explore
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Shop by category
              </h2>
            </div>

            <span className="hidden text-sm text-neutral-500 sm:block">
              Find your next favourite
            </span>
          </div>

          <nav
            aria-label="Product categories"
            className="flex gap-3 overflow-x-auto pb-3"
          >
            <Link
              href="/products"
              aria-current="page"
              className="shrink-0 rounded-full border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 hover:border-red-600"
            >
              All products
            </Link>

            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="shrink-0 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition hover:border-red-600 hover:text-red-600"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Product catalogue */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Our collection
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {featuredProducts.length > 0
                ? "Featured products"
                : "Explore our products"}
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Discover products selected for your everyday needs.
            </p>
          </div>

          <span className="text-sm text-neutral-500">
            Showing {products.length}{" "}
            {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-20 text-center">
            <h3 className="text-xl font-semibold">
              No products available yet
            </h3>

            <p className="mt-3 text-sm text-neutral-500">
              Please check back later for new products.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const category = categories.find(
                (item) => item.id === product.categoryId
              );

              const image =
                product.images.find(
                  (item) =>
                    item.startsWith("https://") ||
                    item.startsWith("http://") ||
                    item.startsWith("/")
                ) || fallbackImage;

              return (
                <article
                  key={product.id}
                  className="group min-w-0"
                >
                  <Link
                    href={`/products/${category?.slug ?? "category"}/${product.slug}`}
                    className="block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      {product.featured && (
                        <span className="absolute left-3 top-3 rounded-full bg-yellow-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-900">
                          Featured
                        </span>
                      )}

                      {product.stock <= 0 && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-700">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <div className="pt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {category?.name ?? "Marketplace"}
                      </p>

                      <h3 className="mt-2 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-neutral-900 transition group-hover:text-red-600 sm:text-base">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-bold sm:text-lg">
                          {formatPrice(
                            product.price,
                            product.currency || "NGN"
                          )}
                        </p>

                        {product.stock > 0 && (
                          <span className="text-xs text-neutral-500">
                            In stock
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <span className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-900 px-3 py-3 text-xs font-semibold transition group-hover:border-red-600 group-hover:bg-red-600 group-hover:text-white sm:text-sm">
                          View product
                          <span className="ml-2" aria-hidden="true">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Marketplace footer banner */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8 md:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
              Simple. Fast. Reliable.
            </p>

            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need, all in one place.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-400">
              Browse our marketplace, discover products, and find
              what works for you.
            </p>
          </div>

          <Link
            href="#"
            className="inline-flex w-fit items-center gap-3 rounded-lg bg-yellow-400 px-6 py-4 text-sm font-bold text-neutral-950 transition hover:bg-yellow-300"
          >
            Explore the marketplace
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}