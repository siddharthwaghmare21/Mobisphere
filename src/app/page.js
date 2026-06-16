import Link from 'next/link'
import BackgroundHomeImage from './components/home-components/BackgroundHomeImage'
import BannerSection from './components/home-components/BannerSection'
import OfferBannerHomePage from './components/home-components/OfferBannerHomePage'
import PricingSection from './components/home-components/PricingSection'
import LatestProduct from './components/home-components/LatestProduct'
import OtherFacilities from './components/home-components/OtherFacilities'

const categories = [
  { name: 'Apple iPhone', icon: '', text: 'Premium Pro Max models and flagship devices.' },
  { name: 'Accessories', icon: '🎧', text: 'Cases, chargers, protectors and everyday essentials.' },
  { name: 'Service Support', icon: '🔧', text: 'Repair enquiry, diagnostics and product guidance.' },
]

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <BackgroundHomeImage />

      <section className="grid gap-4 sm:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.name} href={category.name === 'Service Support' ? '/enquiry' : '/product'} className="group rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-white shadow-lg transition group-hover:bg-emerald-400 group-hover:text-slate-950">{category.icon}</div>
            <h2 className="mt-5 text-xl font-black text-slate-950">{category.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{category.text}</p>
          </Link>
        ))}
      </section>

      <OfferBannerHomePage />
      <BannerSection />
      <LatestProduct />
      <OtherFacilities />
      <PricingSection />

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Mobisphere account</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Login, manage profile, and keep shopping faster.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">Your profile, delivery details, order flow and enquiry support are available from one clean account area.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/menu" className="inline-flex justify-center rounded-full bg-slate-950 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-slate-800">Open My Profile</Link>
              <Link href="/cart" className="inline-flex justify-center rounded-full border border-slate-200 bg-slate-50 px-7 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-white">View Cart</Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">Quick flow</p>
            <div className="mt-5 space-y-3">
              {['Browse premium phones', 'Add products to cart', 'Confirm delivery details', 'Get support anytime'].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-slate-950">{index + 1}</span>
                  <span className="text-sm font-bold text-slate-200">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
