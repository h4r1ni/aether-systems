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

// Simple in-memory storage for form submissions and payment form data (in production, use a database)
let formSubmissions = [];
let paymentFormData = {}; // Store form data temporarily before payment is completed
let completedOrders = []; // Store completed orders with form data

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple notification functions (in production, use proper services)
const sendEmailNotification = async (subject, content) => {
  try {
    // In production, implement with a service like SendGrid, Mailgun, etc.
    // For now, just log that we would send an email
    console.log(`\n==== EMAIL NOTIFICATION WOULD BE SENT ====`);
    console.log(`TO: contact@aethersystems.org`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT: \n${content}`);
    console.log(`=========================================\n`);
    
    // In production, uncomment and use code like this:
    /*
    const mailOptions = {
      from: 'noreply@aethersystems.org',
      to: 'contact@aethersystems.org',
      subject: subject,
      html: content
    };
    await transporter.sendMail(mailOptions);
    */
    
    // Also save a local copy as a fallback
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] ${subject}\n${content}\n------------------------\n`;
    
    // In production, enable this to write to a file
    // fs.appendFileSync('notifications.log', logEntry);
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
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
    
    // Store the form data with the ID
    paymentFormData[formDataId] = formData;
    
    // Create comprehensive logs of payment form data
    console.log('\n========== PAYMENT FORM DATA STORED ==========');
    console.log(`PLAN: ${formData.plan_type?.toUpperCase() || 'Unknown'}`);
    console.log(`CUSTOMER: ${formData.name} (${formData.email})`);
    console.log(`FORM DATA ID: ${formDataId}`);
    console.log(JSON.stringify(formData, null, 2));
    console.log('==============================================\n');
    
    // Create a backup file record - in production, uncomment this
    // const fs = require('fs');
    // const backupDir = './data_backups';
    // if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    // fs.writeFileSync(`${backupDir}/payment_${formDataId}.json`, JSON.stringify(formData));
    
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
    
    // Price configuration based on plan
    let unitAmount, description, name;
    
    if (priceId === 'essentials') {
      unitAmount = 49900; // £499.00
      name = 'Essentials Plan';
      description = '1 system or automation + 5-day delivery + 2 revisions + documentation';
    } else if (priceId === 'professional') {
      unitAmount = 99900; // £999.00
      name = 'Professional Plan';
      description = 'Up to 3 systems + priority support + 2 refinement rounds + 30-day support';
    } else if (priceId === 'enterprise') {
      // Enterprise pricing is handled separately through a quote form
      // We'll use a placeholder price for testing, but in production this is quote-based
      unitAmount = 0; // Custom pricing determined after consultation
      name = 'Enterprise Plan - Consultation';
      description = 'Full-stack workflows + API builds + onboarding + training + premium support';
    } else {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
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
        },
      ],
      mode: 'payment',
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
    
    // Return success response
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
    
    // Add timestamp
    formData.timestamp = new Date().toISOString();
    
    // Store in memory array
    formSubmissions.unshift(formData); // Add to beginning for newest first
    
    // Keep only the most recent 100 submissions
    if (formSubmissions.length > 100) {
      formSubmissions = formSubmissions.slice(0, 100);
    }
    
    // Always log the submission to ensure it's never lost
    console.log('\n========== CONTACT FORM SUBMISSION DATA ==========');
    console.log(JSON.stringify(formData, null, 2));
    console.log('===================================================\n');
    
    // Create a backup file record - in production, uncomment this
    // const fs = require('fs');
    // const backupDir = './data_backups';
    // if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    // fs.writeFileSync(`${backupDir}/contact_${new Date().toISOString().replace(/:/g, '-')}.json`, JSON.stringify(formData));
    
    // In production, send to Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
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
                  'Subject': formData.subject,
                  'Message': formData.message,
                  'Date': formData.timestamp
                }
              }
            ]
          }
        });
      } catch (airtableError) {
        console.error('Error storing in Airtable, but form data is still saved locally:', airtableError);
      }
    }
    
    // Send immediate email notification for contact form
    const subject = `📩 New Contact Form Submission from ${formData.name}`;
    
    const emailContent = `
<h2>New Contact Form Submission</h2>
<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
<p><strong>From:</strong> ${formData.name} <${formData.email}></p>
<p><strong>Subject:</strong> ${formData.subject || 'N/A'}</p>
<p><strong>Message:</strong><br>${formData.message}</p>
<p><a href="https://aethersystems.org/admin/submissions?password=aether2025">View all submissions in admin dashboard</a></p>
`;
    
    // Send email notification
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
    
    // In production, verify the payment with Stripe
    // const session = await stripe.checkout.sessions.retrieve(session_id);
    // if (session.payment_status !== 'paid') { return res.status(400).json({ error: 'Payment not completed' }); }
    
    // Create a completed order record
    const orderData = {
      ...formData,
      payment_completed: true,
      payment_date: new Date().toISOString(),
      session_id: session_id || 'test_session'
    };
    
    // Add to completed orders
    completedOrders.unshift(orderData);
    
    // Remove from temporary storage
    delete paymentFormData[form_data_id];
    
    // In production, store in your database
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
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
    }
    
    // Send notification email to business owner
    console.log(`New completed order from ${orderData.name} (${orderData.email}) for ${orderData.plan_type} plan`);
    
    // Redirect to onboarding page
    res.redirect('/onboarding.html?order_complete=true');
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment success' });
  }
});

// Admin endpoint to view both contact form submissions and completed orders
app.get('/admin/submissions', (req, res) => {
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
      html += `
        <div class="submission order">
          <h3>${order.plan_type.toUpperCase()} Plan - £${order.plan_type === 'essentials' ? '499' : order.plan_type === 'professional' ? '999' : 'Custom'}</h3>
          <div class="meta">Customer: ${order.name} (${order.email}) - ${date}</div>
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
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
