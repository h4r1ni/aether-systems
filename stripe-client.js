// Client-side JavaScript for Stripe integration
document.addEventListener('DOMContentLoaded', function() {
    // Load Stripe.js - use your own publishable key in production
    const stripe = Stripe('pk_test_51RPpIs2cJTJMG24U64IUBt1htmHA8r64WC5jKDIG6bEqCaYxHvpEAY9uDj2b56B8CNuwogt6EkVfJrnTpAbl4lLf00dWTYGznk');

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
    
    // Get references to the monthly support buttons by directly indexing them
    const supportButtons = document.querySelectorAll('.post-support-section .btn-submit');
    const basicSupportButton = supportButtons[0];  // £30/month - Basic Support
    const standardSupportButton = supportButtons[1];  // £60/month - Standard Support
    const premiumSupportButton = supportButtons[2];  // £100/month - Premium Support
    
    // Get references to the modals
    const essentialsModal = document.getElementById('essentials-modal');
    const professionalModal = document.getElementById('professional-modal');
    const enterpriseModal = document.getElementById('enterprise-modal');
    
    // Add click event listeners for modals
    if (essentialsBuyButton) {
        essentialsBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Open the modal instead of redirecting
            if (essentialsModal) {
                essentialsModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    }
    
    if (executiveBuyButton) {
        executiveBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Open the modal instead of redirecting
            if (professionalModal) {
                professionalModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (enterpriseBuyButton) {
        enterpriseBuyButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Open the modal instead of redirecting
            if (enterpriseModal) {
                enterpriseModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Add click event for the hero section enterprise button
    if (heroEnterpriseButton) {
        heroEnterpriseButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Open the enterprise modal
            if (enterpriseModal) {
                enterpriseModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Add event listeners for the monthly support plan buttons
    if (basicSupportButton) {
        basicSupportButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Use 'basic' as the plan type and 'basic-support' as the support option
            createCheckoutSession('basic', 'basic-support');
        });
    }
    
    if (standardSupportButton) {
        standardSupportButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Use 'basic' as the plan type and 'standard-support' as the support option
            createCheckoutSession('basic', 'standard-support');
        });
    }
    
    if (premiumSupportButton) {
        premiumSupportButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Use 'basic' as the plan type and 'premium-support' as the support option
            createCheckoutSession('basic', 'premium-support');
        });
    }
    
    // Function to get plan value for analytics
    function getPlanValue(planType) {
        switch (planType) {
            case 'basic':
                return 499;
            case 'professional':
                return 999;
            case 'basic-support':
                return 30;
            case 'standard-support':
                return 60;
            case 'premium-support':
                return 100;
            default:
                return 0;
        }
    }
    
    // Function to create a checkout session
    function createCheckoutSession(planType, supportOption = 'no-support') {
        // Track click event for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'select_tier', {
                'event_category': 'premium_tier',
                'event_label': planType,
                'support_option': supportOption
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
                planName: planType,
                supportOption: supportOption // Add support option to the request
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
                    'value': getPlanValue(planType)
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
