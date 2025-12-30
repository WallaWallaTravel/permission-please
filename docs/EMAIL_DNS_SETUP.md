# Email DNS Configuration Guide

This guide explains how to configure DNS records for reliable email deliverability with Resend.

## Prerequisites

1. Access to your domain's DNS settings
2. A Resend account with a verified domain
3. Your sending domain (e.g., `permissionplease.app` or custom domain)

## Step 1: Verify Your Domain in Resend

1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your sending domain
4. Resend will provide you with DNS records to add

## Step 2: Add Required DNS Records

### SPF Record (Sender Policy Framework)

SPF tells email servers which mail servers are allowed to send email on behalf of your domain.

**Record Type:** TXT
**Host:** `@` (or your subdomain if using one)
**Value:**

```
v=spf1 include:amazonses.com ~all
```

> **Note:** Resend uses Amazon SES. If you have existing SPF records, add `include:amazonses.com` to your existing record.

### DKIM Record (DomainKeys Identified Mail)

DKIM adds a digital signature to your emails, proving they haven't been tampered with.

**Record Type:** CNAME (or TXT depending on provider)
**Host:** Provided by Resend (usually like `resend._domainkey`)
**Value:** Provided by Resend

> **Important:** The exact DKIM record values are unique to your domain. Get them from your Resend dashboard after adding your domain.

### DMARC Record (Domain-based Message Authentication)

DMARC tells receiving servers what to do with emails that fail SPF or DKIM checks.

**Record Type:** TXT
**Host:** `_dmarc`
**Value (Recommended for Start):**

```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Stricter Policy (After Monitoring):**

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
```

**Maximum Protection:**

```
v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com; pct=100
```

## Step 3: Wait for DNS Propagation

DNS changes can take up to 48 hours to propagate, but typically complete within 1-4 hours.

## Step 4: Verify in Resend

1. Return to your Resend dashboard
2. Click on your domain
3. Click "Verify DNS Records"
4. All records should show green checkmarks

## Testing Your Setup

### Send a Test Email

Use the admin panel at `/admin/schools` → "Test Email" to send a test message.

### Check Email Headers

1. Send a test email to a Gmail account
2. Open the email and click the three dots → "Show original"
3. Look for:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

### Use Online Tools

- [Mail Tester](https://www.mail-tester.com/) - Comprehensive email deliverability test
- [MX Toolbox](https://mxtoolbox.com/spf.aspx) - Verify SPF record
- [DMARC Analyzer](https://dmarcanalyzer.com/dmarc/dmarc-checker/) - Check DMARC setup

## Common DNS Providers

### Cloudflare

1. Go to DNS → Records
2. Add each record type
3. Disable proxy (orange cloud) for email-related records

### GoDaddy

1. Go to DNS Management
2. Add each record in the DNS Records section
3. Save changes

### Namecheap

1. Go to Advanced DNS
2. Add HOST RECORDS for each entry
3. Save all changes

### Vercel (for domains managed by Vercel)

1. Go to Project Settings → Domains
2. Click on your domain → DNS Records
3. Add each record

## Troubleshooting

### Emails Going to Spam

1. Verify all DNS records are correctly configured
2. Check that your FROM_EMAIL matches your verified domain
3. Avoid spam trigger words in subject lines
4. Include unsubscribe links in marketing emails

### SPF "Too Many Lookups" Error

If you have multiple email services, you may hit the 10 DNS lookup limit for SPF:

```
v=spf1 include:amazonses.com include:_spf.google.com ~all
```

Consider using SPF flattening tools if you exceed 10 lookups.

### DKIM Not Validating

1. Ensure the CNAME record is exactly as provided by Resend
2. Wait for full DNS propagation
3. Check for trailing periods or spaces in the record

## Production Checklist

- [ ] SPF record added and verified
- [ ] DKIM record added and verified
- [ ] DMARC record added (start with `p=none`)
- [ ] Test email sent successfully
- [ ] Email headers show PASS for all checks
- [ ] FROM_EMAIL environment variable set to verified domain
- [ ] RESEND_API_KEY environment variable set in Vercel

## Environment Variables

Add these to your Vercel project:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=Permission Please <noreply@yourdomain.com>
```

## Security Considerations

1. **Never commit API keys** - Always use environment variables
2. **Monitor DMARC reports** - Set up `rua` to receive aggregate reports
3. **Gradually increase DMARC policy** - Start with `none`, then `quarantine`, then `reject`
4. **Rate limiting** - The app already has rate limiting on email endpoints (5/min)
