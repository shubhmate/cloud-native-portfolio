/**
 * @file index.js
 * @description AWS Lambda handler for the portfolio contact form.
 *
 * Architecture:
 *   Client (main.js) → API Gateway → THIS Lambda → Brevo API (email)
 *                                                 → DynamoDB (persistence)
 *
 * Flow:
 *   1. Parse & validate incoming JSON body
 *   2. Honeypot check (silent bot rejection)
 *   3. Persist lead to DynamoDB (non-blocking — email delivery is prioritized)
 *   4. Send notification email to site owner via Brevo
 *   5. Send auto-reply acknowledgment to the visitor via Brevo
 *   6. Return success, or 500 to trigger client-side EmailJS failover
 *
 * Environment Variables:
 *   - AWS_REGION    : DynamoDB region (default: us-east-1)
 *   - BREVO_API_KEY : Brevo (Sendinblue) transactional email API key
 */

'use strict';

const https = require('https');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');


/* =========================================================================
   CLIENTS & CONSTANTS
   ========================================================================= */

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const DYNAMODB_TABLE = 'portfolio-leads';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};


/* =========================================================================
   UTILITIES
   ========================================================================= */

/**
 * Sends a transactional email via Brevo's SMTP API.
 * Uses the native `https` module (no external dependencies).
 *
 * @param {string} payload - Stringified JSON email payload.
 * @param {string} apiKey  - Brevo API key.
 * @returns {Promise<{statusCode: number, body: string}>}
 */
const sendEmail = (payload, apiKey) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: responseBody });
      });
    });

    req.on('error', (error) => {
      console.error('HTTPS Request Error:', error);
      resolve({ statusCode: 500, body: error.message });
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Builds a standardized API Gateway response.
 *
 * @param {number} statusCode - HTTP status code.
 * @param {object} body       - Response body object (will be stringified).
 * @returns {object} API Gateway response.
 */
const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body)
});


/* =========================================================================
   LAMBDA HANDLER
   ========================================================================= */

exports.handler = async (event) => {
  console.log('--- Lambda Execution Start ---');

  // --- 1. Parse Request Body ---
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return buildResponse(400, { message: 'Invalid JSON body' });
  }

  const { name, email, message, website } = body;
  const brevoApiKey = process.env.BREVO_API_KEY;

  // --- 2. Honeypot Check (Bot Protection) ---
  // Returns 200 to deceive the bot into thinking it succeeded.
  if (website && website.trim() !== '') {
    console.warn('Honeypot Triggered: Bot Detected.');
    return buildResponse(200, { message: 'Success', note: 'Silent rejection' });
  }

  // --- 3. Data Validation ---
  if (!name || !email || !message || name.length < 2 || message.length < 10) {
    console.warn('Validation Failed: Insufficient data.');
    return buildResponse(400, { message: 'Validation failed' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('Validation Failed: Invalid email format.');
    return buildResponse(400, { message: 'Invalid email' });
  }

  // --- 4. Persist Lead to DynamoDB ---
  // Non-blocking: if DB fails, we still prioritize email delivery.
  try {
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dbParams = {
      TableName: DYNAMODB_TABLE,
      Item: {
        lead_id:   { S: leadId },
        name:      { S: name },
        email:     { S: email },
        message:   { S: message },
        timestamp: { S: new Date().toISOString() },
        source:    { S: 'portfolio-contact-form' }
      }
    };

    console.log('Logging to Cloud Core (DynamoDB)...');
    await ddbClient.send(new PutItemCommand(dbParams));
    console.log('DynamoDB Write Successful ✓');
  } catch (dbErr) {
    console.error('DynamoDB Write Error (bypassing):', dbErr);
  }

  // --- 5. Notification Email (To Site Owner Shubham) ---
  const notificationPayload = JSON.stringify({
    sender: { name: 'Portfolio Alerts', email: 'contact@shubhammate.com' },
    to: [{ email: 'contact@shubhammate.com', name: 'Shubham Mate' }],
    replyTo: { email: email, name: name },
    subject: `🚀 New Portfolio Inquiry from ${name}`,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f1117; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #1a1d27; border-radius: 12px; border: 1px solid #2a2d3a; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,.4);">
          <div style="background: linear-gradient(135deg, #0f1117, #1a1d27); padding: 28px 36px; text-align: center; border-bottom: 1px solid #2a2d3a;">
            <h1 style="color: #3b82f6; font-family: 'Courier New', monospace; font-size: 20px; margin: 0 0 4px;">devops.sh</h1>
            <p style="color: #6b7280; font-size: 11px; margin: 0; font-family: monospace;">// incoming_contact_request</p>
            <span style="display: inline-block; margin-top: 12px; background: rgba(34,197,94,.1); color: #22c55e; border: 1px solid rgba(34,197,94,.3); border-radius: 20px; padding: 4px 14px; font-size: 10px; font-family: monospace;">● new lead received</span>
          </div>
          <div style="padding: 28px 36px;">
            <div style="margin-bottom: 18px;">
              <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: monospace;">From</div>
              <div style="font-size: 14px; color: #e2e8f0; background: #0f1117; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 6px 6px 0;">${name}</div>
            </div>
            <div style="margin-bottom: 18px;">
              <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: monospace;">Reply-To</div>
              <div style="font-size: 14px; color: #e2e8f0; background: #0f1117; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 6px 6px 0;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></div>
            </div>
            <div style="margin-bottom: 18px;">
              <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: monospace;">Message</div>
              <div style="background: #0f1117; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 13px; color: #e2e8f0; line-height: 1.7; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="text-align: center;">
              <a href="mailto:${email}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 13px; font-family: monospace;">↩ Reply to ${name}</a>
            </div>
          </div>
          <div style="background: #0f1117; border-top: 1px solid #2a2d3a; padding: 16px 36px; text-align: center; font-size: 10px; color: #6b7280; font-family: monospace;">devops.sh · portfolio contact form · shubhammate.com</div>
        </div>
      </div>
    `
  });

  // --- 6. Auto-Reply Email (To Visitor) ---
  const autoReplyPayload = JSON.stringify({
    sender: { name: 'Shubham Mate', email: 'contact@shubhammate.com' },
    to: [{ email: email, name: name }],
    replyTo: { email: 'contact@shubhammate.com', name: 'Shubham Mate' },
    subject: `✅ Got your message, ${name} — I'll be in touch soon!`,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f1117; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #1a1d27; border-radius: 12px; border: 1px solid #2a2d3a; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,.4);">
          <div style="background: linear-gradient(135deg, #0f1117, #1a1d27); padding: 32px 36px; text-align: center; border-bottom: 1px solid #2a2d3a;">
            <h1 style="color: #3b82f6; font-family: 'Courier New', monospace; font-size: 22px; margin: 0 0 6px;">devops.sh</h1>
            <p style="color: #6b7280; font-size: 11px; margin: 0; font-family: monospace;">// message_received.log</p>
            <div style="font-size: 38px; margin: 14px 0 0;">✅</div>
          </div>
          <div style="padding: 32px 36px; text-align: center;">
            <h2 style="color: #e2e8f0; font-size: 18px; margin: 0 0 10px;">Hey ${name}, got your message!</h2>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.7; margin: 0 0 6px;">Thanks for reaching out through my portfolio.</p>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.7; margin: 0 0 6px;">I've received your message and will personally get back to you within <strong style="color: #e2e8f0;">24–48 hours</strong>.</p>
            <div style="display: inline-block; margin: 20px 0; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.25); border-radius: 8px; padding: 14px 24px; color: #3b82f6; font-size: 13px; font-family: monospace;">$ echo "message received" → status: queued for reply</div>
            <hr style="border: none; border-top: 1px solid #2a2d3a; margin: 24px 0;">
            <p style="font-size: 12px; color: #6b7280;">My current stack:</p>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin: 16px 0;">
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">AWS</span>
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">Docker</span>
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">Kubernetes</span>
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">Terraform</span>
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">CI/CD</span>
              <span style="background: #0f1117; color: #6b7280; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-family: monospace; border: 1px solid #2a2d3a;">GitHub Actions</span>
            </div>
          </div>
          <div style="background: #0f1117; border-top: 1px solid #2a2d3a; padding: 18px 36px; text-align: center; font-size: 10px; color: #6b7280; font-family: monospace;">
            Shubham Mate · DevOps & Cloud Engineer · <a href="https://shubhammate.com" style="color: #3b82f6; text-decoration: none;">shubhammate.com</a><br>
            You're receiving this because you contacted me via my portfolio.
          </div>
        </div>
      </div>
    `
  });

  // --- 7. Send Emails ---
  console.log('Sending Notification Email...');
  const res1 = await sendEmail(notificationPayload, brevoApiKey);
  console.log('Notification Status:', res1.statusCode, '| Body:', res1.body);

  if (res1.statusCode >= 200 && res1.statusCode < 300) {
    // Notification accepted — now send the auto-reply
    console.log('Sending Auto-Reply Email...');
    const res2 = await sendEmail(autoReplyPayload, brevoApiKey);
    console.log('Auto-Reply Status:', res2.statusCode, '| Body:', res2.body);

    return buildResponse(200, { message: 'Success', primary: 'delivered' });
  } else {
    // Brevo rejected the request (quota, auth, or transient error).
    // Return 500 to trigger the client-side EmailJS failover in main.js.
    console.warn('Brevo Rejected Request. Triggering client-side failover...');
    return buildResponse(500, {
      message: 'Primary Mail Error',
      details: res1.body,
      trigger_fallback: true
    });
  }
};
