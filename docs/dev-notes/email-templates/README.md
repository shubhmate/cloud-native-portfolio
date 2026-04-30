# 📧 EmailJS Email Templates

> **Location:** `notes/email-templates/`
> **Last Updated:** April 2026

---

## Templates Overview

| File | EmailJS Template ID | Purpose | To: field |
|------|-------------------|---------|-----------|
| `notification-to-owner.html` | `template_8pgqh9e` | Sent to YOU when someone contacts | `shubhammate0604@gmail.com` |
| `autoreply-to-sender.html` | `template_r75bira` | Sent to the VISITOR automatically | `{{reply_to}}` ← must be this |

---

## EmailJS Dashboard Settings

### Template 1 — Notification (to you)
- **To email:** `shubhammate0604@gmail.com`
- **From name:** `Portfolio Contact Form`
- **Reply-To:** `{{reply_to}}`
- **Subject:** `🚀 New Contact: {{from_name}} — Portfolio`

### Template 2 — Auto-Reply (to visitor)
- **To email:** `{{reply_to}}` ← **CRITICAL — must not be your email**
- **From name:** `Shubham Mate`
- **Reply-To:** `shubhammate0604@gmail.com`
- **Subject:** `Got your message, {{from_name}} — I'll be in touch soon!`

---

## Variables Used

| Variable | Value comes from |
|----------|-----------------|
| `{{from_name}}` | Name field in contact form |
| `{{reply_to}}` | Email field in contact form |
| `{{message}}` | Message field in contact form |

---

## Config Keys in `site-config.json`

```json
"EMAILJS_SERVICE_ID"   : "service_ejk43c6",
"EMAILJS_TEMPLATE_ID"  : "template_8pgqh9e",
"EMAILJS_AUTOREPLY_ID" : "template_r75bira",
"EMAILJS_PUBLIC_KEY"   : "FvLsoXUl1h2UTUa5s"
```

---

## How to Update Templates

1. Edit the `.html` file in `notes/email-templates/`
2. Copy the HTML
3. Go to [EmailJS Dashboard](https://dashboard.emailjs.com) → Email Templates
4. Open the relevant template → switch to HTML mode → paste → Save

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Auto-reply goes to your own inbox | Set "To email" to `{{reply_to}}` in autoreply template |
| Notification goes to visitor | Set "To email" to your Gmail in notification template |
| Both emails go to wrong place | Double-check which Template ID is `EMAILJS_TEMPLATE_ID` vs `EMAILJS_AUTOREPLY_ID` |
| Form sends but no email arrives | Check EmailJS free plan limit (200/month) |
