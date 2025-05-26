// Client-side JavaScript for Stripe integration
document.addEventListener('DOMContentLoaded', function() {
    // Load Stripe.js - use your own publishable key in production
    const stripe = Stripe('pk_test_your_publishable_key');

    // Track page view for Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Aether Enterprise Solutions',
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }

    // Check for successful payment return
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
        const planType = urlParams.get('plan_type');
        // Send data to Airtable and redirect to onboarding
        sendToAirtable(planType)
            .then(() => {
                window.location.href = '/onboarding.html';
            })
            .catch(error => {
                console.error('Error sending to Airtable:', error);
                // Redirect anyway to ensure user experience isn't broken
                window.location.href = '/onboarding.html';
            });
    }

    // Send customer data to Airtable
    function sendToAirtable(planType) {
        return fetch('/store-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planType: planType,
                source: document.referrer || 'direct'
            })
        });
    }

    // Get references to the buy buttons
    const essentialsBuyButton = document.getElementById('essentials-buy-button');
    const executiveBuyButton = document.getElementById('executive-buy-button');
    const enterpriseBuyButton = document.getElementById('enterprise-buy-button');
    const heroEnterpriseButton = document.getElementById('hero-enterprise-button');
    
    // Add click event listeners
    if (essentialsBuyButton) {
        essentialsBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to requirements form with plan type and price
            window.location.href = '/lean-ui.html?plan=basic&price=499';
        });
    }
    
    if (executiveBuyButton) {
        executiveBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to requirements form with plan type and price
            window.location.href = '/lean-ui.html?plan=professional&price=999';
        });
    }
    
    if (enterpriseBuyButton) {
        enterpriseBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to requirements form with plan type and price
            window.location.href = '/lean-ui.html?plan=enterprise&price=custom';
        });
    }
    
    // Add click event for the hero section enterprise button
    if (heroEnterpriseButton) {
        heroEnterpriseButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to requirements form with plan type and price
            window.location.href = '/lean-ui.html?plan=enterprise&price=custom';
        });
    }
    
    // Function to create a checkout session
    function createCheckoutSession(planType) {
        // Track click event for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'select_tier', {
                'event_category': 'premium_tier',
                'event_label': planType
            });
        }
        
        // Call the server to create a checkout session
        fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: planType,
                planName: planType
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(session) {
            // Record analytics event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                    'event_category': 'ecommerce',
                    'event_label': planType,
                    'value': planType === 'basic' ? 499 : 999
                });
            }
            
            // Redirect to Stripe Checkout
            return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then(function(result) {
            // If redirectToCheckout fails due to a browser or network
            // error, display the localized error message to your customer
            if (result.error) {
                alert(result.error.message);
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('There was an error processing your payment. Please try again.');
        });
    }
});
