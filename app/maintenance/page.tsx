export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="space-y-6">
          <h1 className="text-6xl font-bold text-black">
            Under Maintenance
          </h1>

          <p className="text-xl text-gray-600 font-medium">
            We're making some improvements.
          </p>

          <p className="text-gray-600">
            The site will be back shortly. Thank you for your patience.
          </p>

          <div className="pt-8">
            <div className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg">
              Coming back soon
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
