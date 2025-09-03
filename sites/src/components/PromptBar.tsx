import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight } from 'lucide-react';

interface PromptBarProps {
  event: string;
  onEventChange: (event: string) => void;
  onGenerate: () => void;
  loading: boolean;
  onExampleClick: (example: string) => void;
}

const SUGGESTIONS = [
  "US inflation eased in August 2025",
  "Bitcoin reached $100,000 in 2024",
  "Tesla achieved full self-driving",
  "OpenAI released GPT-5 in early 2024",
  "The metaverse adoption accelerated",
  "Global supply chain disruption ended",
  "Remote work became permanently mainstream"
];

export function PromptBar({
  event,
  onEventChange,
  onGenerate,
  loading,
  onExampleClick
}: PromptBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(SUGGESTIONS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && event.trim()) {
      setShowSuggestions(false);
      onGenerate();
    }
  };

  const handleInputChange = (value: string) => {
    onEventChange(value);
    
    if (value.trim()) {
      const filtered = SUGGESTIONS.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().split(' ').some(word => 
          suggestion.toLowerCase().includes(word)
        )
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onExampleClick(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (!event.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            type="text"
            placeholder="What event would you like to understand? (e.g., 'Bitcoin reached $100,000')"
            value={event}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="text-xl py-6 pr-24 shadow-xl border-2 border-orange-200 focus:border-orange-400 bg-white/90 backdrop-blur-sm rounded-xl"
            disabled={loading}
          />
          
          <Button 
            type="submit" 
            disabled={loading || !event.trim()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-orange-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          <div className="p-4">
            <div className="text-sm font-medium text-orange-700 mb-3 px-2">Try these examples:</div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 text-base text-gray-700 hover:text-orange-800 transition-colors border border-transparent hover:border-orange-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}