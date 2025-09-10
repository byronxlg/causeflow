import { useState, useEffect } from 'react';
import { ChevronDown, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HistoryService, type HistoryItem } from '@/lib/history';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryDropdownProps {
  onSelectHistory: (item: HistoryItem) => void;
}

export function HistoryDropdown({ onSelectHistory }: HistoryDropdownProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && isOpen && history.length === 0) {
      loadHistory();
    }
  }, [user, isOpen]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userHistory = await HistoryService.getUserHistory(user.$id, 10);
      setHistory(userHistory);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await HistoryService.deleteHistoryItem(itemId);
      setHistory(prev => prev.filter(item => item.$id !== itemId));
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Clock size={16} />
          <span className="hidden sm:inline">History</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        <DropdownMenuLabel>Recent Analyses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <AnimatePresence>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="px-2 py-8 text-center text-muted-foreground text-sm">
              No analysis history yet
            </div>
          ) : (
            history.map((item, index) => (
              <motion.div
                key={item.$id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer group hover:bg-secondary/50"
                  onClick={() => {
                    onSelectHistory(item);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        {truncateText(item.event)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.$createdAt)} • {item.result.steps.length} steps
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => handleDeleteItem(item.$id, e)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {history.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-xs text-muted-foreground py-2"
              disabled
            >
              Showing {history.length} recent analyses
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}