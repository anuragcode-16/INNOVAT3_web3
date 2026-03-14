'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Poppins } from 'next/font/google'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { LayoutDashboard, ShoppingBag, CreditCard, Wallet, Copy, LogOut } from 'lucide-react'
import { ReactNode } from 'react'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

interface NavItem {
  name: string
  link: string
  icon?: ReactNode
}

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems?: NavItem[]
  className?: string
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const isAdmin = useIsAdmin()
  const router = useRouter()

  React.useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }, [isConnected, router])

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1
    if (index === hoveredIndex) {
      return 1.2
    }
    return 1
  }

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      // Successfully copied
    } catch {
      // Failed to copy
    }
  }

  const handleConnectWallet = () => {
    // Find MetaMask connector
    const metaMaskConnector = connectors.find(
      (connector) => connector.id === 'io.metamask' || connector.name === 'MetaMask'
    )

    if (metaMaskConnector) {
      // Directly connect to MetaMask
      connect({ connector: metaMaskConnector })
    } else {
      // Fallback to first available connector if MetaMask not found
      if (connectors[0]) {
        connect({ connector: connectors[0] })
      }
    }
  }

  // Default nav items if not provided
  const defaultNavItems = isConnected
    ? isAdmin
      ? [
        { name: 'Dashboard', link: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: 'Loans', link: '/admin/loans', icon: <CreditCard className="w-4 h-4" /> },
        { name: 'Liquidity', link: '/admin/liquidity', icon: <Wallet className="w-4 h-4" /> },
      ]
      : [
        { name: 'Dashboard', link: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: 'Shop', link: '/shop', icon: <ShoppingBag className="w-4 h-4" /> },
      ]
    : []

  const items = navItems || defaultNavItems

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 0,
          y: -100,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.8,
          type: 'spring',
          stiffness: 50,
          damping: 15,
        }}
        className={cn(
          'fixed top-[26px] left-1/2 -translate-x-1/2 w-full max-w-4xl border border-purple-300/20 rounded-3xl glass-nav z-50 px-6 py-3 flex items-center justify-between space-x-4 relative overflow-hidden transition-all duration-300 hover:border-purple-300/40 hover:shadow-xl hover:shadow-purple-500/10',
          className,
        )}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 z-[-1] bg-gradient-to-r from-pink-500/5 via-purple-400/8 to-blue-400/5 rounded-3xl"
          animate={{
            scale: [1, 1.03, 0.97, 1.02, 1],
            y: [0, -2, 3, -2, 0],
            rotate: [0, 0.5, -0.5, 0.3, 0],
            opacity: [0.3, 0.5, 0.4, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        />

        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="OnStream Logo"
            width={32}
            height={32}
            priority
          />
          <span className={cn('text-lg font-semibold text-white hidden sm:inline', poppins.className)}>
            OnStream
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
          {items.map((navItem: NavItem, idx: number) => (
            <motion.div
              key={`link-${idx}`}
              onHoverStart={() => setHoveredIndex(idx)}
              onHoverEnd={() => setHoveredIndex(null)}
              animate={{ scale: getScale(idx) }}
            >
              <Link
                href={navItem.link}
                className="relative text-white/70 hover:text-pink-200 items-center flex space-x-1 text-sm font-medium transition-all duration-200 group after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-pink-400 after:via-purple-400 after:to-blue-400 hover:after:w-full after:transition-all after:duration-300"
              >
                {navItem.icon && <span className="group-hover:scale-110 transition-transform">{navItem.icon}</span>}
                <span>{navItem.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Wallet Connection Section */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={handleConnectWallet}
                          className="btn-glow border border-purple-400/30 bg-purple-500/10 text-white text-sm px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Connect Wallet</span>
                        </button>
                      );
                    }

                    // Always show disconnect button when connected
                    return (
                      <button
                        onClick={() => disconnect()}
                        className="border border-pink-400/30 bg-pink-500/10 text-white hover:bg-red-500/20 hover:border-red-500/50 text-sm px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
