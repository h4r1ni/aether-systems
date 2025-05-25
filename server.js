// Aether Enterprise Solutions - Elite Business Transformation Systems
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

// Initialize Express app
const app = express();

// Stripe API configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RPpIs2cJTJMG24U64IUBt1htmHA8r64WC5jKDIG6bEqCaYxHvpEAY9uDj2b56B8CNuwogt6EkVfJrnTpAbl4lLf00dWTYGznk';
const STRIPE_SECRET_KEY = 'sk_test_51RPpIs2cJTJMG24UfIXrPEKDx4Kv5nMdwh8rRiNV1VmtxL0s7fFddAh8gxKnnHXRQClfXaBwsQ4O7pVi7wMh1MX7000IgAuOLo';

// Initialize Stripe with the secret key
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Airtable configuration
const AIRTABLE_API_KEY = 'keyXXXXXXXXXXXXXX'; // Replace with your Airtable API key in production
const AIRTABLE_BASE_ID = 'appXXXXXXXXXXXXXX'; // Replace with your Airtable Base ID in production

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
  res.sendFile(path.join(__dirname, 'professional-ui.html'));
});

// Universal checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, planName } = req.body;
    
    // Price configuration based on plan
    let unitAmount, description, name;
    
    if (priceId === 'essentials') {
      unitAmount = 55500; // £555.00
      name = 'Essentials Solution';
      description = 'Premium workflow automation + 7-day expedited delivery + 2 refinement iterations';
    } else if (priceId === 'executive') {
      unitAmount = 99900; // £999.00
      name = 'Executive Solution';
      description = 'Multi-system integration + 30-day priority support + comprehensive documentation';
    } else if (priceId === 'enterprise') {
      unitAmount = 150000; // £1,500.00
      name = 'Enterprise Transformation';
      description = 'Complete business ecosystem transformation + dedicated CTO & success team';
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
