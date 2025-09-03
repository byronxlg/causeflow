import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CauseCard } from './CauseCard';
import { Toolbar } from './Toolbar';
import type { GenerateResponse } from '@/lib/types';

interface TimelineProps {
  data: GenerateResponse;
  loading?: boolean;
}

interface ConnectorProps {
  delay: number;
}

function Connector({ delay }: ConnectorProps) {
  return (
    <div className="flex items-center justify-center h-full px-4">
      <motion.svg
        width="60"
        height="40"
        viewBox="0 0 60 40"
        className="text-orange-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay }}
      >
        <motion.path
          d="M5 20 Q30 5 55 20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.8,
            delay: delay + 0.2,
            ease: "easeInOut"
          }}
        />
        <motion.path
          d="M50 15 L55 20 L50 25"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: delay + 0.8
          }}
        />
      </motion.svg>
    </div>
  );
}

export function Timeline({ data, loading = false }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = timeline;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    handleScroll(); // Initial check
    timeline.addEventListener('scroll', handleScroll);
    
    // Also check on resize
    window.addEventListener('resize', handleScroll);

    return () => {
      timeline.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [data]);

  // Auto-scroll to the right (present) when data loads
  useEffect(() => {
    if (timelineRef.current && data && !loading) {
      timelineRef.current.scrollTo({
        left: timelineRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [data, loading]);

  if (loading) {
    return <SkeletonTimeline />;
  }

  if (!data || !data.steps) {
    return null;
  }

  const steps = [...data.steps].reverse(); // Reverse for present -> past display

  return (
    <div className="relative w-full">
      {/* Toolbar */}
      <div className="mb-6 flex justify-center">
        <Toolbar data={data} timelineElementId="timeline-export" />
      </div>

      {/* Timeline container for export */}
      <div id="timeline-export" className="bg-white/90 backdrop-blur-sm p-8 rounded-lg border border-orange-200 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {data.event}
          </h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{steps.length} steps back in time</span>
            <span>•</span>
            <span>Generated {new Date(data.generated_at).toLocaleDateString()}</span>
          </div>
          <div id="timeline-description" className="sr-only">
            Timeline showing {steps.length} causal steps from present to past. 
            Use Tab to navigate between steps. Cards show confidence levels, mechanisms, and evidence.
          </div>
        </div>

        {/* Timeline container with fade effects */}
        <div className="relative">
          {/* Left fade */}
          {showLeftFade && (
            <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          )}
          
          {/* Right fade */}
          {showRightFade && (
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          )}

          {/* Scrollable timeline */}
          <div 
            ref={timelineRef}
            className="flex items-stretch gap-0 overflow-x-auto pb-4 scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}
            role="region"
            aria-label="Causal timeline"
            aria-describedby="timeline-description"
          >
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <CauseCard 
                  step={step} 
                  index={index}
                  isPresent={index === 0} // First card (after reverse) is present
                />
                {index < steps.length - 1 && (
                  <Connector delay={index * 0.1 + 0.5} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Timeline legend */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Now</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="24" height="12" viewBox="0 0 24 12" className="text-orange-300">
                  <path d="M2 6 Q12 2 22 6" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M18 3 L22 6 L18 9" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <span>Time flows left</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Earlier causes</span>
              </div>
            </div>
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
        <div className="h-8 bg-gray-200 rounded w-96 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-64 mx-auto"></div>
      </div>

      {/* Skeleton timeline */}
      <div className="flex gap-0 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <React.Fragment key={index}>
            <div className="flex-shrink-0 w-80 animate-pulse">
              <div className="h-96 bg-gray-100 rounded-lg border"></div>
            </div>
            {index < 5 && (
              <div className="flex items-center justify-center h-full px-4">
                <div className="w-12 h-8 bg-gray-100 rounded animate-pulse"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}