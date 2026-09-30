import React from 'react';
import { FileText, Printer, ExternalLink, ShieldCheck, Hash, BookOpen } from 'lucide-react';
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
    <div className="space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="minimal-panel p-6 border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-[#07070a] via-[#0d0d14] to-[#07070a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-mono text-[10px] tracking-wider uppercase font-mono">
                SIH26155 &middot; Stage 10
              </span>
              <span className="badge badge-white text-[10px] font-mono">
                Executive Compliance Audit Report
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight pt-1">
              Defensible Tamper-Evident Security Audit Dossier
            </h2>
            <p className="text-xs text-white/50 max-w-3xl leading-relaxed">
              Complete verifiable audit report generated with cryptographic SHA-256 fleet checksums,
              line-level CLI citations, 5 authoritative framework mapping matrices (CIS, NIST SP 800-53, DISA STIGs, ISO/IEC 27001, NCIIPC),
              and versioned knowledge provenance records.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/[0.08] transition-all font-mono"
            >
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>

            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all font-mono"
            >
              <ExternalLink size={14} />
              <span>Fullscreen Dossier</span>
            </a>
          </div>
        </div>

        {/* 5 Framework Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/[0.06] text-xs font-mono">
          <span className="text-white/40 text-[11px]">Audit Coverage:</span>
          <span className="badge badge-white text-[10px]">CIS Benchmarks v4.1</span>
          <span className="badge badge-white text-[10px]">NIST SP 800-53 Rev. 5</span>
          <span className="badge badge-white text-[10px]">DISA STIGs</span>
          <span className="badge badge-white text-[10px]">ISO/IEC 27001:2022</span>
          <span className="badge badge-white text-[10px]">NCIIPC Guidance</span>
          <span className="ml-auto text-emerald-400 flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={14} />
            <span>Cryptographically Sealed</span>
          </span>
        </div>
      </div>

      {/* Embedded Report Frame */}
      <div className="minimal-panel p-2 border-white/[0.08] overflow-hidden bg-[#050508]">
        <iframe
          id="report-frame"
          src={reportUrl}
          title="Security Compliance Audit Dossier"
          className="w-full h-[780px] rounded-xl border-0 bg-[#06060a]"
        />
      </div>
    </div>
  );
};

export default ReportTab;
