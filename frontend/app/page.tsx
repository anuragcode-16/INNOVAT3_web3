'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Zap, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import NetworksMarquee from '@/components/NetworksMarquee'
import MagicBorderButton from '@/components/ui/button'
import ScrollVelocity from '@/components/ScrollVelocity'
import Link from 'next/link'
import { DotGothic16 } from 'next/font/google'

const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin'],
})

export default function HomePage() {
  const { isConnected } = useAccount()
  const isAdmin = useIsAdmin()
  const router = useRouter()

  // Auto-redirect admin to dashboard
  useEffect(() => {
    if (isConnected && isAdmin) {
      router.push('/admin/dashboard')
    }
  }, [isConnected, isAdmin, router])

  return (
    <div className="min-h-screen relative">
      {/* Content wrapper with proper z-index */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden flex items-center justify-center">
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="space-y-6">
              {/* Main Heading */}
              <h1 className={`leading-tight ${dotGothic.className}`}>
                <div className="text-6xl sm:text-7xl lg:text-7xl font-medium text-white uppercase tracking-widest">
                  Reputation Unlocks Freedom
                </div>
              </h1>
              <br />
              <h2 className={`text-2xl md:text-3xl lg:text-4xl text-white/80 uppercase tracking-[0.2em] mb-4 max-w-4xl mx-auto ${dotGothic.className}`} style={{ opacity: 1, transform: 'none' }}>
                Seamlessly On Polygon
              </h2>

              {/* CTA Buttons */}
              <div className="flex items-center justify-center mt-2">
                <Link href="/shop">
                  <MagicBorderButton>Browse Shop</MagicBorderButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Networks Section */}
        <section className="-mt-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2 open-sans text-white">
                Supported Networks
              </h2>
              <p className="text-lg text-gray-300">
                Built for the multi-chain future
              </p>
            </div>
          </div>

          <NetworksMarquee />
        </section>

        {/* Features Section - Bento Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 iceberg-regular">
                Why Choose OnStream?
              </h2>
              <p className="text-xl text-gray-300">
                The first truly under-collateralized BNPL for Web3
              </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">

              {/* Card 1 - Start with 10 USDC (Large - Left Top) */}
              <div className="md:col-span-1 lg:col-span-1 md:row-span-2">
                <div className="h-full rounded-3xl glass-card p-8 flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-pink-500/20">
                      💳
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Start with 10 USDC
                    </h3>
                    <p className="text-purple-100/70 leading-relaxed">
                      Get instant credit without collateral. No credit history required.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-pink-300/15">
                    <div className="text-sm text-purple-300/60 mb-2">INSTANT ACCESS</div>
                    <div className="text-3xl font-bold gradient-text">
                      $10 USDC
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 - Build Trust Score (Medium - Right Top) */}
              <div className="md:col-span-1 lg:col-span-1">
                <div className="rounded-3xl glass-card p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-lavender-deep to-azure-deep rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, #9b7dc8, #4a90b8)' }}>
                    ⭐
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Build Trust Score
                  </h3>
                  <p className="text-purple-100/70 leading-relaxed">
                    Earn points with every repayment. Your score unlocks higher limits.
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-purple-300/60">Score Progress</div>
                    <div className="text-xl font-bold" style={{ color: '#c8b4e8' }}>↑ 50pts</div>
                  </div>
                </div>
              </div>

              {/* Card 3 - Secure & Transparent (Medium - Right Middle) */}
              <div className="md:col-span-1 lg:col-span-1">
                <div className="rounded-3xl glass-card p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-6">
                    🔐
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Secure & Transparent
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    All transactions on Polygon. Full transparency, no hidden fees.
                  </p>
                  <div className="mt-6">
                    <div className="text-sm text-green-400 font-medium">✓ Audited & Secure</div>
                  </div>
                </div>
              </div>

              {/* Bottom Wide Card - Web3 Features */}
              <div className="md:col-span-2 lg:col-span-2">
                <div className="rounded-3xl glass-card p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <div className="text-sm text-purple-300/60 mb-2">BLOCKCHAIN</div>
                      <div className="text-2xl font-bold text-white">Polygon Amoy</div>
                      <p className="text-sm text-purple-100/50 mt-1">Low fees, fast transactions</p>
                    </div>
                    <div>
                      <div className="text-sm text-purple-300/60 mb-2">STABLECOIN</div>
                      <div className="text-2xl font-bold gradient-text">Circle USDC</div>
                      <p className="text-sm text-purple-100/50 mt-1">$1 USD backed</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <div className="text-sm text-purple-300/60 mb-2">VERIFICATION</div>
                      <div className="text-2xl font-bold gradient-text">ZK Proofs</div>
                      <p className="text-sm text-purple-100/50 mt-1">Privacy-preserving</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Scroll Velocity Section */}
        <section className="py-16 px-4 overflow-hidden">
          <div className="space-y-4">
            {/* Left to Right */}
            <ScrollVelocity
              texts={['Built for Web3 Hackathon 2026 • Powered by Polygon Amoy & Circle USDC']}
              velocity={50}
              className="text-white text-2xl font-bold"
              parallaxStyle={{ width: '100%' }}
              scrollerStyle={{ gap: '2rem' }}
            />

            {/* Right to Left */}
            <ScrollVelocity
              texts={['Built for Web3 Hackathon 2026 • Powered by Polygon Amoy & Circle USDC']}
              velocity={-50}
              className="text-white text-2xl font-bold"
              parallaxStyle={{ width: '100%' }}
              scrollerStyle={{ gap: '2rem' }}
            />
          </div>
        </section>

      </div>
    </div>
  )
}
