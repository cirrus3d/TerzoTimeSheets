'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ReportToolbarProps {
  /** Period label, e.g. "Sep 1, 2026 - Sep 7, 2026" or "September 2026". */
  label: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
  previousLabel: string;
  nextLabel: string;
  currentLabel: string;
  onExportPDF: () => void;
  onExportXLS: () => void;
  exportDisabled?: boolean;
}

/**
 * Shared period navigation + export toolbar for the report views.
 * Phones: arrow-only Previous/Next with the period label on its own row, and
 * full-width export buttons underneath. Desktop: navigation left, exports right.
 */
export function ReportToolbar({
  label,
  onPrevious,
  onNext,
  onCurrent,
  previousLabel,
  nextLabel,
  currentLabel,
  onExportPDF,
  onExportXLS,
  exportDisabled = false,
}: ReportToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:justify-start">
        <Button onClick={onPrevious} variant="secondary" className="order-1">
          ‹ <span className="sr-only sm:not-sr-only">{previousLabel}</span>
        </Button>
        <div className="order-3 sm:order-2 w-full sm:w-auto text-center flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-gray-900">{label}</p>
          <Button onClick={onCurrent} variant="secondary" className="text-sm">
            {currentLabel}
          </Button>
        </div>
        <Button onClick={onNext} variant="secondary" className="order-2 sm:order-3">
          <span className="sr-only sm:not-sr-only">{nextLabel}</span> ›
        </Button>
      </div>
      <div className="flex gap-2 w-full lg:w-auto">
        <Button onClick={onExportPDF} variant="secondary" disabled={exportDisabled} className="flex-1 lg:flex-none">
          📄 Download PDF
        </Button>
        <Button onClick={onExportXLS} variant="secondary" disabled={exportDisabled} className="flex-1 lg:flex-none">
          📊 Download XLS
        </Button>
      </div>
    </div>
  );
}
