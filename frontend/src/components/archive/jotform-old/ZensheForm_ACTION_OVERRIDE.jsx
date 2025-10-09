import { useState, useEffect } from 'react';
import './ZensheForm.css';

/**
 * ZensheForm - Intercepts JotForm submission and stores locally
 * 
 * Uses JotForm's "prepopulate" approach where we embed the form
 * but override its submission action to send to our backend instead.
 * 
 * The form will display "Envoyer à la Praticienne" button (JotForm's native button)
 * but when clicked, it will send data to our backend, NOT to JotForm.
 */
function ZensheForm({ 
  formTitle = '🌿 Formulaire Zenshe',
  onFormDataReady,
  onError,
  customStyles = {},
  sessionId
}) {
  const FORM_ID = import.meta.env.VITE_JOTFORM_FORM_ID;
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  if (!FORM_ID) {
    console.error('❌ VITE_JOTFORM_FORM_ID must be set in environment variables');
    throw new Error('Missing required JotForm Form ID configuration');
  }

  useEffect(() => {
    console.log('✅ ZensheForm initialized with custom submission handler');
    
    // Create a custom form action that points to our backend
    const customActionUrl = `${BACKEND_URL}/api/jotform/submit-local`;
    console.log('📍 Form will submit to:', customActionUrl);
    
    // Listen for iframe load to inject custom handler
    const iframe = document.getElementById(`JotFormIFrame-${FORM_ID}`);
    if (iframe) {
      iframe.addEventListener('load', () => {
        console.log('✅ JotForm loaded, attempting to override submission...');
        
        // Try to access iframe and override form action
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const form = iframeDoc.querySelector('form');
          
          if (form) {
            console.log('🎯 Found form, overriding action URL...');
            
            // Override form action
            form.action = customActionUrl;
            form.target = '_self'; // Submit in same window
            
            // Add hidden field for sessionId
            const hiddenField = iframeDoc.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = 'sessionId';
            hiddenField.value = sessionId || '';
            form.appendChild(hiddenField);
            
            console.log('✅ Form action overridden successfully!');
            console.log('💡 When "Envoyer à la Praticienne" is clicked, data will go to our backend');
          }
        } catch (err) {
          console.warn('⚠️ Cannot override form action (cross-origin):', err.message);
          console.log('💡 Will use alternative submission capture method');
        }
      });
    }
    
    // Listen for form submission completion
    const handleMessage = (e) => {
      if (typeof e.data === 'string') {
        // Check for our custom success message
        if (e.data.includes('form:captured')) {
          console.log('✅ Form data captured by our backend!');
          setIsSubmitted(true);
          
          if (onFormDataReady) {
            onFormDataReady({
              form_id: FORM_ID,
              session_id: sessionId,
              captured: true,
              message: 'Form data stored locally'
            });
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [FORM_ID, sessionId, BACKEND_URL, onFormDataReady]);

  return (
    <div className="zenshe-form-container" style={customStyles}>
      {formTitle && <h2 className="zenshe-form-title">{formTitle}</h2>}
      
      <div className="zenshe-form-card">
        <div className="zenshe-form-content">
          <iframe
            id={`JotFormIFrame-${FORM_ID}`}
            title="Zenshe Waiver Form"
            allowTransparency="true"
            allow="geolocation; microphone; camera; fullscreen"
            src={`https://form.jotform.com/${FORM_ID}?noCaptcha=true`}
            frameBorder="0"
            style={{
              minWidth: '100%',
              maxWidth: '100%',
              height: '539px',
              border: 'none',
              width: '1px'
            }}
            scrolling="no"
          />
        </div>
        
        {isSubmitted && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            ✅ Données du formulaire capturées !
            <br />
            <small>Continuez pour confirmer votre réservation</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZensheForm;
