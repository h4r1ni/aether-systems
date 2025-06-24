// Form functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('onboarding-form');
    
    // Show/hide domain fields based on radio selection
    const accountStatusRadios = document.querySelectorAll('input[name="account_status"]');
    const domainFields = document.getElementById('domain-fields');
    
    accountStatusRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes' || this.value === 'partial') {
                domainFields.style.display = 'block';
            } else {
                domainFields.style.display = 'none';
            }
        });
    });
    
    // Show/hide other automation field
    const automationFocus = document.getElementById('automation_focus');
    const otherAutomationContainer = document.getElementById('other-automation-container');
    
    automationFocus.addEventListener('change', function() {
        if (this.value === 'other') {
            otherAutomationContainer.style.display = 'block';
        } else {
            otherAutomationContainer.style.display = 'none';
        }
    });
    
    // Form validation and submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset errors
            const errorFields = form.querySelectorAll('.form-group.error');
            errorFields.forEach(field => field.classList.remove('error'));
            
            // Validate required fields
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.parentElement.classList.add('error');
                    isValid = false;
                }
                
                if (field.type === 'email' && field.value.trim()) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(field.value)) {
                        field.parentElement.classList.add('error');
                        isValid = false;
                    }
                }
            });
            
            // Validate other automation field if "other" is selected
            if (document.getElementById('automation_focus').value === 'other') {
                const otherField = document.getElementById('other_automation');
                if (!otherField.value.trim()) {
                    otherField.parentElement.classList.add('error');
                    isValid = false;
                }
            }
            
            if (!isValid) {
                return;
            }
            
            try {
                // Show loading overlay
                document.getElementById('loading-overlay').style.display = 'flex';
                
                // Collect form data
                const formData = {};
                const formElements = form.elements;
                
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name && element.name !== '') {
                        if (element.type === 'checkbox') {
                            if (element.checked) {
                                formData[element.name] = element.checked;
                            }
                        } else if (element.type === 'radio') {
                            if (element.checked) {
                                formData[element.name] = element.value;
                            }
                        } else if (element.type !== 'submit') {
                            formData[element.name] = element.value;
                        }
                    }
                }
                
                // Add plan type and timestamp
                formData.plan_type = 'foundation';
                formData.timestamp = new Date().toISOString();
                
                // Store form data
                const storeResponse = await fetch('/store-form-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!storeResponse.ok) {
                    throw new Error('Failed to store form data');
                }
                
                const storeData = await storeResponse.json();
                const formDataId = storeData.formDataId;
                
                // Track event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'begin_checkout', {
                        'event_category': 'ecommerce',
                        'event_label': 'foundation'
                    });
                }
                
                // Redirect to Stripe checkout
                const response = await fetch('/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        planType: 'foundation',
                        formDataId: formDataId
                    })
                });
                
                const data = await response.json();
                
                if (data.id) {
                    // Redirect to Stripe checkout
                    const stripe = Stripe('pk_test_51RPpIs2cJTJMG24U64IUBt1htmHA8r64WC5jKDIG6bEqCaYxHvpEAY9uDj2b56B8CNuwogt6EkVfJrnTpAbl4lLf00dWTYGznk');
                    stripe.redirectToCheckout({ sessionId: data.id });
                } else {
                    throw new Error('Failed to create checkout session');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('There was an error processing your request. Please try again or contact support.');
                document.getElementById('loading-overlay').style.display = 'none';
            }
        });
    }
});
