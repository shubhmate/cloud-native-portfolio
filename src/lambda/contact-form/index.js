const https = require('https');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Utility to send a single email via Brevo API
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

exports.handler = async (event) => {
  console.log('--- Lambda Execution Start ---');
  
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Invalid JSON body' })
    };
  }

  const { name, email, message, website } = body;
  const brevoApiKey = process.env.BREVO_API_KEY;

  // --- 1. HONEYPOT CHECK (Bot Protection) ---
  if (website && website.trim() !== "") {
    console.warn('Honeypot Triggered: Bot Detected.');
    // We return 200 (Success) to the bot so it doesn't know it failed, 
    // but we SILENTLY reject it without sending any emails.
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Success', note: 'Silent rejection' })
    };
  }

  // --- 2. DATA VALIDATION ---
  if (!name || !email || !message || name.length < 2 || message.length < 10) {
    console.warn('Validation Failed: Insufficient data.');
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Validation failed' })
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('Validation Failed: Invalid email format.');
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Invalid email' })
    };
  }

  // --- 2.5 CLOUD CORE PERSISTENCE (DynamoDB) ---
  try {
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dbParams = {
      TableName: 'portfolio-leads',
      Item: {
        lead_id: { S: leadId },
        name: { S: name },
        email: { S: email },
        message: { S: message },
        timestamp: { S: new Date().toISOString() },
        source: { S: 'portfolio-contact-form' }
      }
    };
    
    console.log('Logging to Cloud Core (DynamoDB)...');
    await ddbClient.send(new PutItemCommand(dbParams));
    console.log('Cloud Core Logging Successful ✓');
  } catch (dbErr) {
    console.error('Cloud Core Logging Error (Silently bypassing):', dbErr);
    // We don't fail the request if DB fails — prioritize email delivery
  }

  // --- 3. NOTIFICATION EMAIL (To Shubham) ---
  const notificationPayload = JSON.stringify({
    sender: { name: 'Portfolio Alerts', email: 'contact@shubhammate.com' },
    to: [{ email: 'contact@shubhammate.com', name: 'Shubham Mate' }],
    replyTo: { email: email, name: name },
    subject: `🚀 New Portfolio Inquiry from ${name}`,
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3b82f6;">New Message Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Message:</strong></p>
        <p style="background: #f9fafb; padding: 15px; border-radius: 5px;">${message}</p>
      </div>
    `
  });

  // --- 4. AUTO-REPLY EMAIL (To Visitor) ---
  const autoReplyPayload = JSON.stringify({
    sender: { name: 'Shubham Mate', email: 'contact@shubhammate.com' },
    to: [{ email: email, name: name }],
    replyTo: { email: 'contact@shubhammate.com', name: 'Shubham Mate' },
    subject: `🛡️ Signal Received: Inquiry Acknowledged`,
    htmlContent: `
      <div style="font-family: 'Courier New', monospace; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #38bdf8; margin-top: 0;">&gt; connection_established.sh</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hello ${name},</p>
        <p style="font-size: 16px; line-height: 1.6;">Your message has been successfully routed to my inbox. I'll review the details and get back to you shortly.</p>
        <div style="background-color: #1e293b; padding: 15px; border-left: 4px solid #38bdf8; margin: 20px 0;">
          <code style="color: #94a3b8;">Status: IN_QUEUE<br>Priority: P1<br>ETA: &lt; 24 Hours</code>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">This is an automated acknowledgment. I will personally follow up with you soon.</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 25px 0;">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Best Regards,</p>
        <p style="font-size: 14px; margin-top: 0;">Shubham Mate</p>
        <p style="font-size: 12px; color: #64748b;">Cloud Native & DevOps Engineer | <a href="https://shubhammate.com" style="color: #38bdf8; text-decoration: none;">shubhammate.com</a></p>
      </div>
    `
  });

  console.log('Sending Notification...');
  const res1 = await sendEmail(notificationPayload, brevoApiKey);
  console.log('Notification Status:', res1.statusCode);
  console.log('Notification Response:', res1.body);

  if (res1.statusCode >= 200 && res1.statusCode < 300) {
    // EXTRA CHECK: If Brevo accepts it but warns it's queued/deferred, 
    // we want to know, but we'll treat it as success for now.
    // However, if statusCode is 202 (Accepted but not sent yet), 
    // you can choose to treat it as a 'soft fail' to trigger EmailJS.
    
    console.log('Sending Auto-Reply...');
    const res2 = await sendEmail(autoReplyPayload, brevoApiKey);
    console.log('Auto-Reply Status:', res2.statusCode);
    console.log('Auto-Reply Response:', res2.body);
    
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Success', primary: 'delivered' })
    };
  } else {
    // If we are here, Brevo blocked us (Quota, Auth, or Error)
    console.warn('Brevo Blocked Request. Triggering Client-Side Failover...');
    return {
      statusCode: 500, // Force 500 to trigger the frontend 'catch' block
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: 'Primary Mail Error', 
        details: res1.body,
        trigger_fallback: true 
      })
    };
  }
};
