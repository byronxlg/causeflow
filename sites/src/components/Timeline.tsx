import type { GenerateResponse } from "@/lib/types";
import { motion, useInView } from "framer-motion";
import { ChevronDown, Binoculars, Plus } from "lucide-react";
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
        <div className="flex flex-col items-center justify-center w-full py-8">
            {/* Stack of animated chevrons */}
            <div className="flex flex-col items-center space-y-1">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="flex items-center justify-center"
                        initial={{ opacity: 0.3, scale: 0.8 }}
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                            duration: 2,
                            delay: delay + index * 0.2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut",
                        }}
                    >
                        {/* Highlighted chevron */}
                        {index === 1 ? (
                            <ChevronDown className="w-8 h-8 text-primary" />
                        ) : (
                            <ChevronDown className="w-6 h-6 text-muted-foreground" />
                        )}
                    </motion.div>
                ))}
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
                    {/* <h2 className="text-2xl font-bold text-foreground mb-2">
                        {data.event.charAt(0).toUpperCase() + data.event.slice(1)}
                    </h2> */}
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
                            <React.Fragment key={`${step.id}-${index}`}>
                                <AnimatedTimelineItem index={index}>
                                    <CauseCard step={step} index={index} />
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
                                        className="px-8 py-3 text-lg rounded-full border-2 hover:bg-primary/10 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
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
                                            <>
                                                <Binoculars className="w-5 h-5 mr-2" />
                                                Explore Deeper History
                                            </>
                                        )}
                                    </Button>
                                )}

                                {onNewEventAnalysis && (
                                    <Button
                                        onClick={onNewEventAnalysis}
                                        size="lg"
                                        className="px-8 py-3 text-lg rounded-full transition-all duration-200 cursor-pointer"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        New Event Analysis
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
