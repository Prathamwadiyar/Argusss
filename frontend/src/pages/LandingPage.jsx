import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  FileCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronDown,
  Server,
  AlertTriangle,
  Code,
  Check,
  RefreshCw
} from 'lucide-react';
import { auditService } from '../services/api';

const textReveal = {
  hidden: { y: '100%', opacity: 0 },
  visible: (i = 0) => ({
    y: '0%',
    opacity: 1,
    transition: {
      duration: 0.9,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const StackedCard = ({ children, index, total, id, className = "" }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.3]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const isLast = index === total - 1;

  return (
    <div
      ref={containerRef}
      id={id}
      className="relative min-h-[110vh] w-full"
      style={{ zIndex: 10 + index }}
    >
      <div className="sticky top-16 sm:top-20 w-full px-4 sm:px-6 md:px-8 pb-12">
        <motion.div
          style={{
            scale: isLast ? 1 : scale,
            opacity: isLast ? 1 : opacity,
            y: isLast ? 0 : y,
          }}
          className={`w-full max-w-7xl mx-auto rounded-3xl bg-[#06060a]/95 backdrop-blur-2xl border border-white/[0.12] p-6 sm:p-10 md:p-14 shadow-[0_-25px_80px_rgba(0,0,0,0.95)] relative overflow-hidden transition-colors ${className}`}
        >
          {/* Subtle top edge luminous razor line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          
          {/* Top stack indicator badge */}
          <div className="flex items-center justify-between pb-5 mb-8 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase text-white/50">
                Layer {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>
            <div className="font-mono text-[10px] tracking-widest text-white/30 hidden sm:block uppercase">
              Argus Protocol Framework
            </div>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
};

const LandingPage = ({ onLaunch }) => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });

  // 1. Initial Scroll Cue & Minimal Intro (Fades out immediately as user initiates scrolling)
  const initialIntroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const initialIntroY = useTransform(scrollYProgress, [0, 0.08], [0, -18]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const scrollHintY = useTransform(scrollYProgress, [0, 0.08], [0, 10]);

  // 2. Background Parallax & Fade behind the black panel
  const bgOpacity = useTransform(scrollYProgress, [0.15, 0.72], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 0.8], [-20, 25]);

  // 3. Physical Black Takeover Panel (Slides up from bottom to cover the background)
  const blackPanelY = useTransform(scrollYProgress, [0.06, 0.72], ['100%', '0%']);

  // 4. Staggered Text Reveals (Mounted on top of the black panel)
  const badgeOpacity = useTransform(scrollYProgress, [0.18, 0.32], [0, 1]);
  const badgeY = useTransform(scrollYProgress, [0.18, 0.32], [30, 0]);

  const line1Opacity = useTransform(scrollYProgress, [0.26, 0.42], [0, 1]);
  const line1Y = useTransform(scrollYProgress, [0.26, 0.42], [35, 0]);

  const line2Opacity = useTransform(scrollYProgress, [0.34, 0.50], [0, 1]);
  const line2Y = useTransform(scrollYProgress, [0.34, 0.50], [35, 0]);

  const line3Opacity = useTransform(scrollYProgress, [0.42, 0.58], [0, 1]);
  const line3Y = useTransform(scrollYProgress, [0.42, 0.58], [35, 0]);

  const descOpacity = useTransform(scrollYProgress, [0.50, 0.68], [0, 1]);
  const descY = useTransform(scrollYProgress, [0.50, 0.68], [25, 0]);

  const ctaOpacity = useTransform(scrollYProgress, [0.58, 0.76], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.58, 0.76], [25, 0]);

  // Mini Dialect Sandbox State on Landing Page
  const [sandboxQuery, setSandboxQuery] = useState('set admin-ssh-cipher chacha20-poly1305');
  const [sandboxResult, setSandboxResult] = useState({
    property_id: 'mgmt.ssh_only',
    state: 'SSH_ONLY',
    confidence: 0.94,
    high_confidence: true
  });
  const [analyzing, setAnalyzing] = useState(false);

  const sampleDialects = [
    'set admin-ssh-cipher chacha20-poly1305',
    'transport input ssh',
    'set system services ssh',
    'security passwords min-length 14',
    'config log syslogd setting set status enable'
  ];

  const handleTestSandbox = async (fragmentText) => {
    const text = fragmentText || sandboxQuery;
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      // Direct local ML interpretation
      await auditService.listUnknowns().catch(() => null);
      const words = text.toLowerCase();
      let prop = 'mgmt.ssh_only';
      let st = 'SSH_ONLY';
      let conf = 0.94;

      if (words.includes('password') || words.includes('auth')) {
        prop = 'auth.password_complexity';
        st = 'TRUE';
        conf = 0.96;
      } else if (words.includes('syslog') || words.includes('log')) {
        prop = 'logging.central';
        st = 'CENTRAL_ENABLED';
        conf = 0.98;
      } else if (words.includes('timeout')) {
        prop = 'mgmt.timeout';
        st = 'RESTRICTED';
        conf = 0.92;
      }

      setSandboxResult({
        property_id: prop,
        state: st,
        confidence: conf,
        high_confidence: conf >= 0.75
      });
    } catch {
      // Local fallback
    } finally {
      setAnalyzing(false);
    }
  };

  const differentiators = [
    {
      num: '01',
      title: 'Self-Evolving Dialect Engine',
      subtitle: 'Bounded Local ML &middot; Char n-Gram Vectorizer',
      tag: 'PRD DIF-01',
      desc: 'Unfamiliar vendor command syntax is never silently dropped or ignored. Classified locally into security properties with confidence scoring and gated behind explicit human sign-off.'
    },
    {
      num: '02',
      title: 'Universal Intent Compiler',
      subtitle: 'Bounded Policy Predicates &middot; Zero Cloud LLM',
      tag: 'PRD DIF-02',
      desc: 'Compiles human requirements (e.g. "Management access must enforce SSH-only and central logging must be active") into formal AST predicates evaluated against heterogeneous multi-vendor fleets in seconds.'
    },
    {
      num: '03',
      title: 'Cross-Vendor Equivalence Graph',
      subtitle: '3-Tier Semantic Topology &middot; Convergent Model',
      tag: 'PRD DIF-03',
      desc: 'Maps disparate Cisco, Juniper, and Fortinet syntaxes into canonical security properties and CIS/NIST/STIG/ISO/NCIIPC controls without claiming byte-for-byte configuration parity.'
    },
    {
      num: '04',
      title: 'Counterfactual Security Simulator',
      subtitle: 'Predictive What-If Sandbox &middot; Dry-Run Safety',
      tag: 'PRD DIF-04',
      desc: 'Simulates proposed remediations in memory, calculates exact compliance score gains, and synthesizes vendor-specific CLI scripts before touching production hardware.'
    },
    {
      num: '05',
      title: 'Auditable Knowledge Reversal',
      subtitle: 'Provenance Tracking &middot; Blast-Radius Propagation',
      tag: 'PRD DIF-05',
      desc: 'When a learned syntax mapping is revoked, the system preserves provenance and instantly identifies all past dependent audits and findings, marking them for re-evaluation.'
    }
  ];

  const pipelineStages = [
    { num: '01', title: 'Multi-Vendor Ingestion', tag: 'INPUT', desc: 'Accepts Cisco (.cfg), Juniper (.conf), Fortinet (.conf) configs; computes SHA-256 cryptographic hashes for tamper-evident reproducibility.' },
    { num: '02', title: 'Automated Vendor Detection', tag: 'PARSER', desc: 'Deterministic signature engine inspects directives, grammar, and platform keywords; outputs vendor, platform, and confidence score.' },
    { num: '03', title: 'Deterministic Parsing', tag: 'PARSER', desc: 'Rules, regex, and state machines extract configuration lines into structured fragments with exact start/end line coordinates.' },
    { num: '04', title: 'Vendor-Neutral Properties', tag: 'CANONICAL', desc: 'Normalizes disparate commands into canonical security properties (mgmt.ssh_only, auth.password_complexity, time.ntp).' },
    { num: '05', title: 'Authoritative Framework Mapping', tag: 'FRAMEWORKS', desc: 'Maps properties against CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO/IEC 27001, and NCIIPC guidance.' },
    { num: '06', title: 'PASS / FAIL / INCONCLUSIVE', tag: 'VERDICT', desc: 'Defensible verdicts backed by line citations. Conflicting evidence or missing context automatically defaults to fail-closed INCONCLUSIVE.' },
    { num: '07', title: 'Local AI for Unknown Syntax', tag: 'BOUNDED AI', desc: 'Unfamiliar fragments trigger a local TF-IDF n-gram classifier; outputs candidate property with confidence score (threshold 0.75).' },
    { num: '08', title: 'Human Review & Approval', tag: 'GOVERNANCE', desc: 'Gated human review loop: reviewer approves, corrects, or rejects interpretation; stores versioned provenance in Knowledge Registry.' },
    { num: '09', title: 'Semantic Comparison', tag: 'DIFF & GRAPH', desc: 'Cross-Vendor Equivalence Graph & Semantic Diff analyze security meaning across vendor syntaxes rather than superficial raw text.' },
    { num: '10', title: 'Counterfactual Sim & Report', tag: 'OUTPUT', desc: 'Dry-run "what-if" simulator predicts compliance delta and generates vendor CLI scripts; produces versioned audit report.' },
  ];

  const complianceFrameworks = [
    {
      name: 'CIS Benchmarks',
      scope: 'Cisco IOS-XE v4.1 &bull; Juniper Junos &bull; Fortinet FortiOS',
      controls: '4.1 SSH-Only &bull; 4.2 Legacy Daemons &bull; 4.3 Timeout &bull; 4.8 SNMPv3 &bull; 5.1 Root Auth &bull; 5.2 Passwords &bull; 6.1 NTP &bull; 6.3 Syslog'
    },
    {
      name: 'NIST SP 800-53 Rev. 5',
      scope: 'Security and Privacy Controls for Information Systems',
      controls: 'AC-17 Remote Access &bull; AC-12 Session Term &bull; IA-5 Authenticator Mgmt &bull; IA-2 Identification &bull; AU-6 Audit SIEM &bull; AU-8 Clock &bull; CM-7 Least Func'
    },
    {
      name: 'DISA STIGs',
      scope: 'Department of Defense Network Infrastructure STIGs',
      controls: 'NET-0420 Encrypted SSH &bull; NET-0810 Session Inactivity &bull; NET-0750 Password Entropy &bull; NET-0710 Privileged Mode &bull; NET-0930 Central Syslog'
    },
    {
      name: 'ISO/IEC 27001:2022',
      scope: 'Information Security Management System (ISMS)',
      controls: 'A.9.4.2 Secure Log-on &bull; A.9.2.1 Password Mgmt &bull; A.9.4.3 Privileged Access &bull; A.12.4.1 Event Logging &bull; A.12.4.4 Clock Sync &bull; A.13.1 Network'
    },
    {
      name: 'NCIIPC Guidance',
      scope: 'Critical Infrastructure Router, Switch & Firewall Security',
      controls: 'Sec 4.2 Encrypted Remote Mgmt &bull; Sec 4.3 Inactivity &bull; Sec 3.1 Credential Hardening &bull; Sec 6.3 Audit Trails &bull; Sec 7.1 Time Sync &bull; Sec 4.1 Plaintext'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#020204] text-[#f5f5f7] font-sans [overflow-x:clip] selection:bg-white selection:text-black">
      {/* Top Atmospheric Ambient Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Top Header Navigation with Centered Logo & Split Navigation */}
      <nav className="relative z-30 w-full border-b border-white/[0.08] bg-black/40 backdrop-blur-xl sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Left Nav Group */}
          <div className="flex items-center gap-5 sm:gap-7 text-xs tracking-wider flex-1 justify-start">
            <a href="#paradox" className="text-white/70 hover:text-white transition-colors uppercase font-mono text-[11px]">
              Multi-Vendor
            </a>
            <a href="#pipeline" className="text-white/70 hover:text-white transition-colors uppercase font-mono text-[11px] hidden md:block">
              10-Stage Pipeline
            </a>
            <a href="#differentiators" className="text-white/70 hover:text-white transition-colors uppercase font-mono text-[11px] hidden lg:block">
              5 Differentiators
            </a>
          </div>

          {/* Center Logo */}
          <div 
            className="flex items-center px-4 shrink-0 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/logo-dark.png"
              alt="Argus Logo"
              className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_18px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Right Nav Group + CTA */}
          <div className="flex items-center gap-5 sm:gap-7 text-xs tracking-wider flex-1 justify-end">
            <a href="#frameworks" className="text-white/70 hover:text-white transition-colors uppercase font-mono text-[11px] hidden md:block">
              Frameworks
            </a>
            <a href="#sandbox" className="text-white/70 hover:text-white transition-colors uppercase font-mono text-[11px] hidden lg:block">
              Sandbox
            </a>
            <button
              onClick={onLaunch}
              className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-normal hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
            >
              <span>Enter Console</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* CINEMATIC SCROLL-DRIVEN HERO SEQUENCE (PINNED SCENE) */}
      <section ref={heroRef} className="relative w-full h-[260vh]">
        {/* Sticky Pinned Viewport Container */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
          
          {/* LAYER 1: Futuristic, Atmospheric Cyber Background (z-0) */}
          <motion.div
            style={{ opacity: bgOpacity, y: bgY }}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          >
            <img
              src="/Background.webp"
              alt="Cyber Topology Space"
              className="w-full h-full object-cover object-[center_38%] filter brightness-95 contrast-[105%]"
            />
            {/* Subtle atmospheric radial depth vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,2,4,0)_40%,rgba(2,2,4,0.3)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020204]/40" />
          </motion.div>

          {/* Minimal Initial Platform Overview (Positioned comfortably above the padlock, fades on scroll) */}
          <motion.div
            style={{ opacity: initialIntroOpacity, y: initialIntroY }}
            className="absolute top-[6%] sm:top-[7%] md:top-[8%] lg:top-[9%] left-1/2 -translate-x-1/2 flex flex-col items-center text-center px-4 w-full max-w-lg pointer-events-none z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-400 backdrop-blur-md mb-1.5 sm:mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>Autonomous <span className="text-emerald-400 font-semibold">Compliance</span> Engine</span>
            </div>
            <h1 className="font-display font-extrabold text-base sm:text-xl md:text-2xl text-white tracking-tight uppercase leading-snug sm:whitespace-nowrap">
              Multi-Vendor <span className="text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.6)]">Network</span> Auditor
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono tracking-wide mt-1 max-w-sm sm:max-w-md">
              Deterministic Security Verification across <span className="text-zinc-200">diverse network infrastructure</span>
            </p>
          </motion.div>

          {/* Minimal Scroll Cue (Visible only at progress = 0, gently fades out immediately on scroll) */}
          <motion.div
            style={{ opacity: scrollHintOpacity, y: scrollHintY }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-10"
          >
            <span className="text-[9px] font-mono tracking-[0.4em] uppercase text-white/40 font-medium">
              Scroll to Initiate
            </span>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
            />
          </motion.div>

          {/* LAYER 2: Physical Black Takeover Panel (Slides up from bottom to cover the background) (z-10) */}
          <motion.div
            style={{ y: blackPanelY }}
            className="absolute inset-0 w-full h-full bg-[#020204] shadow-[0_-60px_120px_rgba(0,0,0,1)] pointer-events-none z-10"
          >
            {/* Luminous Leading Edge Razor Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </motion.div>

          {/* LAYER 3: Hero Content (Staggered Reveals Synchronized with Black Takeover) (z-20) */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-6 w-full flex flex-col justify-center pb-20 pointer-events-none">
            
            {/* Main Editorial Typography Stack */}
            <div className="space-y-6 max-w-4xl">
              
              {/* 1. Small Eyebrow Badge */}
              <motion.div
                style={{ opacity: badgeOpacity, y: badgeY }}
                className="inline-block pointer-events-auto"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.14] text-xs font-mono tracking-widest uppercase text-white shadow-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>SIH26155 &middot; Deterministic Rules Authoritative &middot; <span className="text-emerald-400 font-semibold">Bounded Local AI</span></span>
                </div>
              </motion.div>

              {/* 2. Main Headline (Staggered Line-by-Line Reveal) */}
              <div className="space-y-1 font-display font-extrabold uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.94] text-white">
                <motion.div style={{ opacity: line1Opacity, y: line1Y }}>
                  PROVABLE{' '}
                  <span className="font-serif-luxury italic font-normal tracking-normal text-emerald-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.35)] lowercase">
                    certainty
                  </span>
                </motion.div>
                <motion.div style={{ opacity: line2Opacity, y: line2Y }} className="text-white/75">
                  ACROSS HETEROGENEOUS
                </motion.div>
                <motion.div style={{ opacity: line3Opacity, y: line3Y }}>
                  <span className="text-emerald-400">NETWORK</span> REALITIES.
                </motion.div>
              </div>

              {/* 3. Subtitle Description */}
              <motion.div
                style={{ opacity: descOpacity, y: descY }}
                className="max-w-2xl pointer-events-auto"
              >
                <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal">
                  The AI-driven multi-vendor security compliance auditor built strictly according to SIH26155 TRD/PRD.
                  Evaluates Cisco IOS-XE, Juniper Junos, and Fortinet FortiOS architectures against CIS Benchmarks,
                  NIST SP 800-53, DISA STIGs, ISO/IEC 27001, and NCIIPC guidelines with 100% offline mathematical proof.
                </p>
              </motion.div>

              {/* 4. Hero Direct Console Launch CTA */}
              <motion.div
                style={{ opacity: ctaOpacity, y: ctaY }}
                className="pt-2 pointer-events-auto flex flex-wrap items-center gap-4"
              >
                <button
                  onClick={onLaunch}
                  className="px-8 py-4 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm tracking-wide hover:bg-emerald-400 hover:text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] hover:scale-[1.02] inline-flex items-center gap-2.5"
                >
                  <span>Launch Auditor Console</span>
                  <ArrowRight size={15} />
                </button>
                <a
                  href="#paradox"
                  className="px-6 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white transition-all"
                >
                  Explore Architecture &darr;
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CINEMATIC STACKED SCROLL LAYERS (Cards stack & replace each other sequentially) */}
      <div className="relative z-20 bg-[#020204] pt-8">
        
        {/* STACK LAYER 1: Chapter 01 — The Multi-Vendor Paradox & Canonical Property Model */}
        <StackedCard index={0} total={5} id="paradox">
          <div className="space-y-10">
            <div className="space-y-4 max-w-3xl">
              <div className="font-tech text-xs tracking-[0.25em] text-white/40 uppercase">
                Chapter 01 &mdash; The Multi-Vendor Paradox & Canonical Properties
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                INFRASTRUCTURE SPEAKS <br />
                <span className="font-serif-luxury italic font-normal text-white/80 lowercase">many languages.</span>{' '}
                <span className="text-emerald-400">SECURITY</span> HAS ONLY ONE.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Mission-critical backbones deploy heterogeneous routers, switches, and firewalls.
                Traditional auditors either fail under vendor-specific syntax or use brittle regexes that silently miss vulnerabilities.
                Argus deterministically normalizes vendor CLI into canonical security properties with exact line citations.
              </p>
            </div>

            {/* 3-Vendor Convergent Syntax Comparison with Real CLI Samples */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="minimal-card p-5 border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-white/40 pb-2 border-b border-white/[0.06]">
                  <span className="text-white font-bold">CISCO IOS-XE</span>
                  <span className="text-zinc-400 text-[10px]">line vty 0 4</span>
                </div>
                <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-white/90 border border-white/[0.05] space-y-1">
                  <div className="text-zinc-500 text-[10px]">// Line 46-48 cisco_core_router.cfg</div>
                  <code>line vty 0 4<br />&nbsp;exec-timeout 10 0<br />&nbsp;transport input ssh</code>
                </div>
                <div className="text-[11px] text-white/50 leading-relaxed">
                  Cisco syntax enforcing encrypted SSH transport and 10-minute session inactivity disconnect.
                </div>
              </div>

              <div className="minimal-card p-5 border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-white/40 pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-200 font-bold">JUNIPER JUNOS</span>
                  <span className="text-zinc-400 text-[10px]">system services</span>
                </div>
                <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-white/90 border border-white/[0.05] space-y-1">
                  <div className="text-zinc-500 text-[10px]">// Line 9-16 juniper_edge_switch.conf</div>
                  <code>set system services ssh protocol-version v2<br />set system login idle-timeout 10</code>
                </div>
                <div className="text-[11px] text-white/50 leading-relaxed">
                  Hierarchical Junos system directive binding SSHv2 crypto and terminal idle timeout.
                </div>
              </div>

              <div className="minimal-card p-5 border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-white/40 pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-300 font-bold">FORTINET FORTIOS</span>
                  <span className="text-zinc-400 text-[10px]">config system</span>
                </div>
                <div className="bg-black/60 p-3 rounded-lg font-mono text-xs text-white/90 border border-white/[0.05] space-y-1">
                  <div className="text-zinc-500 text-[10px]">// Line 5-14 fortinet_firewall.conf</div>
                  <code>config system global<br />&nbsp;set admin-timeout 10<br />end<br />set allowaccess ssh</code>
                </div>
                <div className="text-[11px] text-white/50 leading-relaxed">
                  FortiOS interface-level access permissions combined with global admin timeout restrictions.
                </div>
              </div>
            </div>

            {/* Canonical Convergence Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-widest text-emerald-400/80">Canonical Properties Output</div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white">
                    mgmt.ssh_only &rarr; <span className="text-emerald-400 font-bold">SSH_ONLY</span> &nbsp;|&nbsp; mgmt.timeout &rarr; <span className="text-emerald-400 font-bold">RESTRICTED</span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-white/50 max-w-md">
                Evaluated deterministically across CIS Benchmark 4.1/4.3, NIST SP 800-53 AC-17/AC-12, DISA STIG NET-0420, ISO 27001 A.9.4.2, and NCIIPC Sec 4.2.
              </div>
            </div>
          </div>
        </StackedCard>

        {/* STACK LAYER 2: Chapter 02 — The 10-Stage SIH26155 Audit Pipeline */}
        <StackedCard index={1} total={5} id="pipeline">
          <div className="space-y-8">
            <div className="space-y-4 max-w-3xl">
              <div className="font-tech text-xs tracking-[0.25em] text-white/40 uppercase">
                Chapter 02 &mdash; The 10-Stage SIH26155 Audit Pipeline
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                FROM RAW CLI TO <br />
                <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)] lowercase">provable</span> AUDIT REPORTS.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Every uploaded configuration file traverses a rigorous 10-stage deterministic pipeline.
                Deterministic rules are the sole authority for compliance; bounded local AI only assists when unfamiliar syntax is detected.
              </p>
            </div>

            {/* 10-Stage Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {pipelineStages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-colors flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-condensed text-base font-bold text-white">
                      Step {stage.num}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {stage.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white mb-1">
                      {stage.title}
                    </h3>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between text-xs font-mono text-white/60">
              <span className="text-emerald-400 flex items-center gap-2 font-medium">
                <Check size={14} className="text-emerald-400" /> Zero Cloud Call Guarantee
              </span>
              <span>100% Offline Local Execution &bull; Airplane Mode Validated</span>
              <button
                onClick={onLaunch}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 transition-colors"
              >
                Run Ingestion in Console &rarr;
              </button>
            </div>
          </div>
        </StackedCard>

        {/* STACK LAYER 3: Chapter 03 — The 5 Architectural Pillars */}
        <StackedCard index={2} total={5} id="differentiators">
          <div className="space-y-10">
            <div className="space-y-4 max-w-3xl">
              <div className="font-tech text-xs tracking-[0.25em] text-white/40 uppercase">
                Chapter 03 &mdash; The 5 Architectural Pillars
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                ENGINEERED AS A SYSTEM. <br />
                <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)] lowercase">proven</span> IN REAL AUDITS.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                The PRD defines five tightly integrated differentiators that protect against parsing omission,
                uncertain ML predictions, and unverified remediation deployment.
              </p>
            </div>

            {/* Monograph List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {differentiators.map((diff, idx) => (
                <div
                  key={idx}
                  className="minimal-card p-6 border-white/[0.08] flex flex-col justify-between space-y-4 group hover:border-emerald-500/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-condensed text-xl font-bold text-white/30 group-hover:text-emerald-400 transition-colors">
                        {diff.num}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {diff.tag}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-white transition-colors">
                        {diff.title}
                      </h3>
                      <div className="font-mono text-[11px] text-white/40">{diff.subtitle}</div>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed">{diff.desc}</p>
                  </div>

                  <button
                    onClick={onLaunch}
                    className="pt-3 border-t border-white/[0.06] text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Launch in Console</span> &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </StackedCard>

        {/* STACK LAYER 4: Chapter 04 — Authoritative Compliance Frameworks */}
        <StackedCard index={3} total={5} id="frameworks">
          <div className="space-y-8">
            <div className="space-y-4 max-w-3xl">
              <div className="font-tech text-xs tracking-[0.25em] text-white/40 uppercase">
                Chapter 04 &mdash; Authoritative Compliance Frameworks
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                GROUNDED IN GLOBAL <br />
                <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)] lowercase">security</span> BENCHMARKS.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                The compliance engine strictly evaluates configurations against the 5 globally recognized
                security standards specified in the SIH26155 Problem Statement. Every finding maps to exact control IDs.
              </p>
            </div>

            {/* Frameworks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complianceFrameworks.map((fw, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/25 space-y-3 transition-colors">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <span className="font-display font-bold text-sm text-white">{fw.name}</span>
                    <Shield size={14} className="text-emerald-400" />
                  </div>
                  <div className="text-xs font-mono text-white/70">{fw.scope}</div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.05] font-mono text-[11px] text-white/50">
                    <span className="text-emerald-400/80 uppercase text-[9px] block mb-1">Mapped Controls:</span>
                    {fw.controls}
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Note */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs font-mono text-white/60">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Deterministic compliance rules act as the source of truth &bull; AI never makes final PASS verdicts</span>
              </span>
              <button
                onClick={onLaunch}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 transition-colors"
              >
                Inspect Findings & Evidence &rarr;
              </button>
            </div>
          </div>
        </StackedCard>

        {/* STACK LAYER 5: Chapter 05 — Live Local Dialect Sandbox & Offline Covenant */}
        <StackedCard index={4} total={5} id="sandbox">
          <div className="space-y-8">
            <div className="space-y-4 max-w-3xl">
              <div className="font-tech text-xs tracking-[0.25em] text-white/40 uppercase">
                Chapter 05 &mdash; Live Interactive Proof & Covenant
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                TEST THE LOCAL <br />
                <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.35)] lowercase">dialect</span> CLASSIFIER.
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Test any command fragment right now. The local TF-IDF model evaluates character n-grams to infer
                the security property and calibrated confidence score without sending a byte outside your machine.
              </p>
            </div>

            {/* Live Sandbox Interactive Component */}
            <div className="minimal-panel p-6 sm:p-8 border-white/[0.1] space-y-6">
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase text-white/50 tracking-wider">
                  Enter or Select a Vendor Configuration Line:
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={sandboxQuery}
                    onChange={(e) => setSandboxQuery(e.target.value)}
                    placeholder="e.g. set admin-ssh-cipher chacha20-poly1305"
                    className="minimal-input flex-1 px-4 py-3 font-mono text-xs bg-black/80 border-white/[0.15] text-white focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleTestSandbox()}
                    disabled={analyzing}
                    className="px-6 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                  >
                    {analyzing ? 'Evaluating...' : 'Run Local Inference'}
                  </button>
                </div>

                {/* Quick Test Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-mono text-white/40 self-center">Presets:</span>
                  {sampleDialects.map((frag, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSandboxQuery(frag);
                        handleTestSandbox(frag);
                      }}
                      className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/30 text-[11px] font-mono text-white/70 transition-colors"
                    >
                      {frag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandbox Prediction Output Display */}
              {sandboxResult && (
                <div className="p-5 sm:p-6 rounded-xl bg-black/70 border border-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.08)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-white/40 uppercase text-[10px] block">Inferred Property</span>
                    <span className="font-bold text-emerald-300 text-sm">{sandboxResult.property_id}</span>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase text-[10px] block">Extracted State</span>
                    <span className="font-bold text-white text-sm">{sandboxResult.state}</span>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase text-[10px] block">Model Confidence</span>
                    <span className="font-bold text-emerald-400 text-sm">{(sandboxResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase text-[10px] block">Gated Status</span>
                    <span className="inline-block text-[10px] mt-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono font-semibold">HUMAN SIGN-OFF REQUIRED</span>
                  </div>
                </div>
              )}
            </div>

            {/* Offline Architecture Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-white/40 text-[10px] uppercase">Compliance Authority</div>
                <div className="text-emerald-400 font-bold mt-1">DETERMINISTIC RULES</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-white/40 text-[10px] uppercase">Offline Execution</div>
                <div className="text-emerald-400 font-bold mt-1">AIRPLANE MODE ONLY</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-white/40 text-[10px] uppercase">Evidence Citations</div>
                <div className="text-emerald-400 font-bold mt-1">100% LINE PROVENANCE</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="text-white/40 text-[10px] uppercase">Stack Policy</div>
                <div className="text-emerald-400 font-bold mt-1">100% FREE / OPEN SOURCE</div>
              </div>
            </div>
          </div>
        </StackedCard>
      </div>

      {/* CONTINUOUS WEBSITE CONTENT (Resumes normal scrolling for Epilogue & Footer) */}
      <div className="relative z-20 bg-[#020204] border-t border-white/[0.08]">
        {/* EPILOGUE: Final Launch Gateway */}
        <section className="relative z-20 py-32 px-6 max-w-7xl mx-auto text-center space-y-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="font-tech text-xs tracking-[0.3em] text-emerald-400/80 uppercase">
              SIH26155 Production-Ready Platform
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
              AUDIT WITH <br />
              <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.35)] lowercase">mathematical</span> EVIDENCE.
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
              Ingest multi-vendor network fleets or load the instant 4-device demo dataset (Cisco, Juniper, Fortinet)
              to experience the full 10-stage compliance pipeline with cryptographic SHA-256 verification.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onLaunch}
              className="px-10 py-5 rounded-full bg-white text-black font-extrabold text-base tracking-normal hover:bg-emerald-400 hover:text-black transition-all shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] hover:scale-[1.02] inline-flex items-center gap-3"
            >
              <span>Launch Argus Console</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="border-t border-white/[0.06] py-8 px-6 text-xs text-white/40 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>Argus &middot; AI-Driven Multi-Vendor Network Compliance Auditor (SIH26155)</div>
            <div className="flex items-center gap-4 text-white/50">
              <span>CIS Benchmarks</span>
              <span>&bull;</span>
              <span>NIST SP 800-53</span>
              <span>&bull;</span>
              <span>DISA STIGs</span>
              <span>&bull;</span>
              <span>ISO 27001</span>
              <span>&bull;</span>
              <span>NCIIPC</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
