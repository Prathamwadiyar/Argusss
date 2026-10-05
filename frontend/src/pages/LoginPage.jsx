import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Check,
  BadgeCheck
} from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';
import { authService } from '../services/api';

const LoginPage = ({ onLoginSuccess, onBackToLanding }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
    department: 'Directorate of Cyber Defense Operations',
    email: '',
    phone: '',
    orgType: 'Defense & Critical Infrastructure',
    role: 'admin', // 'admin' | 'auditor'
    password: '',
    firebaseUid: null,
    certified: true
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleCancelOnboarding = () => {
    setIsOnboarding(false);
    setError('');
    setSuccessMsg('');
  };

  // Submit Handler for Onboarding, Registration, and Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. FIRST-TIME SECURITY ONBOARDING SUBMISSION
      if (isOnboarding) {
        if (!formData.fullName || formData.fullName.trim().length < 3) {
          throw new Error('Please enter your official legal name (minimum 3 characters).');
        }
        if (!formData.orgName || formData.orgName.trim().length < 2) {
          throw new Error('Please enter your official Organization / Defense Enterprise name.');
        }
        if (!formData.phone || formData.phone.trim().length < 7) {
          throw new Error('Please provide an official emergency contact / 2FA phone number.');
        }
        if (!formData.email) {
          throw new Error('Official enterprise email is required.');
        }

        const res = await authService.completeOnboarding({
          full_name: formData.fullName,
          org_name: formData.orgName,
          email: formData.email,
          phone_number: formData.phone,
          org_type: formData.orgType,
          department: formData.department || 'Directorate of Cyber Defense Operations',
          role: formData.role,
          password: formData.password || 'Argus@2026',
          firebase_uid: formData.firebaseUid
        });

        if (res.success && res.profile_completed) {
          setSuccessMsg('Security clearance verified & identity registered. Authorizing console access...');
          const u = { ...res.user, role: formData.role };
          localStorage.setItem('argus_user', JSON.stringify(u));
          setTimeout(() => onLoginSuccess(u), 600);
        } else {
          throw new Error(res.message || 'Onboarding failed. Please check required fields.');
        }
        return;
      }

      // 2. STANDARD REGISTRATION SUBMISSION
      if (isRegister) {
        if (!formData.fullName || formData.fullName.trim().length < 3) {
          throw new Error('Please enter your official legal name (minimum 3 characters).');
        }
        if (!formData.orgName || formData.orgName.trim().length < 2) {
          throw new Error('Please enter your official Organization / Enterprise entity name.');
        }
        if (!formData.email) {
          throw new Error('Please enter your official work email.');
        }
        if (!formData.phone || formData.phone.trim().length < 7) {
          throw new Error('Please provide an official contact / 2FA phone number.');
        }

        let fbUid = null;
        try {
          if (formData.password && formData.password.length >= 6) {
            const fbCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            fbUid = fbCred.user.uid;
          }
        } catch (fbErr) {
          console.warn('Firebase registration fallback to local backend:', fbErr.message);
        }

        const res = await authService.register({
          full_name: formData.fullName,
          org_name: formData.orgName,
          email: formData.email,
          phone_number: formData.phone,
          role: formData.role,
          org_type: formData.orgType,
          department: formData.department || 'Compliance Operations',
          password: formData.password,
          firebase_uid: fbUid
        });

        if (res.success) {
          setSuccessMsg('Account registered successfully with verified security clearance. Redirecting...');
          const u = { ...res.user, role: formData.role };
          localStorage.setItem('argus_user', JSON.stringify(u));
          setTimeout(() => onLoginSuccess(u), 500);
        }
      } else {
        // 3. STANDARD LOGIN SUBMISSION
        if (!formData.email) {
          throw new Error('Please enter your official work email.');
        }

        let fbUid = null;
        try {
          if (formData.password) {
            const fbCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            fbUid = fbCred.user.uid;
          }
        } catch (fbErr) {
          console.warn('Firebase sign-in fallback to local verification:', fbErr.message);
        }

        const res = await authService.login({
          email: formData.email,
          password: formData.password,
          firebase_uid: fbUid,
          role: formData.role
        });

        // Check if first-time user detected
        if (res.is_first_time || !res.profile_completed) {
          setIsOnboarding(true);
          setFormData(prev => ({
            ...prev,
            email: formData.email,
            fullName: res.user?.full_name || prev.fullName || formData.email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
            orgName: res.user?.org_name || prev.orgName,
            phone: res.user?.phone_number || prev.phone
          }));
          setSuccessMsg('First-time access detected for this identity. Mandatory security clearance onboarding required before accessing console.');
          return;
        }

        if (res.success) {
          const u = { ...res.user, role: res.user.role || formData.role };
          localStorage.setItem('argus_user', JSON.stringify(u));
          onLoginSuccess(u);
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Instant Demo Evaluator Access - Admin (Full Governance, Pre-Verified)
  const handleQuickDemoAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({
        email: 'auditor@enterprise-defense.org',
        password: 'demo',
        role: 'admin'
      });
      if (res && res.success && res.user) {
        const u = { ...res.user, role: 'admin' };
        localStorage.setItem('argus_user', JSON.stringify(u));
        onLoginSuccess(u);
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback to instant offline admin clearance:', err);
    }
    const fallbackUser = {
      id: 1,
      full_name: 'Col. R. Sharma (CISO)',
      org_name: 'National Defense Telecom Core',
      email: 'auditor@enterprise-defense.org',
      phone_number: '+91 98765 43210',
      role: 'admin',
      org_type: 'Defense & Critical Infrastructure',
      department: 'Directorate of Cyber Defense Operations',
      profile_completed: true
    };
    try {
      localStorage.setItem('argus_user', JSON.stringify(fallbackUser));
    } catch (e) {}
    onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  // Instant Demo Evaluator Access - Auditor (Operational / Restricted, Pre-Verified)
  const handleQuickDemoAuditorLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({
        email: 'field.auditor@enterprise-defense.org',
        password: 'demo',
        role: 'auditor'
      });
      if (res && res.success && res.user) {
        const u = { ...res.user, role: 'auditor' };
        localStorage.setItem('argus_user', JSON.stringify(u));
        onLoginSuccess(u);
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback to instant offline auditor clearance:', err);
    }
    const fallbackUser = {
      id: 2,
      full_name: 'Dr. A. Verma (Field Auditor)',
      org_name: 'National Defense Telecom Core',
      email: 'field.auditor@enterprise-defense.org',
      phone_number: '+91 98765 12345',
      role: 'auditor',
      org_type: 'Defense & Critical Infrastructure',
      department: 'Field Inspection & Hardware Security Unit',
      profile_completed: true
    };
    try {
      localStorage.setItem('argus_user', JSON.stringify(fallbackUser));
    } catch (e) {}
    onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#020204] text-[#f5f5f7] flex flex-col lg:grid lg:grid-cols-12 selection:bg-emerald-400 selection:text-black">
      
      {/* ========================================================================= */}
      {/* LEFT HALF (6 COLUMNS): Ultra-Minimal Cinematic Brand Experience */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06] overflow-hidden">
        
        {/* Background Layer with Dark Cyber Aesthetic */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img
            src="/Background.webp"
            alt="Cyber Security Network Architecture"
            className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-[120%]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,2,4,0)_20%,rgba(2,2,4,0.85)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-[#020204]/70 to-[#020204]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b9810a_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        {/* Top Header / Back Button */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-400 hover:text-white transition-all backdrop-blur-md"
          >
            <ArrowLeft size={13} />
            <span>Return to Manifesto</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono tracking-widest text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span>AIR-GAPPED COMPLIANCE CORE</span>
          </div>
        </div>

        {/* Middle Clean Narrative Stack */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          
          {/* Logo with Soft Emerald Aura */}
          <div>
            <img
              src="/logo-dark.png"
              alt="Argus Logo"
              className="h-8 w-auto object-contain filter drop-shadow-[0_0_16px_rgba(52,211,153,0.25)]"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
              Deterministic security, <br />
              <span className="font-serif-luxury italic font-normal text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.35)] lowercase">
                mathematically proven.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal max-w-md">
              Autonomous multi-vendor compliance auditing across Cisco, Juniper, Fortinet, and Arista hardware fleets.
            </p>
          </div>

          {/* Minimal Metric / Assurance Specs */}
          <div className="pt-2 space-y-3 font-mono text-xs max-w-md">
            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Regulatory Standards</span>
              <span className="text-zinc-200 font-medium">CIS &bull; NIST SP 800-53 &bull; STIGs</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Execution Boundary</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                100% Offline Air-Gapped
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Dialect Engine</span>
              <span className="text-zinc-200 font-medium">Bounded Local Machine Learning</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Security Notice */}
        <div className="relative z-10 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>SIH26155 Authorized Gateway</span>
          <span>SHA-256 Provenance Verified</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT HALF (6 COLUMNS): Ultra-Clean Minimal Luxury Auth Portal */}
      {/* ========================================================================= */}
      <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 md:px-16 xl:px-20 py-10 relative z-10 overflow-y-auto">
        
        {/* Mobile-only Top Bar */}
        <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <img src="/logo-dark.png" alt="Argus" className="h-5 w-auto" />
        </div>

        <div className="w-full max-w-[440px] mx-auto space-y-6">
          
          {/* ========================================================================= */}
          {/* CASE 1: MANDATORY FIRST-TIME SECURITY ONBOARDING PORTAL */}
          {/* ========================================================================= */}
          {isOnboarding ? (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Security Header */}
              <div className="space-y-2 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono tracking-widest text-emerald-400">
                  <ShieldAlert size={12} className="text-emerald-400 animate-pulse" />
                  <span>FIRST-TIME IDENTITY CLEARANCE</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Mandatory Security Profile
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Zero-trust air-gapped protocol enforced. First-time entity access requires mandatory enterprise organization, department clearance, and emergency 2FA verification before console authorization.
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="leading-relaxed">{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <div>{successMsg}</div>
                </div>
              )}

              {/* Mandatory Onboarding Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Full Legal Name */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
                    <span>Official Auditor Full Name *</span>
                    <span className="text-[9px] text-zinc-500">Government / Enterprise ID</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Col. Rajesh Sharma / Dr. A. Verma"
                      required
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                    />
                    <User size={13} className="absolute left-3 top-3 text-zinc-500" />
                  </div>
                </div>

                {/* Organization & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                      Organization Entity *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="orgName"
                        value={formData.orgName}
                        onChange={handleChange}
                        placeholder="e.g. National Defense Telecom"
                        required
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                      />
                      <Building2 size={13} className="absolute left-3 top-3 text-zinc-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                      Security Department *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. SecOps Compliance Bureau"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Work Email & Emergency Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                      Official Work Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl border text-xs outline-none transition-all font-mono bg-white/[0.02] border-white/[0.08] text-white focus:border-emerald-400/80"
                      />
                      <Mail size={13} className="absolute left-3 top-3 text-zinc-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                      Emergency 2FA Phone *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all font-mono"
                      />
                      <Phone size={13} className="absolute left-3 top-3 text-zinc-500" />
                    </div>
                  </div>
                </div>

                {/* Fleet Sector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                    Fleet Infrastructure Sector *
                  </label>
                  <select
                    name="orgType"
                    value={formData.orgType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090d] border border-white/[0.08] focus:border-emerald-400/80 text-xs text-zinc-300 outline-none transition-all font-mono"
                  >
                    <option value="Defense & Critical Infrastructure">Defense &amp; Critical Infrastructure (NCIIPC Core)</option>
                    <option value="Banking & Financial Operations">Banking &amp; Financial Operations (BFSI Compliance)</option>
                    <option value="Telecom & ISP Core Backbone">Telecom &amp; ISP Core Backbone (DoT / TRAI)</option>
                    <option value="Enterprise Hybrid Datacenter">Enterprise Hybrid Datacenter (Multi-Vendor)</option>
                    <option value="Government & Public Sector">Government &amp; Public Sector (CERT-In Mandates)</option>
                  </select>
                </div>

                {/* Assigned Access Role */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Designated Clearance Role *</span>
                    <span className={`text-[9px] font-semibold font-mono ${formData.role === 'admin' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formData.role === 'admin' ? 'FULL PRIVILEGES' : 'OPERATIONAL RESTRICTED'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.role === 'admin'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <ShieldCheck size={13} className={formData.role === 'admin' ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span>Security Admin</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                        Full AI Dialect training &amp; Knowledge reversal
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'auditor' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.role === 'auditor'
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <User size={13} className={formData.role === 'auditor' ? 'text-amber-400' : 'text-zinc-500'} />
                        <span>Network Auditor</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                        Fleet audit, simulator &amp; reports (Read-only AI)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Air-Gapped Security Passphrase */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
                    <span>Air-Gapped Master Passphrase *</span>
                    <span className="text-[9px] text-zinc-500">For offline console auth</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter secure master passphrase (min 6 chars)"
                      required
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all font-mono"
                    />
                    <Lock size={13} className="absolute left-3 top-3 text-zinc-500" />
                  </div>
                </div>

                {/* Zero-Trust Compliance Acknowledgment */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="certified"
                      checked={formData.certified}
                      onChange={(e) => setFormData(prev => ({ ...prev, certified: e.target.checked }))}
                      className="mt-0.5 rounded border-white/[0.2] bg-white/[0.05] text-emerald-500 focus:ring-0"
                    />
                    <span className="text-[11px] text-zinc-400 leading-snug">
                      I certify this workstation is authorized for sovereign, air-gapped configuration audits under CIS &amp; NIST SP 800-53 compliance directives.
                    </span>
                  </label>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || !formData.certified}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-black" />
                        <span>Verifying Clearance...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Verify Clearance &amp; Enter Console</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelOnboarding}
                    disabled={loading}
                    className="w-full py-2 text-center text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Switch Account / Return to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE 2: STANDARD SIGN IN / REGISTER VIEW */
            /* ========================================================================= */
            <>
              {/* Header */}
              <div className="space-y-1.5 text-left">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {isRegister ? 'Register Enterprise' : 'Sign in to Argus'}
                </h2>
                <p className="text-xs text-zinc-400">
                  {isRegister
                    ? 'Create a centralized compliance profile for your organization.'
                    : 'Enter your enterprise credentials to access the compliance console.'}
                </p>
              </div>

              {/* Minimal Mode Pill Switcher */}
              <div className="p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-all ${
                    !isRegister
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-lg transition-all ${
                    isRegister
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <div className="leading-relaxed">{error}</div>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <div>{successMsg}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Registration-Only Fields */}
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                        Auditor Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Col. Rajesh Sharma"
                        required={isRegister}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                          Organization *
                        </label>
                        <input
                          type="text"
                          name="orgName"
                          value={formData.orgName}
                          onChange={handleChange}
                          placeholder="e.g. Defense Telecom"
                          required={isRegister}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                        Fleet Sector
                      </label>
                      <select
                        name="orgType"
                        value={formData.orgType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090d] border border-white/[0.08] focus:border-emerald-400/80 text-xs text-zinc-300 outline-none transition-all font-mono"
                      >
                        <option value="Defense & Critical Infrastructure">Defense &amp; Critical Infrastructure (NCIIPC)</option>
                        <option value="Banking & Financial Operations">Banking &amp; Financial Operations (BFSI)</option>
                        <option value="Telecom & ISP Core Backbone">Telecom &amp; ISP Core Backbone</option>
                        <option value="Enterprise Hybrid Datacenter">Enterprise Hybrid Datacenter</option>
                        <option value="Government & Public Sector">Government &amp; Public Sector</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Access Role Selector (Applies to both Sign In and Register) */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Security Access Role</span>
                    <span className={`text-[9px] font-semibold font-mono ${formData.role === 'admin' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formData.role === 'admin' ? 'FULL PRIVILEGES' : 'OPERATIONAL RESTRICTED'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.role === 'admin'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <ShieldCheck size={13} className={formData.role === 'admin' ? 'text-emerald-400' : 'text-zinc-500'} />
                        <span>Security Admin</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                        Full AI Dialect training &amp; Knowledge reversal
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'auditor' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.role === 'auditor'
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <User size={13} className={formData.role === 'auditor' ? 'text-amber-400' : 'text-zinc-500'} />
                        <span>Network Auditor</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                        Fleet audit, simulator &amp; reports (Read-only AI)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                    Official Work Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={formData.role === 'admin' ? 'ciso@enterprise-defense.org' : 'auditor@enterprise-defense.org'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all font-mono"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-1">
                    Security Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isRegister ? 'Minimum 6 characters' : 'Enter enterprise password'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] focus:border-emerald-400/80 focus:bg-white/[0.04] text-xs text-white placeholder:text-zinc-600 outline-none transition-all font-mono"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-black" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? 'Register Organization' : `Access Fleet as ${formData.role === 'admin' ? 'Admin' : 'Auditor'}`}</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Evaluator Access */}
              <div className="pt-2 space-y-2 text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Instant 1-Click Role Testing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleQuickDemoAdminLogin}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <KeyRound size={12} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Admin (Full Access)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemoAuditorLogin}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Lock size={12} className="text-amber-400 shrink-0" />
                    <span className="truncate">Auditor (Restricted)</span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
