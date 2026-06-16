import Link from 'next/link'

const values = [
  ['Genuine stock', 'Verified smartphones and accessories from trusted sources.'],
  ['Clear guidance', 'We help customers choose models based on real needs and budget.'],
  ['After-sales support', 'Mobisphere supports customers even after checkout.'],
]

export default function AboutUsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_420px] lg:items-center lg:p-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">About Mobisphere</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">A premium mobile store with local trust.</h1>
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Mobisphere started with a simple idea: make mobile shopping in Sangli trustworthy, fast and helpful with genuine devices, clear pricing and personal guidance.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/product" className="rounded-full bg-emerald-400 px-7 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">Explore products</Link>
              <Link href="/enquiry" className="rounded-full border border-white/15 bg-white/10 px-7 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/15">Contact store</Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400 text-2xl font-black text-slate-950">MW</div>
            <h2 className="mt-5 text-2xl font-black">Siddharth Raju Waghmare</h2>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Chairman & Managing Director</p>
            <p className="mt-5 text-sm font-semibold leading-7 text-slate-300">Leading Mobisphere with a commitment to genuine products, transparent service and responsive customer support.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {values.map(([title, text]) => (
          <article key={title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300">✓</div>
            <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Mission & vision</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Technology advice that feels personal.</h2>
          <div className="mt-6 space-y-4 text-sm font-semibold leading-7 text-slate-600">
            <p>Our mission is to provide the best technology and support so customers feel confident before and after buying a phone.</p>
            <p>Our vision is to become Sangli&apos;s most trusted mobile partner for genuine products, transparent pricing and quick local service.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="bg-slate-950 p-6 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Contact & location</p>
            <h2 className="mt-3 text-3xl font-black">Visit Mobisphere</h2>
          </div>
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-5 p-6 text-sm font-semibold leading-7 text-slate-600">
              <div><p className="font-black text-slate-950">Address</p><p>Near Sangli Municipal Corporation, Sangli, Maharashtra</p></div>
              <div><p className="font-black text-slate-950">Phone</p><p>+91 72497 38821</p></div>
              <div><p className="font-black text-slate-950">Email</p><p>support@mobisphere.com</p></div>
              <div><p className="font-black text-slate-950">Hours</p><p>Mon - Sat, 10:00 AM - 10:00 PM</p></div>
            </div>
            <iframe
              title="Mobisphere Sangli Location"
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d61094.935553644216!2d74.58410011673539!3d16.854438372008616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1ssangli%20municipal%20corporation!5e0!3m2!1sen!2sin!4v1780394066872!5m2!1sen!2sin"
              width="600"
              height="360"
              style={{ border: 0, width: '100%', minHeight: 360 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  )
}
