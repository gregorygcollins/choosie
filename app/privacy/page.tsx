export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white/80 p-8">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-zinc-600 mb-8">Last updated: November 6, 2025</p>
        
        <section className="space-y-6 text-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold mb-3">What We Collect</h2>
            <p className="mb-2">When you use Choosie, we collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Account information (name, email) when you sign in with Google or GitHub</li>
              <li>Lists you create and items you add</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Usage data to improve the service</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">How We Use Your Data</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and improve Choosie</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important service updates</li>
              <li>Respond to support requests</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data. All connections are encrypted with HTTPS, 
              and sensitive data is stored securely in our database.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
            <p className="mb-2">Choosie integrates with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Google/GitHub:</strong> For authentication</li>
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>TMDB, Spotify, Google Books, Spoonacular:</strong> For content suggestions</li>
            </ul>
            <p className="mt-2">Each service has its own privacy policy that governs how they handle your data.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
            <p className="mb-2">You can:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your data at any time through your account</li>
              <li>Delete your account and all associated data</li>
              <li>Export your lists</li>
              <li>Opt out of optional communications</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
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
