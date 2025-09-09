import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { LinkPreview } from '@/components/ui/link-preview';
import type { CauseStep } from '@/lib/types';
import { formatWhen } from '@/lib/utils';

interface CauseCardProps {
  step: CauseStep;
  index: number;
}

export function CauseCard({ step, index }: CauseCardProps) {
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
      className="w-full max-w-2xl mx-auto"
    >
      <Card 
        className="h-full relative overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary bg-card border border-border hover:shadow-md hover:border-primary/30"
        role="article"
        aria-label={`Causal step: ${step.title}`}
        tabIndex={0}
      >
        {/* Card header with title and when */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-foreground break-words">
                {step.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-medium">
                  {formatWhen(step.when)}
                </span>
              </div>
            </div>

          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Summary */}
          <p className="text-sm text-foreground leading-relaxed">
            {step.summary}
          </p>

          {/* Mechanism */}
          <div className="bg-secondary/20 border border-border rounded-lg p-3">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
              How it happened
            </h4>
            <p className="text-sm text-foreground">
              {step.mechanism}
            </p>
          </div>


          {/* Sources - Always show at least one link */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {step.sources && step.sources.length > 0 ? 'Sources' : 'Research'}
            </h4>
            <div className="space-y-2">
              {step.sources && step.sources.length > 0 ? (
                step.sources.map((source, idx) => (
                  <LinkPreview
                    key={idx}
                    url={source.url}
                    className="block"
                  >
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors group p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
                      <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="truncate">{source.title}</span>
                    </div>
                  </LinkPreview>
                ))
              ) : (
                // Fallback search link when no sources are available
                <LinkPreview
                  url={`https://www.google.com/search?q=${encodeURIComponent(step.title + ' ' + step.when)}`}
                  className="block"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline transition-colors group p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
                    <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="truncate">Search for more information</span>
                  </div>
                </LinkPreview>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}