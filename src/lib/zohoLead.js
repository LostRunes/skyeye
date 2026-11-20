import { useState } from 'react'

// Sends the site's forms to Zoho CRM as Leads, through the CRM webform
// "Website enquiry" (Zoho CRM → Setup → Webforms). The two tokens below are
// the webform's public identifiers — Zoho puts them in every page that embeds
// the form — not secrets. Zoho issues new values each time the webform is
// edited and saved; the old ones keep working, but copy the new xnQsjsdp /
// xmIwtLD values from its source code when that happens.
//
// The form is posted into a hidden iframe so the visitor stays on the page.
// Zoho's reply can't be read across origins, so "sent" means the post
// completed; failure means it didn't load at all (offline, blocked).
const ZOHO = {
  action: 'https://crm.zoho.in/crm/WebToLeadForm',
  xnQsjsdp: '89f6de352ec09d37ba6150b579203ee45743128a3e8b92c61ac0d558a9e4eea6',
  xmIwtLD: '2bf0d4fd43c2441c3c4bdd89227c44458dec832440ee2f65decb7d75b78c708962812c72b0a4de44c21a68621d8e937a',
  actionType: 'TGVhZHM=', // "Leads"
}

// Lead Source values added to Zoho CRM for the website's forms
export const SOURCE = {
  service: 'Website - Service',
  training: 'Website - Training',
  course: 'Website - Course',
  stall: 'Website - MUN stall',
}

/** Splits a "phone or email" answer into the right CRM field. */
export const reachFields = (reach) => {
  const v = (reach || '').trim()
  return v.includes('@') ? { email: v } : { mobile: v }
}

/**
 * "Yogisha Rao" → First Name "Yogisha", Last Name "Rao". Zoho requires a
 * Last Name, so a one-word name goes there. (The webform must include the
 * First Name field, or Zoho silently drops it.)
 */
const splitName = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const last = words.pop() || ''
  return { 'First Name': words.join(' ').slice(0, 40), 'Last Name': last.slice(0, 80) }
}

/**
 * Creates a Lead. `description` carries the form's details (service, course,
 * dates…), so the team sees everything on the lead itself.
 */
export function sendLead({ name, mobile = '', email = '', company = '', city = '', description = '', source }) {
  return new Promise((resolve, reject) => {
    const id = `zoho-sink-${Date.now()}`
    const frame = document.createElement('iframe')
    frame.name = id
    frame.title = 'Zoho submission'
    frame.style.display = 'none'

    const form = document.createElement('form')
    form.action = ZOHO.action
    form.method = 'POST'
    form.target = id
    form.acceptCharset = 'UTF-8'
    form.style.display = 'none'
    const fields = {
      xnQsjsdp: ZOHO.xnQsjsdp,
      xmIwtLD: ZOHO.xmIwtLD,
      actionType: ZOHO.actionType,
      zc_gad: '',
      returnURL: 'null',
      aG9uZXlwb3Q: '', // Zoho's honeypot: must stay empty
      ...splitName(name),
      Mobile: mobile.trim().slice(0, 30),
      Email: email.trim().slice(0, 100),
      Company: company.trim().slice(0, 200),
      'Address - City': city.trim().slice(0, 255),
      Description: description.slice(0, 30000),
      'Lead Source': source,
    }
    for (const [k, v] of Object.entries(fields)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = k
      input.value = v
      form.appendChild(input)
    }

    const cleanup = () =>
      setTimeout(() => {
        frame.remove()
        form.remove()
      }, 1000)
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Zoho did not respond'))
    }, 20000)
    frame.addEventListener('load', () => {
      clearTimeout(timer)
      cleanup()
      resolve()
    })

    document.body.append(frame, form)
    form.submit()
  })
}

/** Form status for a lead form: 'idle' | 'sending' | 'sent' | 'error'. */
export function useLeadForm() {
  const [status, setStatus] = useState('idle')
  const send = async (lead) => {
    setStatus('sending')
    try {
      await sendLead(lead)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }
  return { status, send, reset: () => setStatus('idle') }
}
