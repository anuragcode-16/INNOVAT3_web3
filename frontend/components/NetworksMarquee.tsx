import Marquee from "react-fast-marquee";
import Image from "next/image";

export default function NetworksMarquee() {
    const networks = [
        { name: "Ethereum", symbol: "ETH", src: "/logos/ethereum-eth-logo.png" },
        { name: "Bitcoin", symbol: "BTC", src: "/logos/Bitcoin-Logo.png" },
        { name: "Polygon", symbol: "MATIC", src: "/logos/Polygon_blockchain_logo.png" },
        { name: "Solana", symbol: "SOL", src: "/logos/Solana_logo.png" },
        { name: "BNB Chain", symbol: "BNB", src: "/logos/bnb-bnb-logo.png" },
        { name: "Celo", symbol: "CELO", src: "/logos/celo-celo-logo.png" },
    ];

    return (
        <section className="w-full overflow-hidden py-10">
            {/* Networks Marquee */}
            <Marquee
                speed={50}
                pauseOnHover
                autoFill
                loop={0}
                gradient={false}
                className="[--gap:4rem]"
            >
                {networks.map((network) => (
                    <div
                        key={network.symbol}
                        className="flex flex-col items-center justify-center space-y-3 px-12 cursor-pointer hover:scale-110 transition-transform duration-500"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 relative">
                            <Image
                                src={network.src}
                                alt={network.name}
                                fill
                                className="object-contain"
                                priority={false}
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-bold text-white">
                                {network.symbol}
                            </p>
                            <p className="text-xs text-gray-400">
                                {network.name}
                            </p>
                        </div>
                    </div>
                ))}
            </Marquee>
        </section>
    );
}
