import * as React from "react"
import { useState, useRef } from "react";
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, onClick, onSuccess, particleDuration = 700, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const innerRef = useRef(null);
  const [showParticles, setShowParticles] = useState(false);

  function setRef(node) {
    innerRef.current = node;
    if (!ref) return;
    if (typeof ref === "function") ref(node);
    else ref.current = node;
  }

  const handleClick = (e) => {
    // Call the onClick callback immediately so consumers get the event
    if (typeof onClick === 'function') {
      try { onClick(e); } catch (err) { console.error(err); }
    }
    // show particles
    setShowParticles(true);
    setTimeout(() => {
      setShowParticles(false);
      // Call onSuccess after the particle animation completes
      if (typeof onSuccess === 'function') {
        try { onSuccess(); } catch (err) { console.error(err); }
      }
    }, particleDuration);
  };

  // Success particle renderer (uses fixed positions based on button rect)
  function SuccessParticles({ buttonRef }) {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return (
      <AnimatePresence>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="fixed w-1 h-1 bg-black dark:bg-white rounded-full"
            style={{ left: centerX, top: centerY }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: [0, (i % 2 ? 1 : -1) * (Math.random() * 50 + 20)],
              y: [0, -Math.random() * 50 - 20],
            }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    );
  }

  return (
    <>
      {showParticles && <SuccessParticles buttonRef={innerRef} />}
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={setRef}
        onClick={handleClick}
        {...props}
      />
    </>
  );
})
Button.displayName = "Button"

const ParticleButton = React.forwardRef(({ children, hidePointerIcon = false, className, ...props }, ref) => {
  // ParticleButton is a thin wrapper that reuses the base Button (which already
  // shows particles). We expose hidePointerIcon to allow icon-only usages.
  return (
    <Button ref={ref} className={className} {...props}>
      {children}
      {!hidePointerIcon && <MousePointerClick className="h-4 w-4" />}
    </Button>
  );
});
ParticleButton.displayName = "ParticleButton";

export { Button, buttonVariants, ParticleButton }
