import { cn } from "@/lib/utils";
import { ReactNode, CSSProperties } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
}

const Marquee = ({
  children,
  className,
  pauseOnHover = false,
  reverse = false,
}: MarqueeProps) => {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden",
        className
      )}
      style={
        {
          "--duration": "20s",
          "--animation": reverse
            ? "scroll-left"
            : "scroll-right",
        } as CSSProperties
      }
    >
      <style>{`
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% - 16px));
          }
        }

        @keyframes scroll-right {
          from {
            transform: translateX(calc(-100% - 16px));
          }
          to {
            transform: translateX(0);
          }
        }

        .marquee-animate {
          animation: scroll-right var(--duration) linear infinite;
        }

        .marquee-animate-reverse {
          animation: scroll-left var(--duration) linear infinite;
        }

        ${pauseOnHover ? `.group:hover .marquee-animate { animation-play-state: paused; }` : ""}
      `}</style>

      <div
        className={cn(
          "flex gap-4 w-fit",
          reverse ? "marquee-animate-reverse" : "marquee-animate"
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
};

export { Marquee };
