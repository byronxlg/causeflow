import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Button } from "@/components/ui/button";
import React from "react";

interface PromptBarProps {
    event: string;
    onEventChange: (event: string) => void;
    onGenerate: () => void;
    loading: boolean;
    onExampleClick: (example: string) => void;
    isUserLoggedIn?: boolean;
}

const PLACEHOLDERS = [
    "Appwrite releases Sites",
    "ChatGPT-5 released",
    "Trump fires Bureau of Labor Statistics commissioner",
    "Russia-Ukraine war",
    "LA Immigration protests",
    "95% of GenAI projects fail",
    "Nepal lifts social media ban",
];

const EXAMPLE_PROMPTS = [
    "Appwrite hosts Sites Hackathon",
    "Nepal lifts social media ban"
];

export function PromptBar({
    event,
    onEventChange,
    onGenerate,
    loading,
    isUserLoggedIn = true,
}: PromptBarProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onEventChange(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!loading && event.trim()) {
            onGenerate();
        }
    };

    const handleExampleClick = (exampleText: string) => {
        onEventChange(exampleText);
    };

    if (loading) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto relative">
            <PlaceholdersAndVanishInput
                placeholders={PLACEHOLDERS}
                onChange={handleChange}
                onSubmit={handleSubmit}
            />
            
            {/* Example buttons for non-logged in users */}
            {!isUserLoggedIn && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <span className="text-sm text-muted-foreground mr-2 self-center">
                        Try these examples:
                    </span>
                    {EXAMPLE_PROMPTS.map((example, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleExampleClick(example)}
                            className="text-sm hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                        >
                            {example}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
