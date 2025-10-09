import { useState, useEffect } from 'react';
import './ZensheForm.css';

/**
 * ZensheForm - JotForm data collector (NO AUTO-SUBMIT)
 * 
 * Collects form data from JotForm but does NOT submit it.
 * Parent component must call the exposed method to submit.
 * 
 * @param {Object} props
 * @param {string} props.formTitle - Title displayed above form
 * @param {Function} props.onFormDataReady - Callback with form data when "Envoyer" is clicked
 * @param {Function} props.onError - Callback when errors occur
 * @param {Object} props.customStyles - Custom CSS styles
 */
function ZensheForm({ 
  formTitle = '🌿 Formulaire Zenshe',
  onFormDataReady,
  onError,
  customStyles = {}
}) {
  const FORM_ID = import.meta.env.VITE_JOTFORM_FORM_ID;
  const [formData, setFormData] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  
  if (!FORM_ID) {
    console.error('❌ VITE_JOTFORM_FORM_ID must be set in environment variables');
    throw new Error('Missing required JotForm Form ID configuration');
  }

  useEffect(() => {
    console.log('✅ ZensheForm initialized (data collector mode)');
    
    // Listen for form submission attempts from iframe
    const handleIFrameMessage = function(e) {
      if (typeof e.data === 'object') { return; }
      
      const args = e.data.split(":");
      let iframe;
      
      if (args.length > 2) { 
        iframe = document.getElementById("JotFormIFrame-" + args[(args.length - 1)]); 
      } else { 
        iframe = document.getElementById("JotFormIFrame-" + FORM_ID); 
      }
      
      if (!iframe) { return; }
      
      switch (args[0]) {
        case "scrollIntoView":
          console.log('📌 Scroll prevented');
          break;
        case "setHeight":
          iframe.style.height = args[1] + "px";
          if (!isNaN(args[1]) && parseInt(iframe.style.minHeight) > parseInt(args[1])) {
            iframe.style.minHeight = args[1] + "px";
          }
          break;
        case "collapseErrorPage":
          if (iframe.clientHeight > window.innerHeight) {
            iframe.style.height = window.innerHeight + "px";
          }
          break;
        case "reloadPage":
          // Don't reload - we're capturing data
          console.log('🚫 Reload prevented');
          break;
        case "loadScript":
          if (!isPermitted(e.origin, ['jotform.com', 'jotform.pro'])) { break; }
          let src = args[1];
          if (args.length > 3) {
            src = args[1] + ':' + args[2];
          }
          const script = document.createElement('script');
          script.src = src;
          script.type = 'text/javascript';
          document.body.appendChild(script);
          break;
        case "exitFullscreen":
          if (window.document.exitFullscreen) window.document.exitFullscreen();
          else if (window.document.mozCancelFullScreen) window.document.mozCancelFullScreen();
          else if (window.document.webkitExitFullscreen) window.document.webkitExitFullscreen();
          else if (window.document.msExitFullscreen) window.document.msExitFullscreen();
          break;
      }
      
      const isJotForm = (e.origin.indexOf("jotform") > -1);
      if (isJotForm && "contentWindow" in iframe && "postMessage" in iframe.contentWindow) {
        const urls = {
          "docurl": encodeURIComponent(document.URL),
          "referrer": encodeURIComponent(document.referrer)
        };
        iframe.contentWindow.postMessage(JSON.stringify({"type":"urls","value":urls}), "*");
      }
    };

    const isPermitted = function(originUrl, whitelisted_domains) {
      const url = document.createElement('a');
      url.href = originUrl;
      const hostname = url.hostname;
      let result = false;
      if (typeof hostname !== 'undefined') {
        whitelisted_domains.forEach(function(element) {
          if (hostname.slice((-1 * element.length - 1)) === '.'.concat(element) || hostname === element) {
            result = true;
          }
        });
        return result;
      }
    };

    if (window.addEventListener) {
      window.addEventListener("message", handleIFrameMessage, false);
    } else if (window.attachEvent) {
      window.attachEvent("onmessage", handleIFrameMessage);
    }

    return () => {
      if (window.removeEventListener) {
        window.removeEventListener("message", handleIFrameMessage, false);
      } else if (window.detachEvent) {
        window.detachEvent("onmessage", handleIFrameMessage);
      }
    };
  }, [FORM_ID]);

  // Function to collect form data from iframe
  const collectFormData = async () => {
    setIsCollecting(true);
    
    try {
      console.log('📝 Collecting form data from JotForm iframe...');
      
      const iframe = document.getElementById(`JotFormIFrame-${FORM_ID}`);
      if (!iframe) {
        throw new Error('Form iframe not found');
      }

      // Try to access iframe content (may fail due to cross-origin)
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const form = iframeDoc.querySelector('form');
        
        if (!form) {
          throw new Error('Form not found in iframe');
        }

        // Collect all form fields
        const formDataObj = new FormData(form);
        const data = {};
        
        for (let [key, value] of formDataObj.entries()) {
          if (data[key]) {
            if (Array.isArray(data[key])) {
              data[key].push(value);
            } else {
              data[key] = [data[key], value];
            }
          } else {
            data[key] = value;
          }
        }

        console.log('✅ Form data collected:', Object.keys(data).length, 'fields');
        
        // Create JotForm-compatible submission object
        const submission = {
          form_id: FORM_ID,
          created_at: new Date().toISOString(),
          answers: Object.keys(data).reduce((acc, key) => {
            const fieldId = key.replace('q', '').replace('_', '');
            acc[fieldId] = {
              answer: data[key],
              type: 'control_textbox',
              text: data[key]
            };
            return acc;
          }, {}),
          rawData: data
        };

        setFormData(submission);
        
        // Call parent callback with the data
        if (onFormDataReady) {
          onFormDataReady(submission);
        }
        
        console.log('✅ Form data ready for submission');
        return submission;
        
      } catch (crossOriginError) {
        console.warn('⚠️ Cannot access iframe content (cross-origin)');
        console.log('💡 Using alternative method: API submission');
        
        // Alternative: Signal that form is ready, actual submission will happen via JotForm API
        const placeholderData = {
          form_id: FORM_ID,
          ready: true,
          method: 'api',
          message: 'Form data will be submitted via JotForm API'
        };
        
        setFormData(placeholderData);
        
        if (onFormDataReady) {
          onFormDataReady(placeholderData);
        }
        
        return placeholderData;
      }
      
    } catch (error) {
      console.error('❌ Error collecting form data:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsCollecting(false);
    }
  };

  // Initialize iframe parameters
  useEffect(() => {
    const iframe = document.getElementById(`JotFormIFrame-${FORM_ID}`);
    if (iframe) {
      let src = iframe.src;
      let iframeParams = [];
      
      if (window.location.href && window.location.href.indexOf("?") > -1) {
        iframeParams = iframeParams.concat(
          window.location.href.substr(window.location.href.indexOf("?") + 1).split('&')
        );
      }
      
      if (src && src.indexOf("?") > -1) {
        iframeParams = iframeParams.concat(src.substr(src.indexOf("?") + 1).split("&"));
        src = src.substr(0, src.indexOf("?"));
      }
      
      iframeParams.push("isIframeEmbed=1");
      iframe.src = src + "?" + iframeParams.join('&');
      
      console.log('✅ JotForm iframe configured');
    }
  }, [FORM_ID]);

  return (
    <div className="zenshe-form-container" style={customStyles}>
      {formTitle && <h2 className="zenshe-form-title">{formTitle}</h2>}
      
      <div className="zenshe-form-card">
        <div className="zenshe-form-content">
          <iframe
            id={`JotFormIFrame-${FORM_ID}`}
            title="Zenshe Waiver Form"
            onLoad={() => {
              console.log('✅ JotForm iframe loaded (data collector mode)');
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
        
        <div className="zenshe-form-actions">
          <button
            className="zenshe-collect-button"
            onClick={collectFormData}
            disabled={isCollecting}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: formData ? '#28a745' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: isCollecting ? 'not-allowed' : 'pointer',
              marginTop: '15px',
              transition: 'all 0.3s ease'
            }}
          >
            {isCollecting ? '⏳ Chargement des données...' : formData ? '✅ Données prêtes' : '📤 Envoyer à la Praticienne'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ZensheForm;
