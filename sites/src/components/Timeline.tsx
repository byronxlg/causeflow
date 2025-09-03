import React from 'react';
import { motion } from 'framer-motion';
import { CauseCard } from './CauseCard';
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
    <div className="flex items-center justify-center w-full py-8">
      <div className="relative">
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-orange-200/50 via-amber-200/30 to-orange-200/50 rounded-full blur-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.1 }}
        />
        
        {/* Main connector */}
        <motion.svg
          width="48"
          height="80"
          viewBox="0 0 48 80"
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay }}
        >
          {/* Background path */}
          <motion.path
            d="M24 8 Q12 40 24 72"
            stroke="#fed7aa"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              delay: delay + 0.2,
              ease: "easeInOut"
            }}
          />
          
          {/* Main path */}
          <motion.path
            d="M24 8 Q12 40 24 72"
            stroke="#f97316"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              delay: delay + 0.3,
              ease: "easeInOut"
            }}
          />
          
          {/* Arrow head with better design */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: delay + 1,
              ease: "easeOut"
            }}
          >
            <circle
              cx="24"
              cy="72"
              r="4"
              fill="#f97316"
              opacity="0.8"
            />
            <path
              d="M18 66 L24 72 L30 66"
              stroke="#f97316"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
          
          {/* Floating particles */}
          <motion.circle
            cx="20"
            cy="25"
            r="1.5"
            fill="#fbbf24"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [0, 15, 0] }}
            transition={{
              duration: 2,
              delay: delay + 1.2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
          <motion.circle
            cx="28"
            cy="45"
            r="1"
            fill="#fb923c"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [0, 10, 0] }}
            transition={{
              duration: 2.5,
              delay: delay + 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </motion.svg>
      </div>
    </div>
  );
}

export function Timeline({ data, loading = false }: TimelineProps) {

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
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg border border-orange-200 shadow-lg">
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
            Use Tab to navigate between steps. Cards show mechanisms and evidence.
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
                <CauseCard 
                  step={step} 
                  index={index}
                  isPresent={index === 0} // First card is NOW (present)
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
                <svg width="16" height="28" viewBox="0 0 16 28" className="text-orange-500">
                  <path d="M8 2 Q4 14 8 26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <circle cx="8" cy="26" r="2" fill="currentColor" opacity="0.8" />
                  <path d="M5 21 L8 26 L11 21" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Time flows down</span>
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