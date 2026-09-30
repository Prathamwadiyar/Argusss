import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.database import Audit, Device, Finding, Control, SecurityProperty, KnowledgeMapping

class ReportGenerator:
    """Executive Audit Report Generator: Produces defensible, print-ready HTML and audit summaries
    with cryptographic hashes, line-level evidence references, and mapping governance logs."""

    def generate_html_report(self, db: Session, audit_id: int) -> str:
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            return "<html><body><h1>Audit Not Found</h1></body></html>"

        devices = db.query(Device).filter(Device.audit_id == audit_id).all()
        findings = db.query(Finding).filter(Finding.audit_id == audit_id).all()
        controls = db.query(Control).all()
        mappings = db.query(KnowledgeMapping).filter(KnowledgeMapping.review_status == "APPROVED").all()

        total_findings = len(findings)
        pass_count = sum(1 for f in findings if f.status == "PASS")
        fail_count = sum(1 for f in findings if f.status == "FAIL")
        inconclusive_count = sum(1 for f in findings if f.status == "INCONCLUSIVE")
        compliance_pct = round((pass_count / max(1, total_findings)) * 100, 1)

        findings_by_device: Dict[int, List[Finding]] = {}
        for f in findings:
            findings_by_device.setdefault(f.device_id, []).append(f)

        device_rows = ""
        for dev in devices:
            dev_findings = findings_by_device.get(dev.id, [])
            d_pass = sum(1 for f in dev_findings if f.status == "PASS")
            d_fail = sum(1 for f in dev_findings if f.status == "FAIL")
            d_inc = sum(1 for f in dev_findings if f.status == "INCONCLUSIVE")
            d_rate = round((d_pass / max(1, len(dev_findings))) * 100, 1)

            device_rows += f"""
            <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 12px; font-weight: 600; color: #f8fafc;">{dev.hostname}</td>
                <td style="padding: 12px; color: #94a3b8;"><span class="badge badge-vendor">{dev.vendor}</span> ({dev.platform})</td>
                <td style="padding: 12px; font-family: monospace; font-size: 11px; color: #64748b;">{dev.source_file_hash[:16]}...</td>
                <td style="padding: 12px; color: #4ade80;">{d_pass} PASS</td>
                <td style="padding: 12px; color: #f87171;">{d_fail} FAIL</td>
                <td style="padding: 12px; color: #fbbf24;">{d_inc} INC</td>
                <td style="padding: 12px; font-weight: bold; color: {'#4ade80' if d_rate >= 80 else '#fbbf24' if d_rate >= 50 else '#f87171'};">{d_rate}%</td>
            </tr>
            """

        finding_cards = ""
        for f in findings:
            dev = next((d for d in devices if d.id == f.device_id), None)
            ctrl = db.query(Control).filter(Control.id == f.control_id).first()
            ev = f.evidence_json or {}
            
            badge_class = "badge-pass" if f.status == "PASS" else "badge-fail" if f.status == "FAIL" else "badge-inc"
            std_refs_html = ""
            if ctrl and ctrl.standard_refs:
                std_refs_html = f"""<div style="margin-top: 4px; font-family: monospace; font-size: 11px; color: #818cf8;">
                    <strong>Controls:</strong> {" &bull; ".join(ctrl.standard_refs)}
                </div>"""
            
            finding_cards += f"""
            <div class="card finding-card" style="margin-bottom: 16px; border-left: 4px solid {'#4ade80' if f.status == 'PASS' else '#f87171' if f.status == 'FAIL' else '#fbbf24'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div>
                        <span class="badge {badge_class}">{f.status}</span>
                        <span style="font-weight: 700; font-size: 15px; margin-left: 8px; color: #f8fafc;">{ctrl.code if ctrl else 'CTRL'}: {ctrl.name if ctrl else f.property_id}</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8;">
                        Device: <strong style="color: #f8fafc;">{dev.hostname if dev else 'Unknown'}</strong> ({dev.vendor if dev else ''}) | Severity: <span style="color: {'#f87171' if f.severity in ['CRITICAL', 'HIGH'] else '#fbbf24'}; font-weight: 600;">{f.severity}</span>
                    </div>
                </div>
                <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 6px 0;">{ctrl.description if ctrl else ''}</p>
                {std_refs_html}
                <div style="background: #090d16; padding: 10px 14px; border-radius: 6px; font-family: monospace; font-size: 12px; border: 1px solid #1e293b; margin: 8px 0;">
                    <div style="color: #64748b; margin-bottom: 4px;">// Source Line {ev.get('line_start', 1)} | Origin: {ev.get('source', 'DETERMINISTIC')} (Confidence: {int(f.confidence * 100)}%)</div>
                    <div style="color: {'#f8fafc' if f.status == 'PASS' else '#fca5a5'};">{ev.get('text', 'No direct syntax fragment')}</div>
                </div>
                {f'<div style="font-size: 12px; color: #38bdf8; margin-top: 6px;"><strong>Remediation:</strong> {f.remediation_guidance}</div>' if f.status == 'FAIL' and f.remediation_guidance else ''}
            </div>
            """

        mapping_rows = ""
        for m in mappings:
            mapping_rows += f"""
            <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-family: monospace; color: #38bdf8;">{m.vendor}</td>
                <td style="padding: 10px; font-family: monospace; color: #fde68a;">{m.fragment_pattern}</td>
                <td style="padding: 10px; font-family: monospace; color: #4ade80;">{m.property_id} = {m.property_state}</td>
                <td style="padding: 10px; color: #94a3b8;">v{m.version} ({m.reviewer})</td>
                <td style="padding: 10px; font-family: monospace; font-size: 11px; color: #64748b;">{m.source_hash[:12] if m.source_hash else 'MANUAL'}</td>
            </tr>
            """
        if not mapping_rows:
            mapping_rows = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No learned syntax mappings active. Audit strictly evaluated on deterministic rules.</td></tr>'

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SIH26155 Security Compliance Audit Report - #{audit.id}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #000000;
            color: #f4f4f5;
            line-height: 1.5;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: #09090b;
            border-radius: 12px;
            border: 1px solid #27272a;
            padding: 40px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.8);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #27272a;
            padding-bottom: 24px;
            margin-bottom: 30px;
        }}
        .title {{
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
        }}
        .meta {{
            color: #a1a1aa;
            font-size: 13px;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-pass {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }}
        .badge-fail {{ background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }}
        .badge-inc {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }}
        .badge-vendor {{ background: #18181b; color: #e4e4e7; border: 1px solid #27272a; }}
        .card {{
            background: #0f0f13;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 18px;
        }}
        .stat-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }}
        .stat-box {{
            background: #000000;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }}
        .stat-val {{
            font-size: 28px;
            font-weight: 800;
            margin-top: 4px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 32px;
        }}
        th {{
            background: #000000;
            padding: 12px;
            text-align: left;
            color: #94a3b8;
            font-weight: 600;
            border-bottom: 2px solid #334155;
        }}
        .framework-box {{
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
            margin-bottom: 32px;
        }}
        .framework-card {{
            background: #090d16;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }}
        .framework-name {{
            font-size: 12px;
            font-weight: 700;
            color: #38bdf8;
            margin-bottom: 4px;
        }}
        .framework-desc {{
            font-size: 10px;
            color: #64748b;
        }}
        @media print {{
            body {{ background: #fff; color: #000; padding: 0; }}
            .container {{ border: none; box-shadow: none; max-width: 100%; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="title">SIH26155 Security Compliance Audit</div>
                <div class="meta">AI-Driven Multi-Vendor Network Security Compliance Auditor</div>
                <div class="meta" style="margin-top: 6px;">Audit Hash: <strong style="font-family: monospace; color: #38bdf8;">{audit.input_hash}</strong></div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 14px; font-weight: 600; color: #f8fafc;">Status: <span style="color: {'#4ade80' if audit.status == 'COMPLETED' else '#fbbf24'};">{audit.status}</span></div>
                <div class="meta">Generated: {datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</div>
                <div class="meta">Engine Version: v1.0.4-Authoritative (Deterministic First)</div>
            </div>
        </div>

        <!-- 5 Core Authoritative Frameworks Bar -->
        <div class="framework-box">
            <div class="framework-card">
                <div class="framework-name">CIS Benchmarks</div>
                <div class="framework-desc">Cisco IOS v4.1 &bull; Junos &bull; FortiOS</div>
            </div>
            <div class="framework-card">
                <div class="framework-name">NIST SP 800-53</div>
                <div class="framework-desc">Rev. 5 AC-17, IA-5, AU-6, CM-7</div>
            </div>
            <div class="framework-card">
                <div class="framework-name">DISA STIGs</div>
                <div class="framework-desc">DoD NET-0420, NET-0810, NET-0750</div>
            </div>
            <div class="framework-card">
                <div class="framework-name">ISO/IEC 27001</div>
                <div class="framework-desc">2022 A.9.4.2, A.12.4.1, A.13.1</div>
            </div>
            <div class="framework-card">
                <div class="framework-name">NCIIPC Guidance</div>
                <div class="framework-desc">Sec 4.2, 5.1, 6.3, 7.1 Hardening</div>
            </div>
        </div>

        <div class="stat-grid">
            <div class="stat-box">
                <div class="meta">Compliance Score</div>
                <div class="stat-val" style="color: {'#4ade80' if compliance_pct >= 80 else '#fbbf24' if compliance_pct >= 50 else '#f87171'};">{compliance_pct}%</div>
            </div>
            <div class="stat-box">
                <div class="meta">Passed Controls</div>
                <div class="stat-val" style="color: #4ade80;">{pass_count}</div>
            </div>
            <div class="stat-box">
                <div class="meta">Failed Violations</div>
                <div class="stat-val" style="color: #f87171;">{fail_count}</div>
            </div>
            <div class="stat-box">
                <div class="meta">Inconclusive / Review</div>
                <div class="stat-val" style="color: #fbbf24;">{inconclusive_count}</div>
            </div>
        </div>

        <h3 style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 16px; font-size: 18px;">1. Ingested Multi-Vendor Fleet Inventory</h3>
        <table>
            <thead>
                <tr>
                    <th>Device Hostname</th>
                    <th>Vendor / OS</th>
                    <th>SHA-256 Hash</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>Inconclusive</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                {device_rows}
            </tbody>
        </table>

        <h3 style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 16px; font-size: 18px;">2. Defensible Evidence & Finding Log</h3>
        {finding_cards}

        <h3 style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 16px; font-size: 18px; margin-top: 36px;">3. Auditable Knowledge Registry & Governance</h3>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
            PRD Differentiator #5: Provenance and approval audit trail for all learned vendor dialect interpretations.
        </p>
        <table>
            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Syntax Pattern</th>
                    <th>Mapped Security Property</th>
                    <th>Version & Reviewer</th>
                    <th>Source Hash</th>
                </tr>
            </thead>
            <tbody>
                {mapping_rows}
            </tbody>
        </table>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
            <div>SIH26155 Deterministic Compliance Core &middot; Bounded Local AI &middot; Offline Guarantee</div>
            <div>Signoff: ________________________ (Compliance Officer)</div>
        </div>
    </div>
</body>
</html>
"""
        return html

report_generator = ReportGenerator()
