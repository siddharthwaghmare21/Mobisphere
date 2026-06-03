import PricingSection from '@/app/components/home-components/PricingSection'

export default function PricingPage() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Pricing</p>
                <h1 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
                    Pricing plans for every iPhone shopper
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    Explore our transparent pricing and choose the best package for your mobile purchase.
                </p>
            </div>
            <div className="mt-12">
                <PricingSection />
            </div>
        </main>
    )
}
