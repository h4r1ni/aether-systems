// Enhanced Modal Form Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get references to all modals and forms
  const modals = {
    'essentials': document.getElementById('essentials-modal'),
    'operator': document.getElementById('operator-modal'),
    'enterprise': document.getElementById('enterprise-modal')
  };
  
  const forms = {
    'essentials': document.getElementById('essentials-form'),
    'operator': document.getElementById('operator-form'),
    'enterprise': document.getElementById('enterprise-form')
  };
  
  // Close buttons for modals
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
  
  // Initialize toggleExistingSystem function for all forms
  window.toggleExistingSystem = function(formPrefix) {
    const checkbox = document.getElementById(`${formPrefix}-has-system`);
    const detailsSection = document.getElementById(`${formPrefix}-existing-system-details`);
    
    if (checkbox && detailsSection) {
      detailsSection.style.display = checkbox.checked ? 'block' : 'none';
    }
  };
  
  // Form validation and submission
  for (const [planType, form] of Object.entries(forms)) {
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
            // Find or create error message
            let errorMessage = field.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
              errorMessage = document.createElement('div');
              errorMessage.className = 'error-message';
              errorMessage.textContent = 'This field is required';
              field.parentNode.appendChild(errorMessage);
            }
            errorMessage.style.display = 'block';
            field.closest('.form-group').classList.add('error');
          }
        });
        
        // Check email format if provided
        const emailField = form.querySelector('input[type="email"]');
        if (emailField && emailField.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(emailField.value.trim())) {
            isValid = false;
            let errorMessage = emailField.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
              errorMessage = document.createElement('div');
              errorMessage.className = 'error-message';
              errorMessage.textContent = 'Please enter a valid email address';
              emailField.parentNode.appendChild(errorMessage);
            }
            errorMessage.style.display = 'block';
            emailField.closest('.form-group').classList.add('error');
          }
        }
        
        if (!isValid) {
          return;
        }
        
        try {
          // Show loading state
          const formElement = form;
          const loadingElement = document.createElement('div');
          loadingElement.className = 'form-loading';
          loadingElement.innerHTML = '<div class="spinner"></div><p>Processing your request...</p>';
          
          // Hide form and show loading
          formElement.style.display = 'none';
          formElement.parentNode.appendChild(loadingElement);
          loadingElement.style.display = 'block';
          
          // Collect form data
          const formData = {};
          const formElements = form.elements;
          
          for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.name !== '') {
              if (element.type === 'checkbox') {
                formData[element.name] = element.checked;
              } else if (element.type !== 'submit') {
                formData[element.name] = element.value;
              }
            }
          }
          
          // Add plan type and timestamp
          formData.plan_type = planType;
          formData.timestamp = new Date().toISOString();
          
          // For enterprise plan, submit directly
          if (planType === 'enterprise') {
            const response = await fetch('/submit-enterprise-quote', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData)
            });
            
            if (response.ok) {
              // Show success message
              showSuccessMessage(planType, loadingElement);
              
              // Track conversion
              if (typeof gtag !== 'undefined') {
                gtag('event', 'enterprise_quote_submitted', {
                  'event_category': 'lead',
                  'event_label': 'enterprise'
                });
              }
            } else {
              throw new Error('Failed to submit enterprise quote');
            }
          } else {
            // For paid plans, store form data then redirect to Stripe
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
            const formDataId = storeData.id;
            
            // Get the selected support option (if any)
            let supportOption = formData['support-option'] || 'no-support';
            
            // Redirect to Stripe checkout
            const response = await fetch('/create-checkout-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                planType: planType,
                formDataId: formDataId,
                supportOption: supportOption
              })
            });
            
            const data = await response.json();
            
            if (data.id) {
              // Track event
              if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                  'event_category': 'ecommerce',
                  'event_label': planType
                });
              }
              
              // Redirect to Stripe checkout
              const stripe = Stripe('pk_test_51RPpIs2cJTJMG24U64IUBt1htmHA8r64WC5jKDIG6bEqCaYxHvpEAY9uDj2b56B8CNuwogt6EkVfJrnTpAbl4lLf00dWTYGznk');
              stripe.redirectToCheckout({ sessionId: data.id });
            } else {
              throw new Error('Failed to create checkout session');
            }
          }
        } catch (error) {
          console.error('Error:', error);
          alert('There was an error processing your request. Please try again or contact support.');
          
          // Remove loading state and show form again
          const loadingElement = form.parentNode.querySelector('.form-loading');
          if (loadingElement) {
            loadingElement.remove();
          }
          form.style.display = 'block';
        }
      });
    }
  }
  
  // Function to show success message
  function showSuccessMessage(planType, loadingElement) {
    const successElement = document.createElement('div');
    successElement.className = 'form-success';
    
    let message = '';
    if (planType === 'enterprise') {
      message = `
        <div class="checkmark"></div>
        <h4>Thank You!</h4>
        <p>Your enterprise quote request has been submitted successfully.</p>
        <p>Our team will contact you within 24 hours to schedule your consultation.</p>
      `;
    } else {
      message = `
        <div class="checkmark"></div>
        <h4>Thank You!</h4>
        <p>Your submission has been received successfully.</p>
        <p>You will be redirected to the payment page shortly.</p>
      `;
    }
    
    successElement.innerHTML = message;
    
    // Remove loading element and add success element
    loadingElement.parentNode.appendChild(successElement);
    loadingElement.remove();
    successElement.style.display = 'block';
    
    // For enterprise, close modal after 5 seconds
    if (planType === 'enterprise') {
      setTimeout(() => {
        const modal = document.getElementById(`${planType}-modal`);
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
          
          // Reset and show form again for future use
          const form = document.getElementById(`${planType}-form`);
          const successElement = modal.querySelector('.form-success');
          if (form && successElement) {
            form.reset();
            form.style.display = 'block';
            successElement.remove();
          }
        }
      }, 5000);
    }
  }
  
  // Handle payment success redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment_success') === 'true') {
    const planType = urlParams.get('plan_type');
    const formDataId = urlParams.get('form_data_id');
    
    // Send confirmation email and redirect to onboarding
    fetch('/payment-successful', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: planType,
        formDataId: formDataId
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to process payment confirmation');
      }
      return response.json();
    })
    .then(data => {
      // Track purchase event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
          'event_category': 'ecommerce',
          'event_label': planType
        });
      }
      
      // Redirect to onboarding with plan info
      window.location.href = `/onboarding.html?plan=${planType}&payment_success=true`;
    })
    .catch(error => {
      console.error('Error:', error);
      // Still redirect to onboarding even if email fails
      window.location.href = `/onboarding.html?plan=${planType}&payment_success=true`;
    });
  }
});
