'use client';
import { useRef } from 'react';
import useOtpCountdown from '@/hooks/useOtpCountdown';
import styles from './OtpControls.module.css';
const label = method => method === 'sms' ? 'SMS' : 'WhatsApp';
export function OtpMethodPicker({ value, onChange, disabled, verifying = false }) {
  const refs = useRef([]);
  return <fieldset className={styles.methods} disabled={disabled}>
    <legend>{verifying ? 'Send another code using' : 'How would you like your code?'}</legend>
    <div className={styles.methodGrid} role="radiogroup" aria-label="Verification method">
      {['sms', 'whatsapp'].map((method, index) => <button ref={el => { refs.current[index] = el; }} key={method} type="button" role="radio" aria-checked={value === method} tabIndex={value === method ? 0 : -1} onClick={() => onChange(method)} onKeyDown={e => { if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); const next = 1 - index; onChange(['sms','whatsapp'][next]); refs.current[next]?.focus(); } }} className={`${styles.method} ${value === method ? styles.selected : ''}`}>
        <span className={`${styles.methodIcon} ${method === 'whatsapp' ? styles.whatsapp : ''}`}><i className={method === 'sms' ? 'far fa-comment-dots' : 'fab fa-whatsapp'} aria-hidden="true" /></span>
        <span className={styles.methodCopy}><strong>{label(method)}</strong><small>{method === 'sms' ? 'Text message · default' : 'Use your WhatsApp number'}</small></span>
        <span className={styles.radio} aria-hidden="true">{value === method && <span />}</span>
      </button>)}
    </div>
    <p className={styles.hint}>{value === 'sms' ? 'A six-digit code will be sent to your Afghan mobile number.' : 'WhatsApp must be active on this number and connected to the internet.'}</p>
  </fieldset>;
}
export function OtpVerification({ code, onChange, phone, sentChannel, channel, retryAt, expiresAt, onResend, onEdit, loading }) {
  const seconds = useOtpCountdown(retryAt);
  const expiry = useOtpCountdown(expiresAt);
  const input = useRef(null);
  return <section className={styles.verification} aria-label="Phone verification">
    <div className={styles.sent}><span className={styles.sentIcon}><i className="far fa-shield-check" aria-hidden="true" /></span><div><strong>Check your {label(sentChannel)}</strong><p>We sent a code to <b dir="ltr">{phone}</b></p></div></div>
    <p className={styles.hint} style={{marginBottom:20}}>{sentChannel === 'sms' ? 'Open your Messages app and enter the six-digit code below. If your keyboard suggests the code, tap it to fill it in.' : 'Open WhatsApp and find your six-digit code, then return here to enter it.'}</p>
    <label className={styles.codeLabel} htmlFor="verification-code">Verification code</label>
    <div className={styles.codeWrap} onClick={() => input.current?.focus()}>
      <input ref={input} id="verification-code" className={styles.codeInput} value={code} onChange={e => onChange(e.target.value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 1776 : 1632))).replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} autoFocus required disabled={loading} aria-describedby="code-expiry" />
      <div className={styles.digits} aria-hidden="true" dir="ltr">{Array.from({length:6}, (_,i) => <span key={i} className={code.length === i ? styles.activeDigit : ''}>{code[i] || ''}</span>)}</div>
    </div>
    <p id="code-expiry" className={`${styles.hint} ${!expiry ? styles.expired : ''}`}>{expiry ? `Code expires in ${Math.floor(expiry / 60)}:${String(expiry % 60).padStart(2,'0')}. Use the latest code.` : 'This code has expired. Request a new one.'}</p>
    <div className={styles.resendRow}><span>Didn’t receive a code?</span><button type="button" disabled={loading || seconds > 0} onClick={onResend} className={styles.resend}>{seconds > 0 ? <><i className="far fa-clock" aria-hidden="true" /> Resend in <b>{seconds}s</b></> : `Resend via ${label(channel)}`}</button></div>
    {seconds > 0 && <div className={styles.track} role="progressbar" aria-label="Time until resend" aria-valuemin={0} aria-valuemax={60} aria-valuenow={seconds}><div style={{width:`${Math.min(100, seconds / 60 * 100)}%`}} /></div>}
    <button type="button" className={styles.edit} disabled={loading} onClick={onEdit}><i className="far fa-pen" aria-hidden="true" /> Change phone or details</button>
  </section>;
}
