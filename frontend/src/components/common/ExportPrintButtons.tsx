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
  orientation?: "portrait" | "landscape";
}

/**
 * Universal Multi-Page Print & PDF Engine
 * Solves single-page and wide-table clipping by rendering the target content
 * into an isolated sandbox iframe with A4 portrait or landscape pagination.
 */
export const printTargetContent = (
  targetId?: string,
  title?: string,
  isPdf = false,
  orientation?: "portrait" | "landscape"
) => {
  let targetEl: HTMLElement | null = null;

  if (targetId) {
    targetEl = document.getElementById(targetId);
  }

  // Auto-discovery fallback if specific targetId is not provided or not found
  if (!targetEl) {
    targetEl =
      document.querySelector<HTMLElement>("#report-printable-area") ||
      document.querySelector<HTMLElement>("#pnl-printable-area") ||
      document.querySelector<HTMLElement>("#fca-printable-area") ||
      document.querySelector<HTMLElement>("#dashboard-printable-area") ||
      document.querySelector<HTMLElement>(".print-container") ||
      document.querySelector<HTMLElement>('[id$="-table"]') ||
      document.querySelector<HTMLElement>('[id$="-sheet"]') ||
      document.querySelector<HTMLElement>("main");
  }

  if (!targetEl) {
    window.print();
    return;
  }

  // Determine orientation (explicit or auto-detected for wide ledger tables like FCA)
  const isLandscape =
    orientation === "landscape" ||
    (targetId && targetId.toLowerCase().includes("fca")) ||
    targetEl.id.toLowerCase().includes("fca") ||
    targetEl.classList.contains("fca-print-sheet");

  const pageOrientation = isLandscape ? "landscape" : "portrait";
  const pageMargins = isLandscape ? "5mm 4mm 5mm 4mm" : "12mm 10mm 14mm 10mm";

  const docTitle = title
    ? isPdf && !title.toLowerCase().endsWith(".pdf")
      ? `${title}.pdf`
      : title
    : isPdf
    ? "Ufone_Franchise_Report.pdf"
    : "Ufone Franchise Report";

  // Create isolated sandbox iframe to completely bypass parent h-screen / overflow-hidden constraints
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.zIndex = "-9999";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  // Collect all stylesheet links and style tags from host document
  let stylesHtml = "";
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    stylesHtml += link.outerHTML;
  });
  document.querySelectorAll("style").forEach((style) => {
    stylesHtml += style.outerHTML;
  });

  // Comprehensive multi-page A4 print reset styles
  const printResetCss = `
    <style>
      @page {
        size: A4 ${pageOrientation};
        margin: ${pageMargins};
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: ${isLandscape ? "7.5pt" : "10pt"} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print, .print-hidden, nav, aside, header, button:not(.print-include), select, input[type="text"], input[type="number"] {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      span.print-only {
        display: inline !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        max-width: 100% !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
        margin-bottom: 8px !important;
        table-layout: auto !important;
      }
      thead {
        display: table-header-group !important;
      }
      tfoot {
        display: table-footer-group !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      th, td {
        padding: ${isLandscape ? "2.5px 3px" : "5px 8px"} !important;
        font-size: ${isLandscape ? "6.8pt" : "8.5pt"} !important;
        border: 1px solid #cbd5e1 !important;
        line-height: 1.15 !important;
        letter-spacing: -0.01em !important;
      }
      th {
        background-color: #0f172a !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-break, .break-after-page {
        page-break-after: always !important;
        break-after: page !important;
      }
      .page-break-before {
        page-break-before: always !important;
        break-before: page !important;
      }
      .break-inside-avoid, .avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      /* Unclamp scroll containers in clone */
      div, section, article, main {
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }
      .rounded-2xl, .rounded-xl, .shadow-xs, .shadow-sm, .shadow-md, .shadow-lg {
        box-shadow: none !important;
        border-radius: 6px !important;
      }
    </style>
  `;

  // Clone target element and clean unneeded interactive elements
  const clone = targetEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print, button:not(.print-include)").forEach((el) => el.remove());

  // Check if clone already has an official franchise header
  const hasExistingHeader =
    clone.innerText.includes("Ufone Franchise") ||
    clone.innerText.includes("Official Executive Audit") ||
    clone.innerText.includes("Official Franchise Executive Statement");

  const brandedHeader = !hasExistingHeader && title
    ? `
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="font-size: 18px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">Ufone Franchise - Dargai Office</div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">Main Bazar, Dargai, Malakand, KP | PTCL & Ufone Telecommunications</div>
        <div style="font-size: 14px; font-weight: 700; color: #3730a3; margin-top: 6px; text-transform: uppercase;">${title}</div>
        <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 4px;">Audit Generated: ${new Date().toLocaleString()}</div>
      </div>
    `
    : "";

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      ${stylesHtml}
      ${printResetCss}
    </head>
    <body class="bg-white text-slate-900 p-2">
      <div id="print-root">
        ${brandedHeader}
        ${clone.outerHTML}
      </div>
    </body>
    </html>
  `);
  doc.close();

  // Wait for stylesheets and font assets to load inside sandbox
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Iframe print error, falling back to window.print():", err);
      const prevTitle = document.title;
      if (title) document.title = docTitle;
      window.print();
      if (title) document.title = prevTitle;
    } finally {
      // Clean up iframe from DOM after print dialog
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }
  }, 350);
};

export const ExportPrintButtons: React.FC<ExportPrintButtonsProps> = ({
  reportType = "sales",
  onPrint,
  excelUrl,
  csvUrl,
  title,
  targetId,
  orientation,
}) => {
  const handlePrint = (mode: "print" | "pdf" = "print") => {
    if (onPrint) {
      onPrint();
    } else {
      printTargetContent(targetId, title, mode === "pdf", orientation);
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
        onClick={() => handlePrint("print")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        title="Print View (Full Multi-Page Document)"
      >
        <Printer className="w-3.5 h-3.5 text-slate-500" />
        <span>Print</span>
      </button>

      <button
        onClick={() => handlePrint("pdf")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        title="Save all pages as PDF via Print Preview"
      >
        <FileText className="w-3.5 h-3.5 text-rose-500" />
        <span>PDF</span>
      </button>

      <button
        onClick={downloadExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        title="Export to Microsoft Excel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        <span>Excel</span>
      </button>

      <button
        onClick={downloadCsv}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        title="Export CSV"
      >
        <Download className="w-3.5 h-3.5 text-indigo-500" />
        <span>CSV</span>
      </button>
    </div>
  );
};

export default ExportPrintButtons;
