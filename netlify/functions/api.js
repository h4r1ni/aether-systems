const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const stripe = require('stripe');

// Import your original server logic
const app = express();

// Initialize Stripe with the secret key
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripe(STRIPE_SECRET_KEY);

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Simple in-memory storage for form submissions and payment form data
// Note: In production, you'd use a database service like Fauna, MongoDB Atlas, etc.
let formSubmissions = [];
let paymentFormData = {}; 
let completedOrders = [];

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Simple notification functions
const sendEmailNotification = async (subject, content) => {
  try {
    console.log(`\n==== EMAIL NOTIFICATION WOULD BE SENT ====`);
    console.log(`TO: contact@aethersystems.org`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT: \n${content}`);
    console.log(`=========================================\n`);
    
    // In production, use a service like SendGrid, Mailgun, etc.
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Store form data before redirecting to payment
app.post('/store-form-data', async (req, res) => {
  try {
    const formData = req.body;
    
    // Generate a unique ID for this form submission
    const formDataId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
    
    // Store the form data with the ID
    paymentFormData[formDataId] = formData;
    
    // Create comprehensive logs of payment form data
    console.log(`\n========== PAYMENT FORM DATA STORED ==========`);
    console.log(`PLAN: ${formData.plan}`);
    console.log(`Customer: ${formData.fullName} (${formData.email})`);
    console.log(`Company: ${formData.company || 'N/A'}`);
    console.log(`Phone: ${formData.phone || 'N/A'}`);
    console.log(`Requirements: ${formData.description || 'N/A'}`);
    console.log(`Timeline: ${formData.timeline || 'N/A'}`);
    console.log(`Form Data ID: ${formDataId}`);
    console.log(`============================================\n`);
    
    // Return the form data ID to be used in the checkout session
    res.json({ success: true, formDataId });
  } catch (error) {
    console.error('Error storing form data:', error);
    res.status(500).json({ success: false, error: 'Failed to store form data' });
  }
});

// Create Stripe checkout session
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
      unitAmount = 0; // Custom pricing determined after consultation
      name = 'Enterprise Plan - Consultation';
      description = 'Full-stack workflows + API builds + onboarding + training + premium support';
    } else {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
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
      success_url: `${req.headers.origin}/onboarding.html?payment_success=true&plan_type=${priceId}&form_data_id=${formDataId}`,
      cancel_url: `${req.headers.origin}/index.html#pricing`,
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

// Handle enterprise quote requests
app.post('/submit-enterprise-quote', async (req, res) => {
  try {
    const customerData = req.body;
    console.log(`Enterprise quote request received from ${customerData.fullName}`);
    
    // In production, submit to Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      try {
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
                  'Phone': customerData.phone,
                  'Company': customerData.company,
                  'Description': customerData.description,
                  'Timeline': customerData.timeline,
                  'Employee Count': customerData.employeeCount,
                  'Budget Range': customerData.budget,
                  'Existing Systems': customerData.existingSystem,
                  'Plan': 'Enterprise',
                  'Status': 'New Lead',
                  'Submission Date': new Date().toISOString()
                }
              }
            ]
          }
        });
        console.log('Enterprise quote request stored in Airtable');
      } catch (airtableError) {
        console.error('Error storing in Airtable:', airtableError);
      }
    }
    
    // Send notification email
    const subject = `🔔 New Enterprise Quote Request from ${customerData.fullName}`;
    const content = `
      <h2>New Enterprise Quote Request</h2>
      <p><strong>Name:</strong> ${customerData.fullName}</p>
      <p><strong>Email:</strong> ${customerData.email}</p>
      <p><strong>Phone:</strong> ${customerData.phone}</p>
      <p><strong>Company:</strong> ${customerData.company}</p>
      <p><strong>Requirements:</strong> ${customerData.description}</p>
      <p><strong>Timeline:</strong> ${customerData.timeline}</p>
      <p><strong>Employee Count:</strong> ${customerData.employeeCount}</p>
      <p><strong>Budget Range:</strong> ${customerData.budget}</p>
      <p><strong>Existing Systems:</strong> ${customerData.existingSystem}</p>
    `;
    
    await sendEmailNotification(subject, content);
    
    res.json({ success: true, message: "Quote request received" });
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
    
    // Store in memory (in production, use a database)
    formSubmissions.unshift(formData);
    
    console.log('\n========== CONTACT FORM SUBMISSION DATA ==========');
    console.log(`From: ${formData.name} (${formData.email})`);
    console.log(`Subject: ${formData.subject}`);
    console.log(`Message: ${formData.message}`);
    console.log(`Timestamp: ${formData.timestamp}`);
    console.log('=================================================\n');
    
    // In production, store in Airtable
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
                  'Submission Date': formData.timestamp
                }
              }
            ]
          }
        });
        console.log('Contact form submission stored in Airtable');
      } catch (airtableError) {
        console.error('Error storing in Airtable:', airtableError);
      }
    }
    
    // Send immediate email notification for contact form
    const subject = `📩 New Contact Form Submission from ${formData.name}`;
    const content = `
<h2>New Contact Form Submission</h2>
<p><strong>From:</strong> ${formData.name} (${formData.email})</p>
<p><strong>Subject:</strong> ${formData.subject}</p>
<p><strong>Message:</strong> ${formData.message}</p>
<p><strong>Time:</strong> ${new Date(formData.timestamp).toLocaleString()}</p>
`;
    
    await sendEmailNotification(subject, content);
    
    console.log(`\n==== NEW CONTACT FORM SUBMISSION ====`);
    console.log(`From: ${formData.name} (${formData.email})`);
    console.log(`=============================================\n`);
    
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ success: false, error: 'Failed to submit form' });
  }
});

// Handle onboarding form submissions
app.post('/submit-onboarding', async (req, res) => {
  try {
    const clientData = req.body;
    console.log('Received onboarding form submission:', clientData);
    
    // In production, store in Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
      try {
        await axios({
          method: 'post',
          url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ClientOnboarding`,
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          data: {
            records: [
              {
                fields: {
                  'Contact Name': clientData.contactName,
                  'Contact Email': clientData.contactEmail,
                  'Contact Phone': clientData.contactPhone,
                  'Company Size': clientData.companySize,
                  'Preferred Start Date': clientData.preferredStartDate,
                  'Business Goal': clientData.businessGoal,
                  'Current Workflow': clientData.currentWorkflow,
                  'Key Requirements': clientData.keyRequirements,
                  'Additional Notes': clientData.additionalNotes,
                  'Submission Date': new Date().toISOString(),
                  'Status': 'New Project'
                }
              }
            ]
          }
        });
        console.log('Onboarding submission stored in Airtable');
      } catch (airtableError) {
        console.error('Error storing in Airtable:', airtableError);
      }
    }
    
    // Send notification email
    const subject = `🚀 New Client Onboarding: ${clientData.contactName}`;
    const content = `
      <h2>New Client Onboarding Submission</h2>
      <p><strong>Contact:</strong> ${clientData.contactName} (${clientData.contactEmail})</p>
      <p><strong>Phone:</strong> ${clientData.contactPhone}</p>
      <p><strong>Company Size:</strong> ${clientData.companySize}</p>
      <p><strong>Start Date:</strong> ${clientData.preferredStartDate}</p>
      <p><strong>Business Goal:</strong> ${clientData.businessGoal}</p>
      <p><strong>Current Workflow:</strong> ${clientData.currentWorkflow}</p>
      <p><strong>Key Requirements:</strong> ${clientData.keyRequirements}</p>
      <p><strong>Additional Notes:</strong> ${clientData.additionalNotes || 'None'}</p>
    `;
    
    await sendEmailNotification(subject, content);
    
    res.json({ success: true, message: 'Onboarding information received' });
  } catch (error) {
    console.error('Error processing onboarding submission:', error);
    res.status(500).json({ success: false, error: 'Failed to process onboarding information' });
  }
});

// Admin dashboard endpoint with robust error handling
app.get('/admin/submissions', (req, res) => {
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
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Configure the API route for serverless
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  // Strip the /api prefix from the path
  if (event.path.startsWith('/api/')) {
    event.path = event.path.replace('/api', '');
    event.rawPath = event.path;
  }
  return await handler(event, context);
};
