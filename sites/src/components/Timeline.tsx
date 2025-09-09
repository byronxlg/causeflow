import type { GenerateResponse } from "@/lib/types";
import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";
import { CauseCard } from "./CauseCard";
import { Button } from "./ui/button";

interface TimelineProps {
    data: GenerateResponse;
    loading?: boolean;
    onRequestMoreEvents?: () => void;
    loadingMoreEvents?: boolean;
    onNewEventAnalysis?: () => void;
}

interface ConnectorProps {
    delay: number;
}

// Animated container that reveals content on scroll
function AnimatedTimelineItem({
    children,
    index,
}: {
    children: React.ReactNode;
    index: number;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        once: true,
        margin: "-100px 0px",
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: "easeOut",
            }}
        >
            {children}
        </motion.div>
    );
}

function Connector({ delay }: ConnectorProps) {
    return (
        <div className="flex items-center justify-center w-full py-10">
            <div className="relative">
                {/* Enhanced background glow effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-primary/30 via-chart-1/40 to-primary/30 rounded-full blur-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    transition={{ duration: 0.6, delay: delay + 0.1 }}
                />

                {/* Main connector */}
                <motion.svg
                    width="64"
                    height="96"
                    viewBox="0 0 64 96"
                    className="relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay }}
                >
                    {/* Enhanced background path */}
                    <motion.path
                        d="M32 8 Q16 48 32 88"
                        stroke="hsl(var(--primary) / 0.4)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: 1.2,
                            delay: delay + 0.2,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Main path - thicker and more prominent */}
                    <motion.path
                        d="M32 8 Q16 48 32 88"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: 1.2,
                            delay: delay + 0.3,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Enhanced arrow head */}
                    <motion.g
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        transition={{
                            duration: 0.5,
                            delay: delay + 1,
                            ease: "easeOut",
                        }}
                    >
                        {/* Arrow background circle */}
                        <circle
                            cx="32"
                            cy="88"
                            r="6"
                            fill="hsl(var(--primary))"
                            opacity="0.9"
                        />
                        {/* Arrow head */}
                        <path
                            d="M24 82 L32 88 L40 82"
                            stroke="hsl(var(--primary-foreground))"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.g>

                    {/* Enhanced floating particles */}
                    <motion.circle
                        cx="26"
                        cy="30"
                        r="2"
                        fill="hsl(var(--chart-2))"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: [0, 20, 0] }}
                        transition={{
                            duration: 3,
                            delay: delay + 1.2,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                    />
                    <motion.circle
                        cx="38"
                        cy="55"
                        r="1.5"
                        fill="hsl(var(--chart-3))"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: [0, 15, 0] }}
                        transition={{
                            duration: 2.5,
                            delay: delay + 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                    />
                    <motion.circle
                        cx="20"
                        cy="70"
                        r="1"
                        fill="hsl(var(--chart-4))"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 0], y: [0, 10, 0] }}
                        transition={{
                            duration: 2,
                            delay: delay + 1.8,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                    />
                </motion.svg>
            </div>
        </div>
    );
}

export function Timeline({
    data,
    loading = false,
    onRequestMoreEvents,
    loadingMoreEvents = false,
    onNewEventAnalysis,
}: TimelineProps) {
    if (loading) {
        return <SkeletonTimeline />;
    }

    if (!data || !data.steps) {
        return null;
    }

    const steps = [...data.steps]; // Keep original order: newest (NOW) first, oldest last

    return (
        <div className="relative w-full">
            {/* Timeline container */}
            <div className="bg-card/90 backdrop-blur-sm p-8 rounded-lg border border-border shadow-lg">
                {/* Header */}
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {data.event}
                    </h2>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span>{steps.length} steps back in time</span>
                        <span>•</span>
                        <span>
                            Generated{" "}
                            {new Date(data.generated_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div id="timeline-description" className="sr-only">
                        Timeline showing {steps.length} causal steps from
                        present to past. Use Tab to navigate between steps.
                        Cards show mechanisms and evidence.
                    </div>
                </div>

                {/* Vertical Timeline */}
                <div className="relative max-w-4xl mx-auto">
                    <div
                        className="flex flex-col gap-0"
                        role="region"
                        aria-label="Causal timeline"
                        aria-describedby="timeline-description"
                    >
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <AnimatedTimelineItem index={index}>
                                    <CauseCard
                                        step={step}
                                        index={index}
                                    />
                                </AnimatedTimelineItem>
                                {index < steps.length - 1 && (
                                    <AnimatedTimelineItem index={index + 0.5}>
                                        <Connector delay={0} />
                                    </AnimatedTimelineItem>
                                )}
                            </React.Fragment>
                        ))}

                        {/* Action Buttons */}
                        <AnimatedTimelineItem index={steps.length}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full py-12">
                                {onRequestMoreEvents && (
                                    <Button
                                        onClick={onRequestMoreEvents}
                                        disabled={loadingMoreEvents}
                                        size="lg"
                                        variant="outline"
                                        className="px-8 py-3 text-lg rounded-full border-2 hover:bg-primary/10 transition-all duration-200"
                                    >
                                        {loadingMoreEvents ? (
                                            <>
                                                <motion.div
                                                    className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full mr-2"
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                />
                                                Loading More Events...
                                            </>
                                        ) : (
                                            <>🔍 Explore Deeper History</>
                                        )}
                                    </Button>
                                )}

                                {onNewEventAnalysis && (
                                    <Button
                                        onClick={onNewEventAnalysis}
                                        size="lg"
                                        className="px-8 py-3 text-lg rounded-full transition-all duration-200"
                                    >
                                        ✨ New Event Analysis
                                    </Button>
                                )}
                            </div>
                        </AnimatedTimelineItem>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SkeletonTimeline() {
    return (
        <div className="w-full">
            {/* Skeleton header */}
            <div className="mb-6 text-center animate-pulse">
                <div className="h-8 bg-muted rounded w-96 mx-auto mb-2"></div>
                <div className="h-4 bg-muted/50 rounded w-64 mx-auto"></div>
            </div>

            {/* Skeleton timeline */}
            <div className="flex gap-0 overflow-hidden">
                {Array.from({ length: 6 }).map((_, index) => (
                    <React.Fragment key={index}>
                        <div className="flex-shrink-0 w-80 animate-pulse">
                            <div className="h-96 bg-muted/50 rounded-lg border"></div>
                        </div>
                        {index < 5 && (
                            <div className="flex items-center justify-center h-full px-4">
                                <div className="w-12 h-8 bg-muted/50 rounded animate-pulse"></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
