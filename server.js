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

// Simple in-memory storage for form submissions (in production, use a database)
let formSubmissions = [];

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
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

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Universal checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, planName } = req.body;
    
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
      unitAmount = 150000; // Custom pricing starting at £1,500.00
      name = 'Enterprise Plan';
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
      success_url: `${req.protocol}://${req.get('host')}/professional-ui.html?payment_success=true&plan_type=${priceId}`,
      cancel_url: `${req.protocol}://${req.get('host')}/professional-ui.html#pricing`,
      metadata: {
        plan_type: priceId
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
    
    // In production, send to Airtable
    if (AIRTABLE_API_KEY !== 'keyXXXXXXXXXXXXXX') {
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
    }
    
    // Send email notification to business owner
    // In production, implement email sending functionality here
    console.log(`New contact form submission from ${formData.name} (${formData.email})`);
    
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ success: false, error: 'Failed to submit form' });
  }
});

// Admin endpoint to view form submissions - password protected
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
      <h1>Form Submissions <a href="/admin/submissions" class="logout">Refresh</a></h1>
  `;
  
  if (formSubmissions.length === 0) {
    html += '<div class="empty">No submissions yet</div>';
  } else {
    formSubmissions.forEach((submission, index) => {
      const date = new Date(submission.timestamp).toLocaleString();
      html += `
        <div class="submission">
          <h3>${submission.subject || 'No Subject'}</h3>
          <div class="meta">From: ${submission.name} (${submission.email}) - ${date}</div>
          <p>${submission.message}</p>
        </div>
      `;
    });
  }
  
  html += `
      <p>Showing ${formSubmissions.length} most recent submissions</p>
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
