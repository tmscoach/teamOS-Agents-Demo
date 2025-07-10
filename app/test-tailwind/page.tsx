export default function TestTailwindPage() {
  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 bg-gray-800 p-8">
        <h1 className="text-white text-2xl font-bold">Left Side</h1>
        <p className="text-gray-300 mt-4">Testing if Tailwind CSS is working properly.</p>
      </div>
      <div className="w-1/2 bg-white p-8">
        <h1 className="text-gray-900 text-2xl font-bold">Right Side</h1>
        <p className="text-gray-600 mt-4">This should show a split-screen layout if Tailwind is working.</p>
      </div>
    </div>
  )
}