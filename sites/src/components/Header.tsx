import { HistoryDropdown } from "@/components/HistoryDropdown";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { HistoryItem } from "@/lib/history";
import { motion } from "framer-motion";
import { LogIn, LogOut, Route, User } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
    onSignInClick: () => void;
    onSelectHistory?: (item: HistoryItem) => void;
}

export function Header({ onSignInClick, onSelectHistory }: HeaderProps) {
    const { user, loading: authLoading, logout } = useAuth();
    const [lastScrollY, setLastScrollY] = useState(0);
    const [shouldShow, setShouldShow] = useState(true);

    // Handle scroll behavior
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show navbar if at top or scrolling up
            if (currentScrollY < 10) {
                setShouldShow(true);
            } else if (currentScrollY < lastScrollY) {
                setShouldShow(true); // Scrolling up
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShouldShow(false); // Scrolling down
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error: any) {
            console.error("Logout error:", error);
        }
    };

    return (
        <motion.header
            initial={{ y: 0 }}
            animate={{ y: shouldShow ? 0 : -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-transparent backdrop-blur-sm fixed top-0 left-0 right-0 z-50"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between w-full">
                    <a
                        href="/"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex justify-center items-center">
                            <Route />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Butterfly Effect
                        </h1>
                    </a>

                    <div className="flex items-center gap-3">
                        {authLoading ? (
                            <div className="w-6 h-6 animate-pulse bg-muted rounded" />
                        ) : user ? (
                            <>
                                <HistoryDropdown
                                    onSelectHistory={
                                        onSelectHistory || (() => {})
                                    }
                                />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User size={16} />
                                    <span>{user.name || user.email}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onSignInClick}
                            >
                                <LogIn size={16} />
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
