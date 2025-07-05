import Hero from '@/components/Hero'
import Features from '@/components/Features'
import FAQ from '@/components/FAQ'
import ContactForm from '@/components/ContactForm'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <ContactForm />
    </main>
  )
}