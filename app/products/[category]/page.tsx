import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getCategoryBySlug } from "@/lib/repositories/categoryRepository"
import { getProductsByCategory } from "@/lib/repositories/productRepository"

const defaultPlaceholderImage = "https://images.unsplash.com/photo-1574484284002-952d92456975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";


type Props = {
    params: Promise<{
        category: string
    }>
}

export default async function ProductPage({ params }: Props) {

    const { category } = await params

    const currentCategory = await getCategoryBySlug(category)

    if (!currentCategory) {
        notFound()
    }

    const products = await getProductsByCategory(
        currentCategory.id
    )

    return (
        <main>

            <section className="catalog-header">

                <span className="eyebrow">
                    Browse
                </span>

                <h1>
                    {currentCategory.name}
                </h1>

                <p>
                    {currentCategory.description}
                </p>

            </section>

            <section className="product-grid">

                {products.map((product) => (

                    <Link
                        key={product.id}
                        href={`/products/${category}/${product.slug}`}
                        className="product-card"
                    >

                        <div className="product-card-image">

                            <Image
                                width={300}
                                height={250}
                                src={defaultPlaceholderImage}
                                // src={product.images[0]}
                                alt={product.name}
                            />

                        </div>

                        <div className="product-card-content">

                            <span className="eyebrow">
                                {currentCategory.name}
                            </span>

                            <h2>
                                {product.name}
                            </h2>

                            <strong>
                                ₦{product.price.toLocaleString()}
                            </strong>

                            <div className="my-2">

                                <span>
                                    Stock:{" "}
                                    <em>
                                        <strong>
                                            {product.stock}
                                        </strong>
                                    </em>
                                </span>

                                <h2>
                                    Features
                                </h2>

                                {product.features.map((feature) => (
                                    <span
                                        key={feature}
                                        className="mr-3"
                                    >
                                        {feature}
                                    </span>
                                ))}

                            </div>

                        </div>

                    </Link>

                ))}

            </section>

            <section className="product-bottom">

                <div>

                    <span className="eyebrow">
                        Simple. Fast. Reliable.
                    </span>

                    <h2>
                        Everything you need,
                        <br />
                        without the complexity.
                    </h2>

                </div>

                <p>
                    We make moving products and packages easier by
                    combining simple technology with dependable
                    logistics.
                </p>

            </section>

        </main>
    )
}