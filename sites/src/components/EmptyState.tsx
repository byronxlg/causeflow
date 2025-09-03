import { motion } from 'framer-motion';
import { GitCommit, ArrowLeft } from 'lucide-react';

interface EmptyStateProps {
  onExampleClick: (example: string) => void;
}

export function EmptyState({}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Simple animated icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <GitCommit className="w-10 h-10 text-white" />
          </div>
          <motion.div
            animate={{ x: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 top-1/2 transform -translate-y-1/2"
          >
            <ArrowLeft className="w-6 h-6 text-orange-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Simple title and description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12 max-w-xl"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Understand <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Why Things Happen</span>
        </h1>
        <p className="text-lg text-gray-600">
          Enter any event and discover the chain of causes that led to it, working backwards through time.
        </p>
      </motion.div>

      {/* Simple instruction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-gray-500 text-sm"
      >
        Type in the search box above to get started
      </motion.div>
    </div>
  );
}