export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-brand-light p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white/80 p-8">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-zinc-600 mb-8">Last updated: November 6, 2025</p>
        
        <section className="space-y-6 text-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Agreement to Terms</h2>
            <p>
              By using Choosie, you agree to these Terms of Service. If you don't agree, please don't use our service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Use of Service</h2>
            <p className="mb-2">Choosie is a collaborative decision-making tool. You may:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and share lists with others</li>
              <li>Use our API integrations to find content</li>
              <li>Upgrade to Pro for premium features</li>
            </ul>
            <p className="mt-3 mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the service for illegal purposes</li>
              <li>Abuse our API rate limits</li>
              <li>Attempt to hack or compromise our systems</li>
              <li>Share your account credentials</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Subscriptions & Payments</h2>
            <p>
              Choosie Pro is a paid subscription service. Subscriptions renew automatically until canceled. 
              You can cancel anytime through your account page. Refunds are handled on a case-by-case basis.
            </p>
            <p className="mt-2">
              All payments are processed securely by Stripe. We don't store your payment information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Content & Intellectual Property</h2>
            <p>
              You own the lists and content you create. By using Choosie, you grant us permission to 
              store and display your content as necessary to provide the service.
            </p>
            <p className="mt-2">
              Content from third-party APIs (movies, books, music, recipes) is owned by their respective 
              providers and subject to their terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
            <p>
              Choosie is provided "as is" without warranties. We're not liable for any damages arising 
              from your use of the service, including data loss or service interruptions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We'll notify you of significant changes via 
              email or through the service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Termination</h2>
            <p>
              You can delete your account at any time. We may suspend or terminate accounts that violate 
              these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:hello@choosie.app" className="text-blue-600 hover:underline">
                hello@choosie.app
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
