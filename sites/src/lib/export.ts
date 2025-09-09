import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { GenerateResponse } from './types';

export async function exportToPNG(elementId: string, filename: string = 'butterfly'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  try {
    const canvas = await html2canvas(element, {
      background: 'hsl(var(--background))',
      useCORS: true,
      allowTaint: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export PNG');
  }
}

export async function exportToPDF(elementId: string, data: GenerateResponse, filename: string = 'butterfly'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  try {
    const canvas = await html2canvas(element, {
      background: 'hsl(var(--background))',
      useCORS: true,
      allowTaint: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create PDF in landscape mode to fit timeline
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit the image
    const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
    const imgPdfWidth = imgWidth * 0.264583 * ratio;
    const imgPdfHeight = imgHeight * 0.264583 * ratio;

    const x = (pdfWidth - imgPdfWidth) / 2;
    const y = (pdfHeight - imgPdfHeight) / 2;

    // Add title page
    pdf.setFontSize(20);
    pdf.text('Butterfly Analysis', 20, 30);
    
    pdf.setFontSize(14);
    pdf.text(`Event: ${data.event}`, 20, 50);
    pdf.text(`Perspective: ${data.perspective}`, 20, 65);
    pdf.text(`Generated: ${new Date(data.generated_at).toLocaleString()}`, 20, 80);
    pdf.text(`Steps: ${data.steps.length}`, 20, 95);

    // Add main timeline image
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', x, y, imgPdfWidth, imgPdfHeight);

    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
}

export function copyShareLink(): void {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    // Success handled by caller
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
}