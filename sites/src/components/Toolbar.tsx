import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileImage, FileText, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToPNG, exportToPDF, copyShareLink } from '@/lib/export';
import type { GenerateResponse } from '@/lib/types';

interface ToolbarProps {
  data: GenerateResponse;
  timelineElementId: string;
}

export function Toolbar({ data, timelineElementId }: ToolbarProps) {
  const [exporting, setExporting] = React.useState<'png' | 'pdf' | null>(null);

  const handleExportPNG = async () => {
    setExporting('png');
    try {
      await exportToPNG(timelineElementId, `butterfly-${data.event.replace(/\s+/g, '-').toLowerCase()}`);
      toast.success('Timeline exported as PNG');
    } catch (error) {
      toast.error('Failed to export PNG');
      console.error('PNG export error:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await exportToPDF(timelineElementId, data, `butterfly-${data.event.replace(/\s+/g, '-').toLowerCase()}`);
      toast.success('Timeline exported as PDF');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleCopyLink = () => {
    try {
      copyShareLink();
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
      console.error('Copy link error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <TooltipProvider>
        {/* PNG Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPNG}
              disabled={exporting !== null}
              className="flex items-center gap-2"
            >
              {exporting === 'png' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileImage className="w-4 h-4" />
              )}
              PNG
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export timeline as PNG image</p>
          </TooltipContent>
        </Tooltip>

        {/* PDF Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="flex items-center gap-2"
            >
              {exporting === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export timeline as PDF document</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Copy Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy shareable link</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="text-xs text-gray-500 ml-2">
        Export • Share • Analyze
      </div>
    </div>
  );
}