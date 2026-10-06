"use client"

import { FormEvent } from "react"

export default function ContactPage() {
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    alert("Message submitted successfully.")
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <span className="eyebrow">Contact us</span>

        <h1>
          Let's talk about
          <br />
          what you need.
        </h1>

        <p>
          Have a question, need help with a delivery, or
          want to work with us? Send us a message.
        </p>
      </section>

      <section className="contact-layout">
        <div className="contact-details">
          <div>
            <span className="eyebrow">Email</span>

            <h3>hello@example.com</h3>
          </div>

          <div>
            <span className="eyebrow">Phone</span>

            <h3>+234 800 000 0000</h3>
          </div>

          <div>
            <span className="eyebrow">Location</span>

            <h3>Lagos, Nigeria</h3>
          </div>

          <div className="contact-note">
            <strong>Need help quickly?</strong>

            <p>
              Send us your order number when contacting
              support so we can assist you faster.
            </p>
          </div>
        </div>

        <form
          className="contact-form"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <label>
              Name

              <input
                type="text"
                name="name"
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Email

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <label>
            Subject

            <input
              type="text"
              name="subject"
              placeholder="What can we help with?"
              required
            />
          </label>

          <label>
            Message

            <textarea
              name="message"
              rows={7}
              placeholder="Tell us what you need..."
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
          >
            Send message
          </button>
        </form>
      </section>
    </main>
  )
}