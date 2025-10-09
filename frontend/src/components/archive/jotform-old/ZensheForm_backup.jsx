import { useState, useEffect } from 'react';
import './ZensheForm.css';

/**
 * ZensheForm - Standalone JotForm Component
 * 
 * A self-contained form component that can be imported into any React app.
 * Includes custom submit button that bypasses JotForm captcha.
 * 
 * @param {Object} props
 * @param {string} props.backendUrl - Backend API URL (default: http://localhost:3001)
 * @param {string} props.formTitle - Title displayed above form (optional)
 * @param {Function} props.onSuccess - Callback when form submits successfully
 * @param {Function} props.onError - Callback when form submission fails
 * @param {string} props.submitButtonText - Custom submit button text (default: "SOUMETTRE LE FORMULAIRE")
 * @param {Object} props.customStyles - Custom CSS styles for the container
 * 
 * @example
 * import ZensheForm from './ZensheForm';
 * 
 * function MyApp() {
 *   return (
 *     <div>
 *       <h1>My App</h1>
 *       <ZensheForm 
 *         backendUrl="https://api.myapp.com"
 *         onSuccess={(data) => console.log('Success!', data)}
 *         onError={(error) => console.error('Error!', error)}
 *       />
 *     </div>
 *   );
 * }
 */
function ZensheForm({ 
  backendUrl = import.meta.env.VITE_API_URL,
  formTitle = '🌿 Formulaire Zenshe',
  onSuccess,
  onError,
  submitButtonText = 'SOUMETTRE LE FORMULAIRE',
  customStyles = {},
  useIframe = false // New prop to choose between iframe and embedded HTML
}) {
  // Validate required environment variable
  if (!backendUrl) {
    console.error('❌ VITE_API_URL must be set in environment variables');
    throw new Error('Missing required API URL configuration');
  }
  
  const FORM_ID = import.meta.env.VITE_JOTFORM_FORM_ID;
  if (!FORM_ID) {
    console.error('❌ VITE_JOTFORM_FORM_ID must be set in environment variables');
    throw new Error('Missing required JotForm Form ID configuration');
  }
  
  const [loading, setLoading] = useState(true);
  
  // If using iframe method, render simple iframe
  if (useIframe) {
    useEffect(() => {
      setLoading(false);
    }, []);
    
    if (loading) {
      return (
        <div className="zenshe-form-container" style={customStyles}>
          <div className="zenshe-form-loading">
            <p>Chargement du formulaire...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="zenshe-form-container" style={customStyles}>
        {formTitle && <h2 className="zenshe-form-title">{formTitle}</h2>}
        
        <div className="zenshe-form-card">
          <iframe
            id={`JotFormIFrame-${FORM_ID}`}
            title="Zenshe Form"
            onLoad={() => {
              window.parent.scrollTo(0, 0);
            }}
            allowTransparency="true"
            allow="geolocation; microphone; camera; fullscreen"
            src={`https://form.jotform.com/${FORM_ID}`}
            frameBorder="0"
            style={{
              minWidth: '100%',
              maxWidth: '100%',
              height: '539px',
              border: 'none'
            }}
            scrolling="no"
          />
          <script type="text/javascript" dangerouslySetInnerHTML={{
            __html: `
              var ifr = document.getElementById("JotFormIFrame-${FORM_ID}");
              if (ifr) {
                var src = ifr.src;
                var iframeParams = [];
                if (window.location.href && window.location.href.indexOf("?") > -1) {
                  iframeParams = iframeParams.concat(window.location.href.substr(window.location.href.indexOf("?") + 1).split('&'));
                }
                if (src && src.indexOf("?") > -1) {
                  iframeParams = iframeParams.concat(src.substr(src.indexOf("?") + 1).split("&"));
                  src = src.substr(0, src.indexOf("?"))
                }
                iframeParams.push("isIframeEmbed=1");
                ifr.src = src + "?" + iframeParams.join('&');
              }
              window.handleIFrameMessage = function(e) {
                if (typeof e.data === 'object') { return; }
                var args = e.data.split(":");
                if (args.length > 2) { iframe = document.getElementById("JotFormIFrame-" + args[(args.length - 1)]); } else { iframe = document.getElementById("JotFormIFrame"); }
                if (!iframe) { return; }
                switch (args[0]) {
                  case "scrollIntoView":
                    iframe.scrollIntoView();
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
                    window.location.reload();
                    break;
                  case "loadScript":
                    if( !window.isPermitted(e.origin, ['jotform.com', 'jotform.pro']) ) { break; }
                    var src = args[1];
                    if (args.length > 3) {
                        src = args[1] + ':' + args[2];
                    }
                    var script = document.createElement('script');
                    script.src = src;
                    script.type = 'text/javascript';
                    document.body.appendChild(script);
                    break;
                  case "exitFullscreen":
                    if      (window.document.exitFullscreen)        window.document.exitFullscreen();
                    else if (window.document.mozCancelFullScreen)   window.document.mozCancelFullScreen();
                    else if (window.document.mozCancelFullscreen)   window.document.mozCancelFullScreen();
                    else if (window.document.webkitExitFullscreen)  window.document.webkitExitFullscreen();
                    else if (window.document.msExitFullscreen)      window.document.msExitFullscreen();
                    break;
                }
                var isJotForm = (e.origin.indexOf("jotform") > -1) ? true : false;
                if(isJotForm && "contentWindow" in iframe && "postMessage" in iframe.contentWindow) {
                  var urls = {"docurl":encodeURIComponent(document.URL),"referrer":encodeURIComponent(document.referrer)};
                  iframe.contentWindow.postMessage(JSON.stringify({"type":"urls","value":urls}), "*");
                }
              };
              window.isPermitted = function(originUrl, whitelisted_domains) {
                var url = document.createElement('a');
                url.href = originUrl;
                var hostname = url.hostname;
                var result = false;
                if( typeof hostname !== 'undefined' ) {
                  whitelisted_domains.forEach(function(element) {
                      if( hostname.slice((-1 * element.length - 1)) === '.'.concat(element) ||  hostname === element ) {
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
            `
          }} />
        </div>
      </div>
    );
  }
  
  // Original embedded HTML method
  const [formHtml, setFormHtml] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch the JotForm HTML
    fetch('/jotform_zenshe_form.html')
      .then(response => response.text())
      .then(html => {
        console.log('📥 JotForm HTML loaded');
        
        // Extract and separate scripts from HTML
        const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        const scripts = [];
        let match;
        
        while ((match = scriptRegex.exec(html)) !== null) {
          const scriptContent = match[1];
          const scriptTag = match[0];
          
          // Check if it's an external script (has src attribute)
          const srcMatch = scriptTag.match(/src=["']([^"']+)["']/);
          if (srcMatch) {
            scripts.push({ type: 'external', src: srcMatch[1] });
          } else if (scriptContent.trim()) {
            scripts.push({ type: 'inline', content: scriptContent });
          }
        }
        
        console.log('📜 Found scripts:', scripts.length);
        
        // Remove ALL scripts from HTML for dangerouslySetInnerHTML
        let cleanHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        
        setFormHtml(cleanHtml);
        setLoading(false);
        
        // Execute scripts after HTML is loaded
        setTimeout(() => {
          console.log('🚀 Executing JotForm scripts...');
          
          // Load external scripts first
          const externalScripts = scripts.filter(s => s.type === 'external');
          const inlineScripts = scripts.filter(s => s.type === 'inline');
          
          let loadedCount = 0;
          
          // Load external scripts sequentially
          externalScripts.forEach((script, index) => {
            // Check if script is already loaded
            const existingScript = document.querySelector(`script[src="${script.src}"]`);
            if (existingScript) {
              console.log(`⏭️ Script already loaded: ${script.src}`);
              loadedCount++;
              return;
            }
            
            const scriptElement = document.createElement('script');
            scriptElement.src = script.src;
            scriptElement.async = false;
            scriptElement.onload = () => {
              console.log(`✅ Loaded external script ${index + 1}/${externalScripts.length}`);
              loadedCount++;
              
              // When all external scripts loaded, execute inline scripts
              if (loadedCount === externalScripts.length) {
                console.log('📜 Executing inline scripts...');
                inlineScripts.forEach((script, idx) => {
                  try {
                    new Function(script.content)();
                    console.log(`✅ Executed inline script ${idx + 1}/${inlineScripts.length}`);
                  } catch (e) {
                    console.warn(`⚠️ Inline script ${idx + 1} warning:`, e.message);
                  }
                });
                console.log('✅ JotForm initialization complete!');
              }
            };
            scriptElement.onerror = () => {
              console.error(`❌ Failed to load: ${script.src}`);
              loadedCount++;
            };
            document.body.appendChild(scriptElement);
          });
          
          // If no external scripts, just execute inline scripts
          if (externalScripts.length === 0) {
            console.log('📜 No external scripts, executing inline scripts...');
            inlineScripts.forEach((script, idx) => {
              try {
                new Function(script.content)();
                console.log(`✅ Executed inline script ${idx + 1}/${inlineScripts.length}`);
              } catch (e) {
                console.warn(`⚠️ Inline script ${idx + 1} warning:`, e.message);
              }
            });
            console.log('✅ JotForm initialization complete!');
          }
        }, 100);
      })
      .catch(error => {
        console.error('❌ Error loading form:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!formHtml) return;

    // Wait for form to load and check elements
    const checkAndHideElements = () => {
      // Try to find the form element directly (not in iframe since this is embedded HTML)
      const form = document.querySelector('form[id="251824851270052"]') || 
                   document.querySelector('.jotform-form');
      
      if (!form) {
        console.log('⏳ Form not found yet, retrying...');
        setTimeout(checkAndHideElements, 100);
        return;
      }

      console.log('✅ Form found:', form.id);

      try {
        // Log all buttons to see what we have
        const allButtons = form.querySelectorAll('button');
        console.log('🔍 Found buttons:', allButtons.length);
        allButtons.forEach((btn, idx) => {
          console.log(`Button ${idx}:`, {
            type: btn.type,
            id: btn.id,
            class: btn.className,
            text: btn.textContent.substring(0, 50)
          });
        });

        // Hide captcha if present
        const captchaDiv = form.querySelector('.g-recaptcha') || 
                          form.querySelector('[class*="captcha"]') ||
                          form.querySelector('#recaptcha');
        if (captchaDiv) {
          captchaDiv.style.display = 'none';
          console.log('✅ Captcha hidden');
        }

        // Don't hide any buttons - let JotForm handle navigation naturally
        console.log('✅ All form buttons preserved for navigation');
      } catch (e) {
        console.error('❌ Error accessing form elements:', e);
      }
    };

    setTimeout(checkAndHideElements, 1000);
  }, [formHtml]);

  const handleCustomSubmit = async () => {
    setSubmitting(true);
    
    try {
      console.log('🚀 Starting custom form submission...');
      
      // Get the form directly (not from iframe, since we're using embedded HTML)
      const form = document.querySelector('form[id^="251824851270052"]') || 
                   document.querySelector('.jotform-form');
      
      if (!form) {
        throw new Error('Form element not found');
      }

      console.log('📝 Form found, collecting data...');

      // Collect form data
      const formData = new FormData(form);
      const data = {};
      
      for (let [key, value] of formData.entries()) {
        // Handle multiple values (checkboxes, etc.)
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

      console.log('📤 Collected form data:', data);

      // Create submission object
      const submission = {
        id: 'local_' + Date.now(), // Generate local ID
        submissionID: 'local_' + Date.now(),
        form_id: FORM_ID,
        created_at: new Date().toISOString(),
        answers: Object.keys(data).reduce((acc, key) => {
          // Convert form data to JotForm answer format
          const fieldId = key.replace('q', '').replace('_', '');
          acc[fieldId] = {
            answer: data[key],
            type: 'control_textbox',
            text: data[key]
          };
          return acc;
        }, {})
      };

      console.log(`📡 Submitting to backend: ${backendUrl}/api/jotform/submit-local`);

      // Submit to backend (use our integrated endpoint)
      const response = await fetch(`${backendUrl}/api/jotform/submit-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionStorage.getItem('zenshe_booking_session') || null,
          formId: FORM_ID,
          submission
        })
      });

      console.log('📥 Backend response status:', response.status);

      const result = await response.json();
      console.log('📋 Backend response data:', result);

      if (response.ok && result.success) {
        console.log('✅ Form submitted successfully!');
        console.log('🆔 Submission ID:', result.submissionId);
        
        alert('✅ Formulaire soumis avec succès!\n\n' + 
              `ID de soumission: ${result.submissionId}\n\n` +
              'Merci pour votre soumission!');
        
        // Reset form
        form.reset();
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert('❌ Erreur lors de la soumission du formulaire.\n\n' +
            'Détails: ' + error.message + '\n\n' +
            'Veuillez vérifier la console pour plus d\'informations.');
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="zenshe-form-container" style={customStyles}>
        <div className="zenshe-form-loading">
          <p>Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zenshe-form-container" style={customStyles}>
      {formTitle && <h2 className="zenshe-form-title">{formTitle}</h2>}
      
      <div className="zenshe-form-card">
        <div 
          className="zenshe-form-content"
          dangerouslySetInnerHTML={{ __html: formHtml }}
        />
        
        <button
          className="zenshe-submit-button"
          onClick={handleCustomSubmit}
          disabled={submitting}
        >
          {submitting ? 'ENVOI EN COURS...' : submitButtonText}
        </button>
      </div>
    </div>
  );
}

export default ZensheForm;
