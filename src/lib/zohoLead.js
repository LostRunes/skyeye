import { useState } from 'react'

// Sends the site's forms to Zoho CRM as Leads, through the CRM webform
// "Website enquiry" (Zoho CRM → Setup → Webforms). The two tokens below are
// the webform's public identifiers — Zoho puts them in every page that embeds
// the form — not secrets. If the webform is ever recreated, copy the new
// xnQsjsdp / xmIwtLD values from its source code.
//
// The form is posted into a hidden iframe so the visitor stays on the page.
// Zoho's reply can't be read across origins, so "sent" means the post
// completed; failure means it didn't load at all (offline, blocked).
const ZOHO = {
  action: 'https://crm.zoho.in/crm/WebToLeadForm',
  xnQsjsdp: '8ed5c8d64db351701a792a0d868463622c7d640e96d8b160fb3759481beba7c3',
  xmIwtLD: '2fdc8c5343926f5b0bb17b844d358a20c3dab8a8c56c8be0fe5810661b7bbcc6447d8f60ce117290a08d45238157d0aa',
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
      'Last Name': name.trim().slice(0, 80),
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
