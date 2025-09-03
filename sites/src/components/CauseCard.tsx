import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, AlertCircle } from 'lucide-react';
import type { CauseStep } from '@/lib/types';
import { getConfidenceColor, getConfidenceDot, formatWhen, cn } from '@/lib/utils';

interface CauseCardProps {
  step: CauseStep;
  index: number;
  isPresent?: boolean;
}

export function CauseCard({ step, index, isPresent = false }: CauseCardProps) {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      x: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1
    }
  };

  const transition = {
    duration: 0.5,
    delay: index * 0.1,
    ease: "easeOut" as const
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={transition}
      className="flex-shrink-0 w-80"
    >
      <Card 
        className={cn(
          "h-full relative overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-orange-400 bg-white border border-orange-200",
          isPresent ? "ring-2 ring-orange-300 bg-orange-50/50 shadow-lg" : "hover:shadow-md hover:border-orange-300"
        )}
        role="article"
        aria-label={`Causal step: ${step.title}`}
        tabIndex={0}
      >
        {/* Card header with title and when */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-gray-900 break-words">
                {step.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600 font-medium">
                  {formatWhen(step.when)}
                </span>
                {isPresent && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    Now
                  </span>
                )}
              </div>
            </div>

            {/* Confidence indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={cn("w-3 h-3 rounded-full", getConfidenceDot(step.confidence))} />
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full border font-medium",
                      getConfidenceColor(step.confidence)
                    )}>
                      {step.confidence}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confidence level: {step.confidence}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Summary */}
          <p className="text-sm text-gray-700 leading-relaxed">
            {step.summary}
          </p>

          {/* Mechanism */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
              How it happened
            </h4>
            <p className="text-sm text-gray-700">
              {step.mechanism}
            </p>
          </div>

          {/* Evidence needed (if confidence is not High) */}
          {step.evidence_needed && step.confidence !== 'High' && (
            <div className="flex gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">
                  Evidence Needed
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {step.evidence_needed}
                </p>
              </div>
            </div>
          )}

          {/* Sources */}
          {step.sources && step.sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sources
              </h4>
              <div className="space-y-1">
                {step.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors group"
                  >
                    <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}