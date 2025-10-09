import { useEffect } from 'react';
import './ZensheForm.css';

/**
 * ZensheForm - JotForm iframe embed component
 * 
 * Embeds JotForm using standard iframe method for full compatibility.
 * All navigation and functionality work natively.
 * 
 * @param {Object} props
 * @param {string} props.formTitle - Title displayed above form (optional)
 * @param {Function} props.onSuccess - Callback when form submits successfully
 * @param {Function} props.onError - Callback when form submission fails
 * @param {Object} props.customStyles - Custom CSS styles for the container
 */
function ZensheForm({ 
  formTitle = '🌿 Formulaire Zenshe',
  onSuccess,
  onError,
  customStyles = {}
}) {
  const FORM_ID = import.meta.env.VITE_JOTFORM_FORM_ID;
  
  if (!FORM_ID) {
    console.error('❌ VITE_JOTFORM_FORM_ID must be set in environment variables');
    throw new Error('Missing required JotForm Form ID configuration');
  }

  useEffect(() => {
    console.log('✅ ZensheForm initialized with form ID:', FORM_ID);
    
    // JotForm iframe communication handler
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
        case "submit":
          console.log('✅ Form submitted successfully!');
          if (onSuccess) onSuccess(args);
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

    // Cleanup
    return () => {
      if (window.removeEventListener) {
        window.removeEventListener("message", handleIFrameMessage, false);
      } else if (window.detachEvent) {
        window.detachEvent("onmessage", handleIFrameMessage);
      }
    };
  }, [FORM_ID, onSuccess, onError]);

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
              console.log('✅ JotForm iframe loaded');
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
              border: 'none',
              width: '1px'
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}

export default ZensheForm;
