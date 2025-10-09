import { useState, useEffect } from 'react';
import './ZensheForm.css';

/**
 * ZensheForm - Simple JotForm Embed with Submission Capture
 * 
 * This component embeds the JotForm and listens for when the user
 * clicks "Envoyer à la Praticienne". It captures that event and
 * notifies the parent, which can then handle the actual submission
 * together with the reservation.
 * 
 * SOLUTION: Use JotForm's callback parameter to get submission ID,
 * then fetch the submission data from JotForm API on backend.
 */
function ZensheForm({ 
  formTitle = '🌿 Formulaire Zenshe',
  onFormDataReady,
  onError,
  customStyles = {}
}) {
  const FORM_ID = import.meta.env.VITE_JOTFORM_FORM_ID;
  const [submissionId, setSubmissionId] = useState(null);
  
  if (!FORM_ID) {
    console.error('❌ VITE_JOTFORM_FORM_ID must be set in environment variables');
    throw new Error('Missing required JotForm Form ID configuration');
  }

  useEffect(() => {
    console.log('✅ ZensheForm initialized (callback capture mode)');
    
    // Listen for JotForm callback messages
    const handleMessage = (e) => {
      if (typeof e.data === 'string') {
        console.log('📩 Message from JotForm:', e.data);
        
        // JotForm sends submission ID in various formats
        if (e.data.includes('submission:') || e.data.includes('submissionID')) {
          try {
            // Try to parse submission ID from message
            const match = e.data.match(/submission[:|=](\d+)/i) || 
                         e.data.match(/submissionID[:|=](\d+)/i);
            
            if (match && match[1]) {
              const subId = match[1];
              console.log('✅ Captured submission ID:', subId);
              setSubmissionId(subId);
              
              // Notify parent with submission ID
              if (onFormDataReady) {
                onFormDataReady({
                  form_id: FORM_ID,
                  submission_id: subId,
                  method: 'api_fetch',
                  message: 'Submission ID captured - fetch from JotForm API'
                });
              }
            }
          } catch (err) {
            console.warn('⚠️ Could not parse submission ID:', err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [FORM_ID, onFormDataReady]);

  return (
    <div className="zenshe-form-container" style={customStyles}>
      {formTitle && <h2 className="zenshe-form-title">{formTitle}</h2>}
      
      <div className="zenshe-form-card">
        <div className="zenshe-form-content">
          <iframe
            id={`JotFormIFrame-${FORM_ID}`}
            title="Zenshe Waiver Form"
            onLoad={() => {
              console.log('✅ JotForm iframe loaded');
              console.log('💡 Fill the form and click "Envoyer à la Praticienne"');
              console.log('💡 The submission will be captured for later processing');
            }}
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
        
        {submissionId && (
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
            ✅ Formulaire soumis ! ID: {submissionId}
            <br />
            <small>Continuez pour confirmer votre réservation</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default ZensheForm;
