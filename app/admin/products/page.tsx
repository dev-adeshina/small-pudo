"use client"

import Link from "next/link"
import Image from "next/image"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  onAuthStateChanged,
} from "firebase/auth"

import {
  ArrowLeft,
  LogOut,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"

import { useRouter } from "next/navigation"

import { auth } from "@/lib/firebase"
import { logoutAdmin } from "@/lib/auth"

import type { Category } from "@/lib/types/category"
import type { Product } from "@/lib/types/product"

import {
  getCategories,
} from "@/lib/firebase/categories"

import {
  getProducts,
} from "@/lib/firebase/products"

import { ProductForm } from "@/components/admin/products/product-form"
import { ProductTable } from "@/components/admin/products/product-table"
import { DeleteProductDialog } from "@/components/admin/products/delete-product-dialog"

export default function ProductsPage() {
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] =
    useState(true)

  const [adminEmail, setAdminEmail] =
    useState("")

  const [products, setProducts] =
    useState<Product[]>([])

  const [categories, setCategories] =
    useState<Category[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [categoryFilter, setCategoryFilter] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState("all")

  const [showForm, setShowForm] =
    useState(false)

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null)

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null)

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            router.replace(
              "/admin/sign-in"
            )
            return
          }

          if (!user.emailVerified) {
            router.replace(
              `/admin/verify-email?email=${encodeURIComponent(
                user.email ?? ""
              )}`
            )
            return
          }

          setAdminEmail(
            user.email ?? ""
          )

          setCheckingAuth(false)
        }
      )

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!checkingAuth) {
      loadData()
    }
  }, [checkingAuth])

  async function loadData() {
    setLoading(true)
    setError("")

    try {
      const [
        productData,
        categoryData,
      ] = await Promise.all([
        getProducts(),
        getCategories(),
      ])

      setProducts(productData)
      setCategories(categoryData)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase()

      return products.filter(
        (product) => {
          const matchesSearch =
            !term ||
            product.name
              .toLowerCase()
              .includes(term) ||
            product.slug
              .toLowerCase()
              .includes(term)

          const matchesCategory =
            !categoryFilter ||
            product.categoryId ===
              categoryFilter

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" &&
              product.isActive) ||
            (statusFilter ===
              "inactive" &&
              !product.isActive)

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          )
        }
      )
    }, [
      products,
      search,
      categoryFilter,
      statusFilter,
    ])

  function openCreateForm() {
    setEditingProduct(null)
    setShowForm(true)
    setMessage("")
  }

  function openEditForm(
    product: Product
  ) {
    setEditingProduct(product)
    setShowForm(true)
    setMessage("")
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
  }

  function handleSaved(
    product: Product
  ) {
    setProducts((current) => {
      const exists = current.some(
        (item) =>
          item.id === product.id
      )

      if (exists) {
        return current.map(
          (item) =>
            item.id === product.id
              ? product
              : item
        )
      }

      return [product, ...current]
    })

    closeForm()

    setMessage(
      editingProduct
        ? "Product updated successfully."
        : "Product created successfully."
    )
  }

  function handleChanged(
    product: Product
  ) {
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? product
          : item
      )
    )
  }

  function handleDeleted(
    id: string
  ) {
    setProducts((current) =>
      current.filter(
        (product) =>
          product.id !== id
      )
    )

    setDeletingProduct(null)

    setMessage(
      "Product deleted successfully."
    )
  }

  async function handleLogout() {
    await logoutAdmin()
    router.replace(
      "/admin/sign-in"
    )
  }

  if (checkingAuth) {
    return (
      <main className="admin-loading">
        <span>
          Loading workspace...
        </span>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link
          href="/"
          className="admin-logo"
        >
          <Image
            src="/logo.svg"
            width={60}
            height={20}
            alt="VeriLyft"
            priority
          />
        </Link>

        <div className="admin-header-right">
          <span className="admin-email">
            {adminEmail}
          </span>

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

      <div className="admin-shell product-admin-shell">
        <section className="product-admin-heading">
          <div>
            <span className="eyebrow">
              ADMIN / PRODUCTS
            </span>

            <h1>
              Product
              <br />
              <em>management.</em>
            </h1>

            <p>
              Manage your catalogue,
              inventory and product
              visibility from one place.
            </p>
          </div>

          <div className="product-admin-heading-side">
            <Link
              href="/admin"
              className="category-back-link"
            >
              <ArrowLeft size={14} />
              Dashboard
            </Link>

            <strong>
              {products.length} PRODUCTS
            </strong>
          </div>
        </section>

        {message && (
          <div className="category-message category-message-success">
            <div>
              <CheckCircle2 size={15} />
              {message}
            </div>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {error && (
          <div className="category-message category-message-error">
            <div>
              <AlertCircle size={15} />
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section className="admin-panel product-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="section-label">
                01 / CATALOGUE
              </span>

              <h2>
                Products
              </h2>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="category-add-button"
            >
              <Plus size={15} />
              Add product
            </button>
          </div>

          <div className="product-toolbar">
            <div className="product-search">
              <Search size={15} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              className="product-filter"
            >
              <option value="">
                All categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="product-filter"
            >
              <option value="all">
                All status
              </option>
              <option value="active">
                Active
              </option>
              <option value="inactive">
                Inactive
              </option>
            </select>

            <span className="category-result-count">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}
            </span>
          </div>

          {loading ? (
            <div className="category-loading">
              <Loader2
                size={18}
                className="category-spinner"
              />
              Loading products...
            </div>
          ) : (
            <ProductTable
              products={
                filteredProducts
              }
              categories={categories}
              onEdit={
                openEditForm
              }
              onDelete={
                setDeletingProduct
              }
              onChanged={
                handleChanged
              }
            />
          )}
        </section>
      </div>

      {showForm && (
        <div className="category-modal-backdrop">
          <div className="category-modal product-modal">
            <div className="category-modal-header">
              <div>
                <span className="section-label">
                  PRODUCT /{" "}
                  {editingProduct
                    ? "EDIT"
                    : "NEW"}
                </span>

                <h2>
                  {editingProduct
                    ? "Edit product"
                    : "Add product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update this product's catalogue information."
                    : "Add a new product to your catalogue."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="category-modal-close"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="category-modal-body">
              <ProductForm
                product={
                  editingProduct
                }
                categories={
                  categories
                }
                onSuccess={
                  handleSaved
                }
                onCancel={
                  closeForm
                }
              />
            </div>
          </div>
        </div>
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={
            deletingProduct
          }
          onDeleted={
            handleDeleted
          }
          onCancel={() =>
            setDeletingProduct(
              null
            )
          }
        />
      )}
    </main>
  )
}