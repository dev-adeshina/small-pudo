'use Client';

import Image from 'next/image';
import Link from "next/link"


export default function AboutPage() {
    return (
        <main>
            

            <section className="about-hero">
                <div>
                    <span className="eyebrow">
                        About us
                    </span>

                    <h1>
                        Moving what matters,
                        <br />
                        made simple.
                    </h1>

                    <p>
                        We are building a simpler way for people and
                        businesses to move products, packages and
                        services from one place to another.
                    </p>
                </div>

                <div className="about-hero-card">
                    <span>01</span>

                    <h3>People first</h3>

                    <p>
                        Technology should make logistics easier,
                        not make people work harder.
                    </p>
                </div>
            </section>

            <section className="about-story">
                <div>
                    <span className="eyebrow">Our story</span>

                    <h2>
                        Logistics shouldn't feel complicated.
                    </h2>
                </div>

                <div>
                    <p>
                        Getting something from one location to another
                        should be simple. But fragmented services,
                        unclear processes and unreliable communication
                        can make everyday delivery unnecessarily
                        difficult.
                    </p>

                    <p>
                        Our goal is to bring those pieces together
                        through a straightforward digital experience.
                    </p>
                </div>
            </section>

            <section className="about-values">
                <div className="section-heading">
                    <span className="eyebrow">
                        What we believe
                    </span>

                    <h2>
                        Simple principles.
                        <br />
                        Better experiences.
                    </h2>
                </div>

                <div className="values-grid">
                    <article>
                        <span>01</span>
                        <h3>Reliability</h3>
                        <p>
                            People should be able to depend on the
                            services they use.
                        </p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Simplicity</h3>
                        <p>
                            Complex logistics should feel simple from
                            the customer's perspective.
                        </p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Transparency</h3>
                        <p>
                            Customers should always understand what is
                            happening with their orders.
                        </p>
                    </article>
                </div>
            </section>

            <section className="about-cta">
                <div>
                    <span className="eyebrow">Let's move</span>

                    <h2>
                        Have something
                        <br />
                        to send?
                    </h2>
                </div>

                <Link
                    href="/contact"
                    className="btn btn-dark"
                >
                    Get in touch
                </Link>
            </section>

        </main>


    );
}

