import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/firebase/products";
import { getCategory } from "@/lib/firebase/categories";
// import { getCategoryById } from "@/lib/firebase/categories";
import ProductGallery from "./product-gallery";
import ProductActions from "./product-actions";


interface ProductDetailsPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { category, slug } = await params;

  const product = await getProductBySlug(slug);


  if (!product || !product.isActive) {
    notFound();
  }

  const productCategory = await getCategory(product.categoryId);

  if (!productCategory || productCategory.slug !== category) {
    notFound();
  }

  return (
    <main className="product-details-page">
      <div className="container">
        <div className="product-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>

          <Link href={`/products/${productCategory.slug}`}>
            {productCategory.name}
          </Link>

          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-details">
          <ProductGallery
            images={product.images}
            productName={product.name}
          />

          <section className="product-information">
            <Link
              href={`/products/${productCategory.slug}`}
              className="product-category"
            >
              {productCategory.name}
            </Link>

            <h1>{product.name}</h1>

            <p className="product-price">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: product.currency || "NGN",
                maximumFractionDigits: 0,
              }).format(product.price)}
            </p>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            {product.features?.length > 0 && (
              <div className="product-features">
                <h2>Features</h2>

                <ul>
                  {product.features.map((feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {/* <ProductActions product={product} /> */}
            <ProductActions
              productId={product.id}
              name={product.name}
              slug={product.slug}
              categoryId={product.categoryId}
              price={product.price}
              currency={product.currency}
              images={product.images}
              stock={product.stock}
            />

          </section>
        </div>
      </div>
    </main>
  );
}