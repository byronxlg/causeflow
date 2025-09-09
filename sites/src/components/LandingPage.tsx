"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { PromptBar } from "./PromptBar";
import { AuroraBackground } from "./ui/aurora-background";

interface LandingPageProps {
    event: string;
    onEventChange: (event: string) => void;
    onGenerate: () => void;
    loading: boolean;
    onExampleClick: (example: string) => void;
}

export function LandingPage({
    event,
    onEventChange,
    onGenerate,
    loading,
    onExampleClick,
}: LandingPageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Transform values based on scroll
    const headerY = useTransform(scrollY, [0, 300], [0, -100]);
    const headerScale = useTransform(scrollY, [0, 300], [1, 0.6]);
    const headerOpacity = useTransform(scrollY, [0, 150, 300], [1, 1, 0.9]);
    
    const inputY = useTransform(scrollY, [0, 300], [100, 0]);
    const inputOpacity = useTransform(scrollY, [0, 150, 300], [0, 0.5, 1]);
    const inputScale = useTransform(scrollY, [0, 300], [0.8, 1]);

    const arrowOpacity = useTransform(scrollY, [0, 100], [1, 0]);
    const featuresOpacity = useTransform(scrollY, [0, 150], [1, 0]);

    return (
        <AuroraBackground>
            <div ref={containerRef} className="relative w-full">
                {/* Fixed Header Section */}
                <motion.div
                    style={{
                        y: headerY,
                        scale: headerScale,
                        opacity: headerOpacity,
                    }}
                    className="fixed top-0 left-0 right-0 z-20 flex flex-col items-center justify-center h-screen px-4"
                >
                    <motion.div
                        initial={{ opacity: 0.0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3,
                            duration: 0.8,
                            ease: "easeInOut",
                        }}
                        className="text-center"
                    >
                        <div className="text-3xl md:text-7xl font-bold text-foreground mb-6">
                            Butterfly Effect
                        </div>
                        <div className="font-extralight text-base md:text-4xl text-muted-foreground max-w-4xl mx-auto">
                            Understand how events unfold through time. Trace the causal
                            chain from present to past.
                        </div>
                    </motion.div>

                    {/* Scroll Arrow */}
                    <motion.div
                        style={{ opacity: arrowOpacity }}
                        className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="flex flex-col items-center gap-2 cursor-pointer"
                            onClick={() => {
                                window.scrollTo({ 
                                    top: 300, 
                                    behavior: "smooth" 
                                });
                            }}
                        >
                            <span className="text-sm text-muted-foreground">Scroll to explore</span>
                            <ChevronDown className="w-6 h-6 text-muted-foreground" />
                        </motion.div>
                    </motion.div>

                    {/* Features - fade out on scroll */}
                    <motion.div
                        style={{ opacity: featuresOpacity }}
                        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-xl font-semibold text-foreground mb-2">
                                    🔍 Trace Causes
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Discover the chain of events that led to any outcome
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-semibold text-foreground mb-2">
                                    ⏰ Timeline View
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Visualize how causes unfold chronologically
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-semibold text-foreground mb-2">
                                    📊 Evidence Based
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Get sources and evidence for each causal link
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Input Section - appears on scroll */}
                <motion.div
                    style={{
                        y: inputY,
                        opacity: inputOpacity,
                        scale: inputScale,
                    }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-4xl px-4"
                >
                    <PromptBar
                        event={event}
                        onEventChange={onEventChange}
                        onGenerate={onGenerate}
                        loading={loading}
                        onExampleClick={onExampleClick}
                    />
                </motion.div>

                {/* Spacer to allow scrolling */}
                <div className="h-[200vh]" />
            </div>
        </AuroraBackground>
    );
}