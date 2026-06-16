import PricingSection from '@/app/components/home-components/PricingSection'

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-center text-white shadow-2xl sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Bundles & service packages</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Simple packages for accessories, protection and support.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Instead of confusing pricing plans, Mobisphere offers practical bundles that match real mobile shop needs.</p>
      </section>
      <PricingSection />
    </main>
  )
}
