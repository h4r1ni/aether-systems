// Form functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle domain fields
    function toggleDomainFields() {
        const accountStatus = document.querySelector('input[name="account-status"]:checked')?.value;
        const domainFields = document.getElementById('domain-fields');
        
        if (domainFields && (accountStatus === 'yes' || accountStatus === 'partial')) {
            domainFields.style.display = 'block';
        } else if (domainFields) {
            domainFields.style.display = 'none';
        }
    }
    
    // Add event listeners to radio buttons
    const accountStatusRadios = document.querySelectorAll('input[name="account-status"]');
    accountStatusRadios.forEach(radio => {
        radio.addEventListener('change', toggleDomainFields);
    });
    
    // Check for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('quote_submitted') === 'true') {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quote_request', {
                'event_category': 'conversion',
                'event_label': 'enterprise'
            });
        }
    }
    
    // Form validation and submission
    const form = document.getElementById('enterprise-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset error messages
            const errorElements = form.querySelectorAll('.error-message');
            errorElements.forEach(el => {
                el.style.display = 'none';
                el.closest('.form-group')?.classList.remove('error');
            });
            
            // Validate form
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    const errorMessage = field.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('error-message')) {
                        errorMessage.style.display = 'block';
                        field.closest('.form-group').classList.add('error');
                    }
                }
            });
            
            // Check email format
            const emailField = document.getElementById('email');
            if (emailField && emailField.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailField.value.trim())) {
                    isValid = false;
                    const errorMessage = emailField.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('error-message')) {
                        errorMessage.style.display = 'block';
                        emailField.closest('.form-group').classList.add('error');
                    }
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
                                // For checkboxes with the same name, we need to handle multiple values
                                if (element.name === 'systems-needed') {
                                    if (!formData[element.name]) {
                                        formData[element.name] = [];
                                    }
                                    formData[element.name].push(element.value);
                                } else {
                                    formData[element.name] = element.checked;
                                }
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
                formData.plan_type = 'enterprise';
                formData.timestamp = new Date().toISOString();
                
                // Submit enterprise quote
                const response = await fetch('/submit-enterprise-quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to submit quote request');
                }
                
                // Track event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'quote_submitted', {
                        'event_category': 'lead',
                        'event_label': 'enterprise'
                    });
                }
                
                // Show success message
                document.getElementById('form-container').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';
                
                // Update URL with success parameter
                const url = new URL(window.location);
                url.searchParams.set('quote_submitted', 'true');
                window.history.pushState({}, '', url);
                
            } catch (error) {
                console.error('Error:', error);
                alert('There was an error processing your request. Please try again or contact support.');
                document.getElementById('loading-overlay').style.display = 'none';
            }
        });
    }
});
