import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './JotformCard.css';

/**
 * JotformCard Component
 * 
 * This component embeds a Jotform inside a card that appears in the booking flow.
 * It must be completed before the reservation can be submitted.
 * 
 * Props:
 * - formId: The Jotform form ID
 * - onSubmit: Callback function when form is submitted
 * - onValidation: Callback function for validation status
 */
const JotformCard = ({ formId, onSubmit, onValidation }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Jotform embed script
    const script = document.createElement('script');
    script.src = 'https://js.jotform.com/JotForm.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Jotform script loaded');
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Jotform script');
      setError('Failed to load form. Please refresh the page.');
    };

    document.body.appendChild(script);

    // Listen for form submission messages from iframe
    const handleMessage = (event) => {
      // Check if message is from Jotform
      if (event.origin.includes('jotform')) {
        console.log('Received message from Jotform:', event.data);
        
        // Handle form submission
        if (event.data && typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            
            if (data.action === 'submission-completed' || data.event === 'submit') {
              console.log('Form submitted:', data);
              setIsComplete(true);
              setSubmissionData(data);
              
              // Notify parent component
              if (onSubmit) {
                onSubmit(data);
              }
              if (onValidation) {
                onValidation(true);
              }
            }
          } catch (e) {
            console.log('Non-JSON message:', event.data);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onSubmit, onValidation]);

  // Auto-resize iframe
  useEffect(() => {
    const handleResize = (event) => {
      if (event.origin.includes('jotform') && event.data && event.data.action === 'resize') {
        if (iframeRef.current && event.data.height) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleResize);
    return () => window.removeEventListener('message', handleResize);
  }, []);

  const formUrl = `https://form.jotform.com/${formId}`;

  return (
    <Card className="jotform-card shadow-sm mb-4" ref={containerRef}>
      <Card.Header className="bg-green text-white">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            📋 Additional Information Required
          </h5>
          {isComplete && (
            <span className="badge bg-success d-flex align-items-center">
              <FaCheckCircle className="me-1" />
              Completed
            </span>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            <FaExclamationCircle className="me-2" />
            {error}
          </div>
        )}

        {!error && (
          <div className="jotform-container">
            <iframe
              ref={iframeRef}
              id={`jotform-${formId}`}
              title="Additional Information Form"
              src={formUrl}
              frameBorder="0"
              style={{
                width: '100%',
                minHeight: '500px',
                border: 'none',
              }}
              scrolling="yes"
              allow="geolocation; microphone; camera"
            />
          </div>
        )}

        {!isComplete && !error && (
          <div className="alert alert-info m-3" role="alert">
            <FaExclamationCircle className="me-2" />
            Please complete this form before proceeding with your booking.
          </div>
        )}
      </Card.Body>

      {isComplete && (
        <Card.Footer className="bg-light">
          <div className="text-success d-flex align-items-center">
            <FaCheckCircle className="me-2" />
            <small>Form completed successfully! You can now proceed with your booking.</small>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

export default JotformCard;
