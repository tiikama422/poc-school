'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'Simply sign up for an account and start exploring our features. Our dashboard provides everything you need to get started quickly.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use Supabase for authentication and data storage, which provides enterprise-grade security and compliance.',
    },
    {
      question: 'Can I customize the application?',
      answer: 'Absolutely! The application is built with modern web technologies and follows best practices for easy customization.',
    },
    {
      question: 'What technologies are used?',
      answer: 'This application is built with Next.js 14, Supabase, Tailwind CSS, and is optimized for performance and scalability.',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our platform.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex justify-between items-center">
                  <span>{faq.question}</span>
                  <span className="text-2xl">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}