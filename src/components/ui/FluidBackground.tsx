import { useEffect, useRef } from 'react'

export const FluidBackground = () => {
    const blobRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e
            if (blobRef.current) {
                blobRef.current.animate({
                    left: `${clientX}px`,
                    top: `${clientY}px`
                }, { duration: 3000, fill: "forwards" }) // Smooth delay for "fluid" feel
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Fluid Animation */}
            <div className="absolute inset-0 bg-fluid-flow opacity-80"></div>

            {/* Interactive Ripple / Glow Blob */}
            <div
                ref={blobRef}
                className="absolute w-[500px] h-[500px] bg-gradient-to-r from-orange-500/30 to-white/10 rounded-full blur-[100px] opacity-60 mix-blend-screen transition-opacity duration-500"
                style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            ></div>

            {/* Grid Texture Overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>
        </div>
    )
}
