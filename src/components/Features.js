export default function Features() {
  const features = [
    {
      title: 'Next.js 14 App Router',
      description: 'Built with the latest Next.js features for optimal performance and developer experience.',
      icon: '⚡',
    },
    {
      title: 'Supabase Authentication',
      description: 'Secure user authentication and session management with Supabase.',
      icon: '🔐',
    },
    {
      title: 'Modern UI/UX',
      description: 'Beautiful, responsive design with Tailwind CSS and modern best practices.',
      icon: '🎨',
    },
  ]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to build modern web applications with confidence.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}