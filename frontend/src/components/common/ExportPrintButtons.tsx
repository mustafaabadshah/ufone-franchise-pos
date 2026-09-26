import React from "react";
import { Printer, Download, FileSpreadsheet, FileText } from "lucide-react";
import { api } from "../../api/client";

interface ExportPrintButtonsProps {
  reportType?: string;
  onPrint?: () => void;
  excelUrl?: string;
  csvUrl?: string;
  title?: string;
  targetId?: string;
}

export const ExportPrintButtons: React.FC<ExportPrintButtonsProps> = ({
  reportType = "sales",
  onPrint,
  excelUrl,
  csvUrl,
  title,
  targetId
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      const origTitle = document.title;
      if (title) document.title = title;
      window.print();
      if (title) document.title = origTitle;
    }
  };

  const downloadExcel = () => {
    const url = excelUrl || api.getExcelExportUrl(reportType);
    window.open(url, "_blank");
  };

  const downloadCsv = () => {
    const url = csvUrl || api.getCsvExportUrl(reportType);
    window.open(url, "_blank");
  };

  return (
    <div className="flex items-center gap-2 no-print">
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        title="Print View"
      >
        <Printer className="w-3.5 h-3.5 text-slate-500" />
        <span>Print</span>
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        title="Save as PDF via Print"
      >
        <FileText className="w-3.5 h-3.5 text-rose-500" />
        <span>PDF</span>
      </button>

      <button
        onClick={downloadExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        title="Export to Microsoft Excel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        <span>Excel</span>
      </button>

      <button
        onClick={downloadCsv}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
        title="Export CSV"
      >
        <Download className="w-3.5 h-3.5 text-indigo-500" />
        <span>CSV</span>
      </button>
    </div>
  );
};

export default ExportPrintButtons;
