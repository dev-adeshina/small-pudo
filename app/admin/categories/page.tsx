"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  LogOut,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { logoutAdmin } from "@/lib/auth";

import type { Category } from "@/lib/types/category";

import {
  getCategories,
  getCategoryProductCounts,
} from "@/lib/firebase/categories";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { CategoryTable } from "@/components/admin/categories/category-table";
import { DeleteCategoryDialog } from "@/components/admin/categories/delete-category-dialog";

export default function CategoriesPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] =
    useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [deletingCategory, setDeletingCategory] =
    useState<Category | null>(null);

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

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const data = await getCategories();

      setCategories(data);

      const counts = await getCategoryProductCounts(data);

      setProductCounts(counts);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) {
      loadCategories();
    }
  }, [checkingAuth]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.slug.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term)
    );
  }, [categories, search]);

  function openCreateForm() {
    setEditingCategory(null);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function openEditForm(category: Category) {
    setEditingCategory(category);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
  }

  function handleSaved(category: Category) {
    setCategories((current) => {
      const exists = current.some(
        (item) => item.id === category.id
      );

      if (exists) {
        return current
          .map((item) =>
            item.id === category.id ? category : item
          )
          .sort((a, b) => a.name.localeCompare(b.name));
      }

      return [...current, category].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    closeForm();

    setMessage(
      editingCategory
        ? "Category updated successfully."
        : "Category created successfully."
    );
  }

  function handleStatusChanged(updated: Category) {
    setCategories((current) =>
      current.map((category) =>
        category.id === updated.id ? updated : category
      )
    );

    setMessage(
      updated.isActive
        ? "Category activated."
        : "Category deactivated."
    );
  }

  function handleDeleted(id: string) {
    setCategories((current) =>
      current.filter((category) => category.id !== id)
    );

    setProductCounts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    setDeletingCategory(null);

    setMessage("Category deleted successfully.");
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
      {/* =====================================================
          ADMIN HEADER
          ===================================================== */}

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

      {/* =====================================================
          CATEGORY CONTENT
          ===================================================== */}

      <div className="admin-shell category-shell">
        <section className="category-page-heading">
          <div>
            <span className="eyebrow">
              ADMIN / CATEGORIES
            </span>

            <h1>
              Product
              <br />
              <em>categories.</em>
            </h1>

            <p>
              Create, update and manage the categories used
              across the VeriLyft product catalogue.
            </p>
          </div>

          <div className="category-heading-side">
            <Link
              href="/admin"
              className="category-back-link"
            >
              <ArrowLeft size={15} />
              Dashboard
            </Link>

            <strong>
              {categories.length}{" "}
              {categories.length === 1
                ? "CATEGORY"
                : "CATEGORIES"}
            </strong>
          </div>
        </section>

        {/* =====================================================
            MESSAGE
            ===================================================== */}

        {message && (
          <div className="category-message category-message-success">
            <div>
              <CheckCircle2 size={17} />
              <span>{message}</span>
            </div>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="category-message category-message-error">
            <div>
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =====================================================
            CATEGORY PANEL
            ===================================================== */}

        <section className="admin-panel category-panel">
          <div className="admin-panel-heading category-panel-heading">
            <div>
              <span className="section-label">
                01 / CATALOGUE
              </span>

              <h2>Categories</h2>
            </div>

            <button
              type="button"
              className="category-add-button"
              onClick={openCreateForm}
            >
              <Plus size={17} />
              Add category
            </button>
          </div>

          {/* Search */}

          <div className="category-toolbar">
            <div className="category-search">
              <Search size={17} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search categories..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <span className="category-result-count">
              {filteredCategories.length}{" "}
              {filteredCategories.length === 1
                ? "result"
                : "results"}
            </span>
          </div>

          {/* Table */}

          {loading ? (
            <div className="category-loading">
              <Loader2 size={20} className="category-spinner" />
              <span>Loading categories...</span>
            </div>
          ) : (
            <CategoryTable
              categories={filteredCategories}
              productCounts={productCounts}
              onEdit={openEditForm}
              onDelete={setDeletingCategory}
              onStatusChanged={handleStatusChanged}
            />
          )}
        </section>
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
          ===================================================== */}

      {showForm && (
        <div
          className="category-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div className="category-modal-header">
              <div>
                <span className="section-label">
                  {editingCategory
                    ? "02 / EDIT"
                    : "02 / NEW CATEGORY"}
                </span>

                <h2 id="category-modal-title">
                  {editingCategory
                    ? "Edit category"
                    : "Add category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update the information for this category."
                    : "Create a new category for your product catalogue."}
                </p>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={closeForm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="category-modal-body">
              <CategoryForm
                category={editingCategory}
                onSuccess={handleSaved}
                onCancel={closeForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE MODAL
          ===================================================== */}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          onDeleted={handleDeleted}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </main>
  );
}