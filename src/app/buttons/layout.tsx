export default function ButtonsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Button Component Documentation</h1>
        </div>
      </header>

      <main>
        {children}
      </main>
      
      <footer className="border-t mt-10 py-6 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          <p>AtoZ English UI Components</p>
        </div>
      </footer>
    </div>
  )
} 