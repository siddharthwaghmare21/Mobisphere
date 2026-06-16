import Link from 'next/link'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Contact Mobisphere</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Need help choosing or repairing a phone?</h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">Contact Mobisphere for product guidance, service enquiries, accessories, delivery support and store location details.</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">Store details</h2>
          <div className="mt-6 space-y-5 text-sm font-semibold leading-7 text-slate-600">
            <div><p className="font-black text-slate-950">Address</p><p>Near Sangli Municipal Corporation, Sangli, Maharashtra</p></div>
            <div><p className="font-black text-slate-950">Phone</p><p>+91 72497 38821</p></div>
            <div><p className="font-black text-slate-950">Email</p><p>support@mobisphere.com</p></div>
            <div><p className="font-black text-slate-950">Hours</p><p>Mon - Sat, 10:00 AM - 10:00 PM</p></div>
          </div>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/enquiry" className="rounded-full bg-emerald-400 px-6 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300">Send enquiry</Link>
            <Link href="/about-us" className="rounded-full bg-slate-950 px-6 py-3 text-center text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-1 hover:bg-slate-800">About store</Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <iframe
            title="Mobisphere Sangli Location"
            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d61094.935553644216!2d74.58410011673539!3d16.854438372008616!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1ssangli%20municipal%20corporation!5e0!3m2!1sen!2sin!4v1780394066872!5m2!1sen!2sin"
            width="600"
            height="520"
            style={{ border: 0, width: '100%', minHeight: 520 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
  )
}
