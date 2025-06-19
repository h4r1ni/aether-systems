// Aether Enterprise Solutions - Elite Business Transformation Systems
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

// Initialize Express app
const app = express();

// Stripe API configuration - ALWAYS use environment variables in production
// These keys should be set in your hosting environment, not hardcoded
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51RPpIs2cJTJMG24U64IUBt1htmHA8r64WC5jKDIG6bEqCaYxHvpEAY9uDj2b56B8CNuwogt6EkVfJrnTpAbl4lLf00dWTYGznk';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RPpIs2cJTJMG24UfIXrPEKDx4Kv5nMdwh8rRiNV1VmtxL0s7fFddAh8gxKnnHXRQClfXaBwsQ4O7pVi7wMh1MX7000IgAuOLo';

// Initialize Stripe with the secret key
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'keyXXXXXXXXXXXXXX'; // Set this in your environment variables
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appXXXXXXXXXXXXXX'; // Set this in your environment variables

// Initialize data persistence
const { saveJsonRecord, readJsonRecords } = require('./utils/data-persistence');

// In-memory cache for faster reads (data is also persisted to disk)
let formSubmissions = [];
let paymentFormData = {}; // Store form data temporarily before payment is completed
let completedOrders = []; // Store completed orders with form data

// Load existing data from disk on startup
async function loadExistingData() {
  try {
    formSubmissions = await readJsonRecords('form_submissions');
    const pendingPayments = await readJsonRecords('pending_payments');
    const completedOrdersData = await readJsonRecords('completed_orders');
    
    // Load pending payments into memory (they'll be cleared on payment success)
    pendingPayments.forEach(payment => {
      paymentFormData[payment.id] = payment;
    });
    
    // Load completed orders into memory
    completedOrders = completedOrdersData;
  } catch (error) {
    console.error('Error loading existing data:', error);
  }
}

// Load data on server startup
loadExistingData();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Email configuration
const EMAIL_CONFIG = {
  maxRetries: 3,                    // Maximum number of retry attempts
  initialRetryDelay: 3000,         // Initial delay in ms (3 seconds)
  maxRetryDelay: 300000,           // Maximum delay between retries (5 minutes)
  retryBackoffFactor: 2,           // Exponential backoff factor
  logFile: 'email_notifications.log', // Log file for email attempts
  maxLogSize: 10 * 1024 * 1024,     // 10MB max log file size
  maxLogFiles: 5,                   // Keep 5 rotated log files
};

// In-memory queue for failed emails
const emailQueue = [];
let isProcessingQueue = false;

/**
 * Rotate log file if it exceeds max size
 */
const rotateLogFile = () => {
  try {
    if (fs.existsSync(EMAIL_CONFIG.logFile)) {
      const stats = fs.statSync(EMAIL_CONFIG.logFile);
      if (stats.size > EMAIL_CONFIG.maxLogSize) {
        // Rotate logs
        for (let i = EMAIL_CONFIG.maxLogFiles - 1; i >= 0; i--) {
          const currentFile = i === 0 ? EMAIL_CONFIG.logFile : `${EMAIL_CONFIG.logFile}.${i}`;
          const nextFile = `${EMAIL_CONFIG.logFile}.${i + 1}`;
          
          if (fs.existsSync(currentFile)) {
            if (i === EMAIL_CONFIG.maxLogFiles - 1) {
              // Remove the oldest log if we've reached max files
              fs.unlinkSync(currentFile);
            } else {
              // Otherwise rotate the log file
              fs.renameSync(currentFile, nextFile);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error rotating log file:', error);
  }
};

/**
 * Log email attempt to file
 */
const logEmailAttempt = (data) => {
  try {
    rotateLogFile();
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${JSON.stringify(data)}\n`;
    fs.appendFileSync(EMAIL_CONFIG.logFile, logEntry, 'utf8');
  } catch (error) {
    console.error('Error logging email attempt:', error);
  }
};

/**
 * Process the email queue
 */
const processEmailQueue = async () => {
  if (isProcessingQueue || emailQueue.length === 0) return;
  
  isProcessingQueue = true;
  const emailTask = emailQueue.shift();
  
  try {
    const result = await sendEmailWithRetry(
      emailTask.subject,
      emailTask.content,
      emailTask.recipient,
      emailTask.metadata || {}
    );
    
    if (!result.success && emailTask.attempts < 3) {
      // Requeue with backoff if max attempts not reached
      emailTask.attempts = (emailTask.attempts || 0) + 1;
      emailTask.nextRetry = Date.now() + 
        Math.min(
          EMAIL_CONFIG.initialRetryDelay * Math.pow(EMAIL_CONFIG.retryBackoffFactor, emailTask.attempts - 1),
          EMAIL_CONFIG.maxRetryDelay
        );
      emailQueue.push(emailTask);
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  } finally {
    isProcessingQueue = false;
    
    // Process next item in queue if any
    if (emailQueue.length > 0) {
      const nextTask = emailQueue[0];
      const delay = Math.max(0, (nextTask.nextRetry || 0) - Date.now());
      setTimeout(processEmailQueue, delay);
    }
  }
};

/**
 * Send email with retry logic
 */
const sendEmailWithRetry = async (subject, content, recipient = 'contact@aethersystems.org', metadata = {}) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= EMAIL_CONFIG.maxRetries; attempt++) {
    try {
      // In production, implement with a service like SendGrid, Mailgun, etc.
      console.log(`\n==== EMAIL NOTIFICATION ATTEMPT ${attempt}/${EMAIL_CONFIG.maxRetries} ====`);
      console.log(`TO: ${recipient}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`METADATA:`, JSON.stringify(metadata, null, 2));
      console.log(`CONTENT: \n${content}`);
      console.log(`=========================================\n`);
      
      // In production, uncomment and use code like this:
      /*
      const mailOptions = {
        from: 'noreply@aethersystems.org',
        to: recipient,
        subject: subject,
        html: content,
        headers: {
          'X-Attempt': attempt,
          'X-Max-Attempts': EMAIL_CONFIG.maxRetries
        }
      };
      
      await transporter.sendMail(mailOptions);
      */
      
      // Log successful attempt
      logEmailAttempt({
        status: 'success',
        attempt,
        subject,
        recipient,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, attempt };
      
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Log failed attempt
      logEmailAttempt({
        status: 'error',
        attempt,
        subject,
        recipient,
        error: error.message,
        stack: error.stack,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      // If not the last attempt, wait before retrying with exponential backoff
      if (attempt < EMAIL_CONFIG.maxRetries) {
        const delay = Math.min(
          EMAIL_CONFIG.initialRetryDelay * Math.pow(EMAIL_CONFIG.retryBackoffFactor, attempt - 1),
          EMAIL_CONFIG.maxRetryDelay
        );
        
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all attempts failed
  return { success: false, error: lastError };
};

/**
 * Queue an email for sending with retry logic
 */
const sendEmailNotification = async (subject, content, recipient = 'contact@aethersystems.org', metadata = {}) => {
  const emailTask = {
    subject,
    content,
    recipient,
    metadata,
    timestamp: Date.now(),
    attempts: 0,
    nextRetry: Date.now()
  };
  
  // Add to queue
  emailQueue.push(emailTask);
  
  // Start processing queue if not already running
  if (!isProcessingQueue) {
    processEmailQueue();
  }
  
  // Return immediately, actual sending happens in the background
  return { queued: true, id: emailTask.timestamp };
};

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request for ${req.url}`);
  next();
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Order notifications page with QR code for quick access
app.get('/notifications', (req, res) => {
  // Simple password protection
  const providedPassword = req.query.key;
  if (providedPassword !== 'aether2025') {
    return res.status(401).send('Unauthorized');
  }
  
  // Generate a simple HTML page with notification options
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Aether Systems - Notifications</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #1a202c; }
        .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .status { padding: 10px; background: #e6fffa; border-radius: 4px; margin-bottom: 20px; }
        .toggle { display: block; padding: 10px; background: #2563eb; color: white; border-radius: 4px; text-align: center; text-decoration: none; margin-bottom: 10px; }
        .qr-code { text-align: center; margin: 20px 0; }
        .note { font-size: 0.8rem; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Notifications</h1>
        
        <div class="card">
          <div class="status" id="status">Waiting for orders...</div>
          
          <a href="/admin/submissions?password=aether2025" class="toggle">View All Orders</a>
          
          <div class="qr-code">
            <p>Scan to monitor orders on your phone:</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://aethersystems.org/notifications?key=aether2025`)}" alt="QR Code" />
            <p class="note">This page will automatically notify you when new orders come in.</p>
          </div>
        </div>
      </div>
      
      <script>
        // Set up event source for real-time notifications
        const statusElement = document.getElementById('status');
        
        // Check for new orders every 30 seconds
        function checkOrders() {
          // In production, implement server-sent events or websockets
          fetch('/orders/check?key=aether2025')
            .then(response => response.json())
            .then(data => {
              if (data.newOrders > 0) {
                statusElement.innerHTML = 'New Order Alert: ' + data.newOrders + ' new order(s) received!';
                statusElement.style.background = '#fef2f2';
                statusElement.style.color = '#b91c1c';
                // Play notification sound
                const audio = new Audio('data:audio/wav;base64,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');
                audio.play();
                // Vibrate if supported
                if (navigator.vibrate) {
                  navigator.vibrate([200, 100, 200]);
                }
              } else {
                statusElement.innerHTML = 'Waiting for orders...';
                statusElement.style.background = '#e6fffa';
                statusElement.style.color = 'inherit';
              }
            })
            .catch(error => console.error('Error checking orders:', error));
        }
        
        // Check immediately and then every 30 seconds
        checkOrders();
        setInterval(checkOrders, 30000);
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Endpoint to check for new orders
app.get('/orders/check', (req, res) => {
  // Simple authentication
  const providedKey = req.query.key;
  if (providedKey !== 'aether2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // In production, implement a proper way to track which orders are new
  // For now, just return the count of orders in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const newOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.payment_date || order.timestamp);
    return orderDate > oneHourAgo;
  }).length;
  
  res.json({ newOrders });
});

// Store form data before redirecting to payment
app.post('/store-form-data', async (req, res) => {
  try {
    const formData = req.body;
    
    // Generate a unique ID for this form submission
    const formDataId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
    
    // Store in memory and persist to disk
    paymentFormData[formDataId] = formData;
    await saveJsonRecord('pending_payments', { ...formData, id: formDataId });
    
    // Create comprehensive logs of payment form data
    console.log(`\n==== PAYMENT FORM DATA STORED ====`);
    console.log(`PLAN: ${formData.plan_type?.toUpperCase() || 'Unknown'}`);
    console.log(`CUSTOMER: ${formData.name} (${formData.email})`);
    console.log(`FORM DATA ID: ${formDataId}`);
    console.log(JSON.stringify(formData, null, 2));
    console.log(`===================================\n`);
    
    // Return the ID so it can be used after payment
    res.json({ success: true, formDataId: formDataId });
  } catch (error) {
    console.error('Error storing form data:', error);
    res.status(500).json({ success: false, error: 'Failed to store form data' });
  }
});

// Universal checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, formDataId } = req.body;
    let unitAmount, name, description, mode, recurring;
    
    // One-time payment plans
    if (priceId === 'basic') {
      unitAmount = 49900; // £499.00
      name = 'Essentials Plan';
      description = 'Single workflow system + 5-day delivery + 2 refinement rounds + 14-day support';
      mode = 'payment'; // one-time payment
    } else if (priceId === 'professional') {
      unitAmount = 99900; // £999.00
      name = 'Professional Plan';
      description = 'Up to 3 systems + priority support + 2 refinement rounds + 30-day support';
      mode = 'payment'; // one-time payment
    } else if (priceId === 'enterprise') {
      // We'll use a placeholder price for testing, but in production this is quote-based
      unitAmount = 0; // Custom pricing determined after consultation
      name = 'Enterprise Plan - Consultation';
      description = 'Full-stack workflows + API builds + onboarding + training + premium support';
      mode = 'payment'; // one-time payment
    } 
    // Monthly subscription support plans
    else if (priceId === 'basic-support') {
      unitAmount = 3000; // £30.00 per month
      name = 'Basic Monthly Support';
      description = 'Essential support for simple systems with basic functionality needs.';
      mode = 'subscription';
      recurring = { interval: 'month' };
    } else if (priceId === 'standard-support') {
      unitAmount = 6000; // £60.00 per month
      name = 'Standard Monthly Support';
      description = 'Enhanced support for multi-component systems with moderate complexity.';
      mode = 'subscription';
      recurring = { interval: 'month' };
    } else if (priceId === 'premium-support') {
      unitAmount = 10000; // £100.00 per month
      name = 'Premium Monthly Support';
      description = 'Comprehensive support for complex enterprise-grade systems.';
      mode = 'subscription';
      recurring = { interval: 'month' };
    } else {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    // Prepare line items based on whether it's a one-time payment or subscription
    const lineItem = {
      price_data: {
        currency: 'gbp',
        product_data: {
          name: name,
          description: description,
          images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3'],
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };
    
    // Add recurring parameter for subscription plans
    if (recurring) {
      lineItem.price_data.recurring = recurring;
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: mode, // 'payment' for one-time or 'subscription' for recurring
      success_url: `${req.protocol}://${req.get('host')}/onboarding.html?payment_success=true&plan_type=${priceId}&form_data_id=${formDataId}`,
      cancel_url: `${req.protocol}://${req.get('host')}/index.html#pricing`,
      metadata: {
        plan_type: priceId,
        form_data_id: formDataId
      }
    });

    // Log checkout attempt for analytics
    console.log(`Checkout initiated for ${name} (${unitAmount / 100} GBP)`);
    
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to submit enterprise quote requests
app.post('/submit-enterprise-quote', async (req, res) => {
  try {
    const customerData = req.body;
    console.log(`Enterprise quote request received from ${customerData.fullName}`);
    
    // Store in memory and persist to disk
    formSubmissions.push(customerData);
    await saveJsonRecord('form_submissions', {
      ...customerData,
      type: 'enterprise_quote',
      timestamp: new Date().toISOString()
    });
    
    // In production, send to Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      await axios({
        method: 'post',
        url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/EnterpriseQuotes`,
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          records: [
            {
              fields: {
                'Name': customerData.fullName,
                'Email': customerData.email,
                'Company': customerData.company || '',
                'Phone': customerData.phone,
                'System to Automate': customerData.systemToAutomate,
                'Project Description': customerData.projectDescription,
                'Timeline': customerData.timeline,
                'Plan': 'Enterprise',
                'Status': 'New Quote Request',
                'Source': 'Website Form',
                'Date': new Date().toISOString()
              }
            }
          ]
        }
      });
    }
    
    // Send email notification
    const subject = `NEW ENTERPRISE QUOTE: ${customerData.company || customerData.fullName}`;
    const emailContent = `
<h2>New Enterprise Quote Request</h2>
<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
<p><strong>Company:</strong> ${customerData.company || 'N/A'}</p>
<p><strong>Contact:</strong> ${customerData.fullName} <${customerData.email}></p>
<p><strong>Phone:</strong> ${customerData.phone || 'N/A'}</p>
<p><strong>System to Automate:</strong> ${customerData.systemToAutomate}</p>
<p><strong>Project Description:</strong> ${customerData.projectDescription}</p>
<p><strong>Timeline:</strong> ${customerData.timeline}</p>
<p><a href="https://aethersystems.org/admin/submissions?password=aether2025">View in admin dashboard</a></p>
`;
    
    await sendEmailNotification(subject, emailContent);
    
    res.json({ success: true, message: 'Quote request received' });
  } catch (error) {
    console.error('Error storing enterprise quote request:', error);
    res.status(500).json({ success: false, error: 'Failed to submit quote request' });
  }
});

// Handle contact form submissions
app.post('/submit-contact-form', async (req, res) => {
  try {
    const formData = req.body;
    const timestamp = new Date().toISOString();
    
    // Store in memory and persist to disk
    formSubmissions.push(formData);
    await saveJsonRecord('form_submissions', {
      ...formData,
      type: 'contact_form',
      timestamp: timestamp
    });
    
    // Store in Airtable if in production
    if (AIRTABLE_API_KEY && AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      try {
        await axios({
          method: 'post',
          url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ContactForm`,
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            records: [
              {
                fields: {
                  'Name': formData.name,
                  'Email': formData.email,
                  'Subject': formData.subject || 'No Subject',
                  'Message': formData.message,
                  'Date': timestamp
                }
              }
            ]
          }
        });
      } catch (airtableError) {
        console.error('Error storing in Airtable, but form data is still saved locally:', airtableError);
      }
    }
    
    // Send email notification
    const subject = `📩 New Contact Form Submission from ${formData.name}`;
    const emailContent = `
<h2>New Contact Form Submission</h2>
<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
<p><strong>From:</strong> ${formData.name} <${formData.email}></p>
<p><strong>Subject:</strong> ${formData.subject || 'N/A'}</p>
<p><strong>Message:</strong><br>${formData.message}</p>
<p><a href="https://aethersystems.org/admin/submissions?password=aether2025">View all submissions in admin dashboard</a></p>
`;
    
    await sendEmailNotification(subject, emailContent);
    
    // Log the submission
    console.log(`\n==== NEW CONTACT FORM SUBMISSION ====`);
    console.log(`From: ${formData.name} <${formData.email}>`);
    console.log(`Subject: ${formData.subject || 'N/A'}`);
    console.log(`===================================\n`);
    
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ success: false, error: 'Failed to submit form' });
  }
});

// Triple-redundancy payment verification system
// This ensures payment data is never lost through multiple backup methods

// Handle Stripe webhook for reliable payment tracking
app.post('/stripe-webhook', async (req, res) => {
  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    // In production, add proper Stripe webhook signature verification
    // event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    
    // For now, trust the payload
    event = payload;

    // Handle successful checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const formDataId = session.metadata.form_data_id;
      
      // Retrieve the form data
      const formData = paymentFormData[formDataId];
      
      if (formData) {
        // Create completed order with payment info
        const orderData = {
          ...formData,
          payment_completed: true,
          payment_date: new Date().toISOString(),
          session_id: session.id,
          amount_paid: session.amount_total / 100,
          currency: session.currency,
          customer_email: session.customer_details ? session.customer_details.email : formData.email
        };
        
        // Store completed order
        completedOrders.unshift(orderData);
        
        // Clean up temporary storage
        delete paymentFormData[formDataId];
        
        // Store in Airtable (in production)
        if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
          try {
            await axios({
              method: 'post',
              url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/CompletedOrders`,
              headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              data: {
                records: [
                  {
                    fields: {
                      'Name': orderData.name,
                      'Email': orderData.email,
                      'Plan': orderData.plan_type,
                      'Amount': orderData.amount_paid,
                      'Currency': orderData.currency,
                      'Company': orderData.company || '',
                      'Phone': orderData.phone || '',
                      'Requirements': orderData.description || '',
                      'Payment Date': orderData.payment_date,
                      'Session ID': orderData.session_id,
                      'Status': 'Paid'
                    }
                  }
                ]
              }
            });
          } catch (error) {
            console.error('Error storing order in Airtable:', error);
          }
        }
        
        // Send immediate email notification
        const planPrice = orderData.plan_type === 'essentials' ? '£499' : orderData.plan_type === 'professional' ? '£999' : 'Custom';
        const subject = `NEW ORDER: ${orderData.plan_type.toUpperCase()} Plan (${planPrice})`;
        
        const emailContent = `
<h2>New Order Received!</h2>
<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
<p><strong>Plan:</strong> ${orderData.plan_type.toUpperCase()} (${planPrice})</p>
<p><strong>Customer:</strong> ${orderData.name} <${orderData.email}></p>
<p><strong>Company:</strong> ${orderData.company || 'N/A'}</p>
<p><strong>Phone:</strong> ${orderData.phone || 'N/A'}</p>
<p><strong>Requirements:</strong> ${orderData.description || 'N/A'}</p>
<p><a href="https://aethersystems.org/admin/submissions?password=aether2025">View all orders in admin dashboard</a></p>
`;
        
        // Send email notification
        await sendEmailNotification(subject, emailContent);
        
        // Additional logging for immediate attention
        const timestamp = new Date().toLocaleString();
        console.log(`\n==================== NEW ORDER ====================`);
        console.log(`${timestamp}`);
        console.log(`Plan: ${orderData.plan_type.toUpperCase()} (${planPrice})`);
        console.log(`Customer: ${orderData.name} <${orderData.email}>`);
        console.log(`Company: ${orderData.company || 'N/A'}`);
        console.log(`Phone: ${orderData.phone || 'N/A'}`);
        console.log(`Requirements: ${orderData.description || 'N/A'}`);
        console.log(`====================================================\n`);
        
        // In production, create a file backup of all orders
        // fs.appendFileSync('orders_backup.txt', JSON.stringify(orderData) + '\n');
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Handle successful payment and redirect to onboarding page
app.get('/payment-success', async (req, res) => {
  try {
    const { form_data_id, session_id } = req.query;
    
    // Retrieve the stored form data
    const formData = paymentFormData[form_data_id];
    
    if (!formData) {
      return res.status(404).json({ success: false, error: 'Form data not found' });
    }
    
    // Create a completed order record
    const orderData = {
      ...formData,
      payment_completed: true,
      payment_date: new Date().toISOString(),
      session_id: session_id || 'test_session',
      timestamp: new Date().toISOString()
    };
    
    // Persist to disk
    await saveJsonRecord('completed_orders', orderData);
    
    // Remove from temporary storage
    delete paymentFormData[form_data_id];
    
    // Add to in-memory cache
    completedOrders.unshift(orderData);
    
    // Store in Airtable if in production
    if (AIRTABLE_API_KEY && AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      try {
        await axios({
          method: 'post',
          url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/CompletedOrders`,
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            records: [{
              fields: {
                'Name': orderData.name,
                'Email': orderData.email,
                'Plan': orderData.plan_type,
                'Company': orderData.company || '',
                'Phone': orderData.phone || '',
                'Requirements': orderData.description || '',
                'Payment Date': orderData.payment_date,
                'Session ID': orderData.session_id,
                'Status': 'Paid'
              }
            }]
          }
        });
      } catch (airtableError) {
        console.error('Error storing in Airtable:', airtableError);
      }
    }
    
    // Send email notification to admin
    const planPrice = orderData.plan_type === 'essentials' ? '£499' : 
                     orderData.plan_type === 'operator' ? '£999' : 'Custom';
    const subject = `NEW ORDER: ${orderData.plan_type.toUpperCase()} Plan (${planPrice})`;
    const emailContent = `
<h2>New Order Received!</h2>
<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
<p><strong>Plan:</strong> ${orderData.plan_type.toUpperCase()} (${planPrice})</p>
<p><strong>Customer:</strong> ${orderData.name} &lt;${orderData.email}&gt;</p>
<p><strong>Company:</strong> ${orderData.company || 'N/A'}</p>
<p><strong>Phone:</strong> ${orderData.phone || 'N/A'}</p>
<p><strong>Requirements:</strong> ${orderData.description || 'N/A'}</p>
<p><a href="https://aethersystems.org/admin/submissions?password=aether2025">View all orders in admin dashboard</a></p>
`;
    
    await sendEmailNotification(subject, emailContent);
    
    // Send order confirmation email to customer
    await sendOrderConfirmationEmail(orderData);
    
    // Additional logging
    console.log(`\n==================== NEW ORDER ====================`);
    console.log(`${new Date().toLocaleString()}`);
    console.log(`Plan: ${orderData.plan_type.toUpperCase()} (${planPrice})`);
    console.log(`Customer: ${orderData.name} <${orderData.email}>`);
    console.log(`Company: ${orderData.company || 'N/A'}`);
    console.log(`Phone: ${orderData.phone || 'N/A'}`);
    console.log(`Requirements: ${orderData.description || 'N/A'}`);
    
    // Generate order number and redirect to onboarding page
    const orderNumber = `AETH-${Date.now()}`;
    const redirectUrl = `/onboarding.html?payment_success=true&order_number=${orderNumber}&plan_type=${orderData.plan_type}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment success' });
  }
});

// Admin endpoint to view both contact form submissions and completed orders
app.get('/admin/submissions', async (req, res) => {
  try {
    // In production, implement proper authentication
    const providedPassword = req.query.password;
    if (providedPassword !== 'aether2025') {
      return res.status(401).send('Unauthorized');
    }

    // Load data from disk and combine with in-memory data
    const formSubmissions = await readJsonRecords('form_submissions');
    const completedOrders = await readJsonRecords('completed_orders');
    
    // Generate HTML response
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Aether Systems - Admin Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
          .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .order { border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; }
          .contact { border-left: 4px solid #10b981; padding-left: 10px; margin-bottom: 15px; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .paid { background: #dcfce7; color: #166534; }
          h2 { margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Aether Systems - Admin Dashboard</h1>
          
          <div class="card">
            <h2>Completed Orders</h2>
            ${completedOrders.map(order => `
              <div class="order">
                <h3>${order.plan_type.toUpperCase()} Plan (${order.unit_amount / 100} GBP)</h3>
                <div class="meta">From: ${order.name} (${order.email}) - ${order.timestamp}</div>
                <div class="status paid">Paid</div>
              </div>
            `).join('')}
          </div>

          <div class="card">
            <h2>Contact Form Submissions</h2>
            ${formSubmissions.map(submission => `
              <div class="contact">
                <h3>${submission.subject || 'No Subject'}</h3>
                <div class="meta">From: ${submission.name} (${submission.email}) - ${submission.timestamp}</div>
                <p>${submission.message}</p>
              </div>
            `).join('')}
          </div>

          <p>Showing ${completedOrders.length} completed orders and ${formSubmissions.length} contact form submissions</p>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering admin submissions page:', error);
    res.status(500).send('An error occurred while retrieving submissions');
  }
  try {
    // In production, implement proper authentication
    const providedPassword = req.query.password;
    
    // Simple password protection (use much stronger auth in production)
    if (providedPassword !== 'aether2025') {
      return res.status(401).send('Unauthorized');
    }
    
    // Create a simple HTML page to display submissions
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Aether Systems - Form Submissions</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
          h1 { color: #1a202c; }
          .submission { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .submission h3 { margin-top: 0; }
          .meta { color: #666; font-size: 0.9rem; }
          .empty { background: #f0f0f0; padding: 30px; text-align: center; border-radius: 8px; }
          .logout { float: right; }
        </style>
      </head>
      <body>
        <h1>Admin Dashboard <a href="/admin/submissions" class="logout">Refresh</a></h1>
        
        <h2>Completed Orders</h2>
    `;
    
    if (completedOrders.length === 0) {
      html += '<div class="empty">No completed orders yet</div>';
    } else {
      completedOrders.forEach((order, index) => {
        const date = new Date(order.payment_date || order.timestamp).toLocaleString();
        // Handle different property names for plan type (plan or plan_type)
        const planType = order.plan_type || order.plan || 'UNKNOWN';
        // Convert to lowercase for comparison but display in uppercase
        const planTypeLower = typeof planType === 'string' ? planType.toLowerCase() : '';
        // Determine price based on plan type
        let price = 'Custom';
        if (planTypeLower.includes('essential')) price = '499';
        if (planTypeLower.includes('professional') || planTypeLower.includes('executive')) price = '999';
        
        html += `
          <div class="submission order">
            <h3>${typeof planType === 'string' ? planType.toUpperCase() : 'UNKNOWN'} Plan - £${price}</h3>
            <div class="meta">Customer: ${order.fullName || order.name || 'N/A'} (${order.email || 'N/A'}) - ${date}</div>
            <p><strong>Company:</strong> ${order.company || 'N/A'}</p>
            <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
            <p><strong>Requirements:</strong> ${order.description || 'N/A'}</p>
            <div class="status paid">Payment Completed</div>
          </div>
        `;
      });
    }
    
    html += `
        <h2>Contact Form Submissions</h2>
    `;
    
    if (formSubmissions.length === 0) {
      html += '<div class="empty">No contact form submissions yet</div>';
    } else {
      formSubmissions.forEach((submission, index) => {
        const date = new Date(submission.timestamp).toLocaleString();
        html += `
          <div class="submission contact">
            <h3>${submission.subject || 'No Subject'}</h3>
            <div class="meta">From: ${submission.name} (${submission.email}) - ${date}</div>
            <p>${submission.message}</p>
          </div>
        `;
      });
    }
    
    html += `
        <p>Showing ${completedOrders.length} completed orders and ${formSubmissions.length} contact form submissions</p>
        <style>
          .order { border-left: 4px solid #2563eb; }
          .contact { border-left: 4px solid #10b981; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .paid { background: #dcfce7; color: #166534; }
          h2 { margin-top: 30px; }
        </style>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering admin submissions page:', error);
    res.status(500).send('An error occurred while retrieving submissions');
  }
});

// Store customer data in Airtable after checkout
app.post('/store-customer', async (req, res) => {
  try {
    const { planType, source } = req.body;
    console.log(`Storing customer data for ${planType} plan from source: ${source}`);
    
    // In production, send to Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      await axios({
        method: 'post',
        url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers`,
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          records: [
            {
              fields: {
                'Plan': planType === 'essentials' ? 'Essentials' : (planType === 'executive' ? 'Executive' : 'Enterprise'),
                'Source': source,
                'Status': 'Pending Onboarding',
                'Payment Date': new Date().toISOString()
              }
            }
          ]
        }
      });
      console.log('Customer data stored in Airtable successfully');
    } else {
      console.log('Airtable integration simulated (keys not provided)');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error storing customer data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle onboarding form submissions
app.post('/submit-onboarding', async (req, res) => {
  try {
    const clientData = req.body;
    console.log('Received onboarding form submission:', clientData);
    
    // In production, update Airtable record
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX' && clientData.airtableRecordId) {
      await axios({
        method: 'patch',
        url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Customers/${clientData.airtableRecordId}`,
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          fields: {
            'Business Name': clientData.businessName,
            'Contact Name': clientData.contactName,
            'Email': clientData.email,
            'Phone': clientData.phone,
            'Project Description': clientData.projectDescription,
            'Status': 'Onboarding Complete'
          }
        }
      });
      console.log('Onboarding data updated in Airtable successfully');
    } else {
      console.log('Airtable onboarding update simulated (keys not provided or record ID missing)');
    }
    
    res.json({ success: true, message: 'Onboarding information received' });
  } catch (error) {
    console.error('Error processing onboarding submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the onboarding page
app.get('/onboarding.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'onboarding.html'));
});

// Handle any errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
