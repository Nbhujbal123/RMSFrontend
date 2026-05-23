import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { FaMobileAlt, FaUser, FaArrowLeft, FaRedo, FaEnvelope } from 'react-icons/fa'
import { API_BASE_URL } from '../../config/api'
import { toast } from '../../components/Toast'

interface LoginProps {
  onClose: () => void
  onLoginSuccess: (token: string, user: any) => void
}

const Login: React.FC<LoginProps> = ({ onClose, onLoginSuccess }) => {
  // ── shared ──────────────────────────────────────────────────────────
  const [loginMode, setLoginMode] = useState<'otp' | 'email'>('otp')
  const [siteCode, setSiteCode] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('siteCode') || localStorage.getItem('siteCode') || ''
    setSiteCode(code.toUpperCase())
  }, [])

  // ── OTP flow state ───────────────────────────────────────────────────
  const [step, setStep]           = useState<1 | 2>(1)
  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [loadingOtp, setLoadingOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [otpErrors, setOtpErrors] = useState({ name: '', phone: '' })

  const otpRefs  = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // ── Email flow state ─────────────────────────────────────────────────
  const [emailName, setEmailName] = useState('')
  const [email, setEmail]         = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [emailErrors, setEmailErrors]   = useState({ name: '', email: '' })
  const [emailStep, setEmailStep] = useState<'form' | 'otp'>('form')
  const [emailOtp, setEmailOtp]   = useState(['', '', '', '', '', ''])
  const [emailResendTimer, setEmailResendTimer] = useState(0)
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const emailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (emailTimerRef.current) clearInterval(emailTimerRef.current) }, [])

  // ── helpers ──────────────────────────────────────────────────────────
  const prefixStyle: React.CSSProperties = {
    background: '#fff7f0', border: '1.5px solid #e0e0e0',
    borderRight: 'none', color: '#FF6A00',
  }
  const inputBase = (err: boolean): React.CSSProperties => ({
    border: `1.5px solid ${err ? '#ef4444' : '#e0e0e0'}`,
    borderLeft: 'none', padding: '12px 16px', fontSize: '15px',
    borderRadius: '0 8px 8px 0',
  })
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(90deg, #FF6A00, #FFA500)',
    border: 'none', borderRadius: '12px', fontSize: '15px',
  }

  // ── OTP handlers ─────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { name: '', phone: '' }
    if (!name.trim()) errs.name = 'Please enter your name'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10) errs.phone = 'Enter a valid 10-digit mobile number'
    if (errs.name || errs.phone) { setOtpErrors(errs); return }

    setLoadingOtp(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/send-login-otp`, { name: name.trim(), phone: cleaned, siteCode })
      toast.success('OTP sent to your mobile')
      setStep(2)
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoadingOtp(false)
    }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const updated = [...otp]; updated[i] = val; setOtp(updated)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); e.preventDefault() }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return }
    setLoadingOtp(true)
    let verified: { token: string; user: any } | null = null
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-login-otp`, {
        phone: phone.replace(/\D/g, ''), siteCode, otp: otpString,
      })
      verified = { token: res.data.token, user: res.data.user }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoadingOtp(false)
    }
    if (verified) {
      toast.success('Welcome ' + (verified.user?.name || '') + '!')
      onLoginSuccess(verified.token, verified.user)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || loadingOtp) return
    setOtp(['', '', '', '', '', ''])
    setLoadingOtp(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/send-login-otp`, {
        name: name.trim(), phone: phone.replace(/\D/g, ''), siteCode,
      })
      toast.success('OTP resent')
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoadingOtp(false)
    }
  }

  // ── Email OTP helpers ────────────────────────────────────────────────
  const startEmailResendTimer = () => {
    setEmailResendTimer(30)
    if (emailTimerRef.current) clearInterval(emailTimerRef.current)
    emailTimerRef.current = setInterval(() => {
      setEmailResendTimer(prev => {
        if (prev <= 1) { clearInterval(emailTimerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleEmailOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const updated = [...emailOtp]; updated[i] = val; setEmailOtp(updated)
    if (val && i < 5) emailOtpRefs.current[i + 1]?.focus()
  }

  const handleEmailOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtp[i] && i > 0) emailOtpRefs.current[i - 1]?.focus()
  }

  const handleEmailOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setEmailOtp(pasted.split('')); emailOtpRefs.current[5]?.focus(); e.preventDefault() }
  }

  // ── Send email OTP (name + email, no password) ───────────────────────
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = { name: '', email: '' }
    if (!emailName.trim()) errs.name = 'Please enter your name'
    if (!email.trim()) errs.email = 'Please enter your email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address'
    if (errs.name || errs.email) { setEmailErrors(errs); return }

    setLoadingEmail(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/send-email-login-otp`, {
        name: emailName.trim(),
        email: email.trim().toLowerCase(),
        siteCode,
      })
      toast.success('OTP sent to ' + email.trim())
      setEmailStep('otp')
      setEmailOtp(['', '', '', '', '', ''])
      startEmailResendTimer()
      setTimeout(() => emailOtpRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = emailOtp.join('')
    if (otpString.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return }
    setLoadingEmail(true)
    let verified: { token: string; user: any } | null = null
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-email-login-otp`, {
        email: email.trim().toLowerCase(),
        siteCode,
        otp: otpString,
      })
      verified = { token: res.data.token, user: res.data.user }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.')
      setEmailOtp(['', '', '', '', '', ''])
      setTimeout(() => emailOtpRefs.current[0]?.focus(), 50)
    } finally {
      setLoadingEmail(false)
    }
    if (verified) {
      toast.success('Welcome ' + (verified.user?.name || '') + '!')
      onLoginSuccess(verified.token, verified.user)
    }
  }

  const handleEmailResend = async () => {
    if (emailResendTimer > 0 || loadingEmail) return
    setEmailOtp(['', '', '', '', '', ''])
    setLoadingEmail(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/send-email-login-otp`, {
        name: emailName.trim(),
        email: email.trim().toLowerCase(),
        siteCode,
      })
      toast.success('OTP resent to ' + email.trim())
      startEmailResendTimer()
      setTimeout(() => emailOtpRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoadingEmail(false)
    }
  }

  // ── Switch mode — reset both forms ───────────────────────────────────
  const switchMode = (mode: 'otp' | 'email') => {
    setLoginMode(mode)
    setStep(1)
    setEmailStep('form')
    setOtp(['', '', '', '', '', ''])
    setEmailOtp(['', '', '', '', '', ''])
    setOtpErrors({ name: '', phone: '' })
    setEmailErrors({ name: '', email: '' })
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #FF6A00, #FFA500)',
            padding: '18px 24px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div className="d-flex align-items-center gap-2">
              {(loginMode === 'otp' && step === 2) || (loginMode === 'email' && emailStep === 'otp') ? (
                <button className="btn p-0 border-0" style={{ color: 'white', opacity: 0.85 }}
                  onClick={() => {
                    if (loginMode === 'otp') { setStep(1); setOtp(['', '', '', '', '', '']) }
                    else { setEmailStep('form'); setEmailOtp(['', '', '', '', '', '']) }
                  }}>
                  <FaArrowLeft />
                </button>
              ) : null}
              <div>
                <h5 className="mb-0 fw-bold text-white">
                  {(loginMode === 'otp' && step === 2) || (loginMode === 'email' && emailStep === 'otp')
                    ? 'Enter OTP' : 'Welcome Back'}
                </h5>
                <p className="mb-0 text-white" style={{ fontSize: '12px', opacity: 0.85 }}>
                  {loginMode === 'otp' && step === 2
                    ? `OTP sent to +91 ${phone}`
                    : loginMode === 'email' && emailStep === 'otp'
                      ? `OTP sent to ${email}`
                      : 'Sign in to continue ordering'}
                </p>
              </div>
            </div>
            <button className="btn p-0 border-0"
              style={{ color: 'white', fontSize: '22px', opacity: 0.8, lineHeight: 1 }}
              onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="modal-body px-4 py-4">
            {/* Logo */}
            <div className="text-center mb-3">
              <img src="/assets/images/Logo.png" alt="Logo" style={{ height: '44px', objectFit: 'contain' }} />
            </div>

            {/* ── Mode toggle tabs (hidden during any OTP step) ── */}
            {(loginMode === 'otp' ? step === 1 : emailStep === 'form') && (
              <div style={{
                display: 'flex', background: '#f3f4f6',
                borderRadius: '12px', padding: '4px', marginBottom: '20px',
              }}>
                {[
                  { key: 'otp',   label: 'Mobile OTP',       icon: <FaMobileAlt size={13} /> },
                  { key: 'email', label: 'Email & Password',  icon: <FaEnvelope  size={13} /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => switchMode(tab.key as 'otp' | 'email')}
                    style={{
                      flex: 1, padding: '9px 8px', border: 'none', borderRadius: '9px',
                      fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: loginMode === tab.key
                        ? 'linear-gradient(90deg,#FF6A00,#FFA500)' : 'transparent',
                      color: loginMode === tab.key ? '#fff' : '#9ca3af',
                      transition: 'all .2s',
                      boxShadow: loginMode === tab.key ? '0 2px 8px rgba(255,106,0,.3)' : 'none',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* ════════ OTP MODE ════════ */}
            {loginMode === 'otp' && (
              <>
                {/* Step 1: Name + Phone */}
                {step === 1 && (
                  <form onSubmit={handleSendOtp} noValidate>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: '#444', fontSize: '14px' }}>
                        Your Name
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={prefixStyle}><FaUser /></span>
                        <input
                          type="text" className="form-control"
                          placeholder="Enter your full name"
                          value={name} autoFocus
                          onChange={e => { setName(e.target.value); setOtpErrors(p => ({ ...p, name: '' })) }}
                          style={inputBase(!!otpErrors.name)}
                        />
                      </div>
                      {otpErrors.name && <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '5px 0 0' }}>{otpErrors.name}</p>}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ color: '#444', fontSize: '14px' }}>
                        Mobile Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={prefixStyle}><FaMobileAlt /></span>
                        <span className="input-group-text"
                          style={{ background: '#fff7f0', border: '1.5px solid #e0e0e0', borderLeft: 'none', borderRight: 'none', color: '#555', fontWeight: 600, fontSize: '14px' }}>
                          +91
                        </span>
                        <input
                          type="tel" className="form-control"
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setPhone(val)
                            setOtpErrors(p => ({ ...p, phone: '' }))
                          }}
                          maxLength={10}
                          style={{
                            border: `1.5px solid ${otpErrors.phone ? '#ef4444' : '#e0e0e0'}`,
                            borderLeft: 'none', padding: '12px 16px',
                            fontSize: '15px', letterSpacing: '1px',
                            borderRadius: '0 8px 8px 0',
                          }}
                        />
                      </div>
                      {otpErrors.phone && <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '5px 0 0' }}>{otpErrors.phone}</p>}
                    </div>

                    <button type="submit" className="btn w-100 text-white fw-semibold py-3"
                      disabled={loadingOtp} style={btnPrimary}>
                      {loadingOtp
                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending OTP…</>
                        : 'Send OTP'}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP boxes */}
                {step === 2 && (
                  <form onSubmit={handleVerifyOtp}>
                    <p className="text-center mb-4" style={{ color: '#555', fontSize: '14px' }}>
                      Enter the 6-digit code sent to <strong>+91 {phone}</strong>
                    </p>

                    <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el }}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          style={{
                            width: '46px', height: '52px', textAlign: 'center',
                            fontSize: '22px', fontWeight: 700, borderRadius: '10px',
                            border: `2px solid ${digit ? '#FF6A00' : '#e0e0e0'}`,
                            outline: 'none',
                            background: digit ? '#fff7f0' : '#fafafa',
                            color: '#222', transition: 'border-color .15s, background .15s',
                          }}
                        />
                      ))}
                    </div>

                    <button type="submit" className="btn w-100 fw-semibold py-3 mb-3"
                      disabled={loadingOtp || otp.join('').length !== 6}
                      style={{
                        ...btnPrimary,
                        background: otp.join('').length === 6 ? 'linear-gradient(90deg,#FF6A00,#FFA500)' : '#e0e0e0',
                        color: otp.join('').length === 6 ? 'white' : '#999',
                      }}>
                      {loadingOtp
                        ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
                        : 'Verify & Sign In'}
                    </button>

                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p style={{ color: '#888', fontSize: '13.5px', margin: 0 }}>
                          Resend in <strong style={{ color: '#FF6A00' }}>{resendTimer}s</strong>
                        </p>
                      ) : (
                        <button type="button" disabled={loadingOtp}
                          className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
                          style={{ color: '#FF6A00', fontSize: '13.5px', fontWeight: 600 }}
                          onClick={handleResend}>
                          <FaRedo style={{ fontSize: '11px' }} /> Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ════════ EMAIL MODE ════════ */}
            {loginMode === 'email' && (
              <>
                {/* Step 1: Name + Email */}
                {emailStep === 'form' && (
                  <form onSubmit={handleSendEmailOtp} noValidate>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ color: '#444', fontSize: '14px' }}>
                        Your Name
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={prefixStyle}><FaUser /></span>
                        <input
                          type="text" className="form-control"
                          placeholder="Enter your full name"
                          value={emailName} autoFocus
                          onChange={e => { setEmailName(e.target.value); setEmailErrors(p => ({ ...p, name: '' })) }}
                          style={inputBase(!!emailErrors.name)}
                        />
                      </div>
                      {emailErrors.name && <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '5px 0 0' }}>{emailErrors.name}</p>}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ color: '#444', fontSize: '14px' }}>
                        Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={prefixStyle}><FaEnvelope /></span>
                        <input
                          type="email" className="form-control"
                          placeholder="Enter your email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setEmailErrors(p => ({ ...p, email: '' })) }}
                          style={inputBase(!!emailErrors.email)}
                        />
                      </div>
                      {emailErrors.email && <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '5px 0 0' }}>{emailErrors.email}</p>}
                    </div>

                    <button type="submit" className="btn w-100 text-white fw-semibold py-3"
                      disabled={loadingEmail} style={btnPrimary}>
                      {loadingEmail
                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending OTP…</>
                        : 'Send OTP'}
                    </button>

                    <p className="text-center mt-3 mb-0" style={{ fontSize: '12.5px', color: '#9ca3af' }}>
                      Prefer mobile?{' '}
                      <span style={{ color: '#FF6A00', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => switchMode('otp')}>
                        Login with Mobile OTP
                      </span>
                    </p>
                  </form>
                )}

                {/* Step 2: Email OTP boxes */}
                {emailStep === 'otp' && (
                  <form onSubmit={handleVerifyEmailOtp}>
                    <p className="text-center mb-4" style={{ color: '#555', fontSize: '14px' }}>
                      Enter the 6-digit code sent to <strong>{email}</strong>
                    </p>

                    <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handleEmailOtpPaste}>
                      {emailOtp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { emailOtpRefs.current[i] = el }}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleEmailOtpChange(i, e.target.value)}
                          onKeyDown={e => handleEmailOtpKeyDown(i, e)}
                          style={{
                            width: '46px', height: '52px', textAlign: 'center',
                            fontSize: '22px', fontWeight: 700, borderRadius: '10px',
                            border: `2px solid ${digit ? '#FF6A00' : '#e0e0e0'}`,
                            outline: 'none',
                            background: digit ? '#fff7f0' : '#fafafa',
                            color: '#222', transition: 'border-color .15s, background .15s',
                          }}
                        />
                      ))}
                    </div>

                    <button type="submit" className="btn w-100 fw-semibold py-3 mb-3"
                      disabled={loadingEmail || emailOtp.join('').length !== 6}
                      style={{
                        ...btnPrimary,
                        background: emailOtp.join('').length === 6 ? 'linear-gradient(90deg,#FF6A00,#FFA500)' : '#e0e0e0',
                        color: emailOtp.join('').length === 6 ? 'white' : '#999',
                      }}>
                      {loadingEmail
                        ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
                        : 'Verify & Sign In'}
                    </button>

                    <div className="text-center">
                      {emailResendTimer > 0 ? (
                        <p style={{ color: '#888', fontSize: '13.5px', margin: 0 }}>
                          Resend in <strong style={{ color: '#FF6A00' }}>{emailResendTimer}s</strong>
                        </p>
                      ) : (
                        <button type="button" disabled={loadingEmail}
                          className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
                          style={{ color: '#FF6A00', fontSize: '13.5px', fontWeight: 600 }}
                          onClick={handleEmailResend}>
                          <FaRedo style={{ fontSize: '11px' }} /> Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login
