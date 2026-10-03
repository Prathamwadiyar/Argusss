import React from 'react';
import { Printer, ExternalLink, ShieldCheck } from 'lucide-react';
import { auditService } from '../services/api';

const ReportTab = ({ auditId }) => {
  const reportUrl = auditService.getReportUrl(auditId);

  const handlePrint = () => {
    const iframe = document.getElementById('report-frame');
    if (iframe) {
      iframe.contentWindow.print();
    } else {
      window.open(reportUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header Info */}
      <div className="rounded-xl p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Official Report
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Executive Compliance Audit Dossier
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Verifiable compliance audit report with cryptographic SHA-256 fleet checksums,
              line-level CLI citations, and cross-framework matrices (CIS, NIST, DISA STIGs, ISO 27001, NCIIPC).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all font-mono shadow-xs"
            >
              <Printer size={13} />
              <span>Print / Export PDF</span>
            </button>

            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all font-mono shadow-sm"
            >
              <ExternalLink size={13} />
              <span>Fullscreen Dossier</span>
            </a>
          </div>
        </div>

        {/* 5 Framework Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">Audit Coverage:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">CIS Benchmarks v4.1</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">NIST SP 800-53 Rev. 5</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">DISA STIGs</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">ISO/IEC 27001:2022</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">NCIIPC Guidance</span>
          <span className="ml-auto text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Cryptographically Sealed</span>
          </span>
        </div>
      </div>

      {/* Embedded Report Frame */}
      <div className="rounded-xl p-1.5 border border-slate-200 shadow-sm overflow-hidden bg-white">
        <iframe
          id="report-frame"
          src={reportUrl}
          title="Security Compliance Audit Dossier"
          className="w-full h-[780px] rounded-lg border-0 bg-white"
        />
      </div>
    </div>
  );
};

export default ReportTab;
