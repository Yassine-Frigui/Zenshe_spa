import React, { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const formContainerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [formHtml, setFormHtml] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Prevent double loading in React StrictMode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load the cleaned HTML source code (REAL source: jotform_zenshe_form.html)
    fetch('/jotform_zenshe_form.html')
      .then(response => response.text())
      .then(html => {
        console.log('✅ Loaded cleaned Zenshe form HTML (branding removed at source)');
        setFormHtml(html);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading form HTML:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Inject the HTML into the container
    if (formHtml && formContainerRef.current) {
      // Parse the HTML to separate external scripts, styles, and form content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formHtml;
      
      // 1. First, load all external scripts into document head
      const externalScripts = tempDiv.querySelectorAll('script[src]');
      const scriptsToLoad = [];
      
      externalScripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
          // Check if already loaded by comparing src attributes
          const existingScripts = Array.from(document.querySelectorAll('script[src]'));
          const alreadyLoaded = existingScripts.some(existing => existing.src === script.src);
          
          if (!alreadyLoaded) {
            scriptsToLoad.push(src);
          }
        }
        script.remove(); // Remove from temp div
      });
      
      // Load external scripts sequentially
      const loadScriptsSequentially = async () => {
        for (const src of scriptsToLoad) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.type = 'text/javascript';
            if (src.includes('defer')) {
              script.defer = true;
            }
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
      };
      
      // 2. Load all link stylesheets
      const links = tempDiv.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          // Check if already loaded by comparing hrefs (avoid querySelector with special chars)
          const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
          const alreadyLoaded = existingLinks.some(existing => existing.href === link.href);
          
          if (!alreadyLoaded) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = href;
            document.head.appendChild(newLink);
          }
        }
        link.remove();
      });
      
      // 3. Load all style tags
      const styles = tempDiv.querySelectorAll('style');
      styles.forEach(style => {
        const newStyle = document.createElement('style');
        newStyle.textContent = style.textContent;
        document.head.appendChild(newStyle);
        style.remove();
      });
      
      // 4. Now inject the form HTML
      formContainerRef.current.innerHTML = tempDiv.innerHTML;
      
      // 5. Execute inline scripts AFTER external scripts are loaded
      loadScriptsSequentially().then(() => {
        const inlineScripts = formContainerRef.current.querySelectorAll('script');
        inlineScripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          newScript.textContent = oldScript.textContent;
          
          // Copy attributes
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        console.log('✅ Form rendered with all scripts loaded and executed');
        
        // 6. Intercept form submission to send through our backend
        setTimeout(() => {
          const form = formContainerRef.current.querySelector('form');
          if (form) {
            console.log('📋 Form found, hiding native submit button');
            
            // Hide the native JotForm submit button and captcha
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
              submitButton.style.display = 'none';
            }
            
            // Also hide captcha if present
            const captchaElements = form.querySelectorAll('[class*="captcha"], [id*="captcha"], .g-recaptcha');
            captchaElements.forEach(el => {
              el.style.display = 'none';
            });
            
            // Prevent default form submission
            form.addEventListener('submit', (e) => {
              e.preventDefault();
              console.log('🚫 Native form submission blocked');
            });
            
            console.log('✅ Form setup complete - use custom submit button');
          } else {
            console.warn('⚠️ Form element not found');
          }
        }, 1000); // Wait 1 second for JotForm to fully initialize
      });
    }
  }, [formHtml]);

  // Custom submit handler (bypasses JotForm captcha)
  const handleCustomSubmit = async () => {
    console.log('📤 Custom submit button clicked');
    
    const form = formContainerRef.current?.querySelector('form');
    if (!form) {
      console.error('❌ Form element not found in DOM');
      alert('❌ Formulaire non trouvé. Veuillez actualiser la page.');
      return;
    }

    console.log('✅ Form element found:', form);
    setSubmitting(true);

    try {
      // Get form data
      const formData = new FormData(form);
      const data = {};
      
      // Convert FormData to object
      for (let [key, value] of formData.entries()) {
        // Handle multiple values for the same key (checkboxes, etc.)
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
      
      console.log('📊 Form data collected:', Object.keys(data).length, 'fields');
      console.log('📋 First few fields:', Object.keys(data).slice(0, 5));
      
      // Validate we have some data
      if (Object.keys(data).length === 0) {
        console.error('❌ No form data collected - form might not be properly loaded');
        alert('❌ Aucune donnée de formulaire détectée. Veuillez remplir au moins un champ.');
        setSubmitting(false);
        return;
      }
      
      console.log('📤 Sending to backend: http://localhost:3001/submit-form');
      
      // Send to our backend
      const response = await fetch('http://localhost:3001/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 Response from backend:', result);
      
      if (result.success) {
        console.log('✅ Form submitted successfully!');
        console.log('📋 Submission ID:', result.submissionId);
        
        // Show success message
        alert('✅ Formulaire soumis avec succès!\n\nMerci pour votre soumission.');
        
        // Reset form
        form.reset();
        
        // Optionally redirect or show thank you message
        // window.location.href = '/thank-you';
      } else {
        console.error('❌ Submission failed:', result);
        alert('❌ Erreur lors de la soumission du formulaire.\n\n' + (result.message || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      console.error('Error details:', error.message);
      
      // More helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('❌ Impossible de se connecter au serveur backend.\n\n' +
              '🔍 Vérifiez que:\n' +
              '1. Le backend est démarré (npm run server)\n' +
              '2. Le backend tourne sur le port 3001\n' +
              '3. Pas de bloqueur de publicités actif\n\n' +
              'Erreur: ' + error.message);
      } else if (error.message.includes('HTTP error')) {
        alert('❌ Erreur HTTP du serveur.\n\n' +
              'Le backend a répondu avec une erreur.\n' +
              'Vérifiez les logs du backend.\n\n' +
              'Erreur: ' + error.message);
      } else {
        alert('❌ Erreur de connexion.\n\n' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <div className="card-container">
        <div className="card">
          <div className="card-header">
            <h1>🌿 Formulaire d'Admission Zenshe</h1>
            <p>Facilitatrice de Vapeur Périnéal</p>
          </div>
          <div className="card-body">
            {loading && (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Chargement du formulaire...</p>
              </div>
            )}
            <div ref={formContainerRef} id="jotform-container"></div>
          </div>
          
          {/* Custom Submit Button (outside native form, bypasses captcha) */}
          {!loading && (
            <div className="custom-submit-container">
              <button 
                className="custom-submit-button"
                onClick={handleCustomSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <span className="submit-icon">📤</span>
                    Soumettre le Formulaire
                  </>
                )}
              </button>
              <p className="submit-hint">
                ℹ️ Cliquez ici pour soumettre le formulaire (pas de captcha requis)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
