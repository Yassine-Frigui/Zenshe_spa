import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileSignature, FaTimes, FaSpinner } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

const WaiverModal = ({ submissionId, onClose }) => {
  const { t } = useTranslation();
  const [waiver, setWaiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (submissionId) {
      fetchWaiver();
    }
  }, [submissionId]);

  const fetchWaiver = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getJotFormSubmission(submissionId);
      console.log('📥 Waiver data received:', response.data);
      
      // Debug: Check additional fields
      if (response.data.additional) {
        console.log('🔍 Additional fields debug:');
        Object.entries(response.data.additional).slice(0, 5).forEach(([key, value]) => {
          console.log(`  ${key}: ${typeof value} - ${value}`);
        });
      }
      
      setWaiver(response.data);
    } catch (err) {
      console.error('Error fetching waiver:', err);
      setError(t('waiver.error'));
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (value) => {
    // Debug logging for problematic values
    if (typeof value === 'object' && value !== null) {
      console.log('🔍 renderFieldValue received object:', value);
    }
    
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return <span className="text-muted">Aucune donnée</span>;
    }
    
    // Handle objects (like date objects {month, day, year})
    if (typeof value === 'object' && value !== null) {
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-muted">{t('waiver.noData')}</span>;
        return value.join(', ');
      }
      
      // Handle date objects
      if (value.month !== undefined || value.day !== undefined || value.year !== undefined) {
        const month = value.month || '';
        const day = value.day || '';
        const year = value.year || '';
        if (month && day && year) {
          return `${day}/${month}/${year}`;
        } else {
          return `${month}/${day}/${year}`.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
        }
      }
      
      // Handle name objects
      if (value.first !== undefined || value.last !== undefined) {
        return `${value.first || ''} ${value.last || ''}`.trim();
      }
      
      // Handle address objects
      if (value.addr_line1 !== undefined || value.city !== undefined) {
        const parts = [];
        if (value.addr_line1) parts.push(value.addr_line1);
        if (value.addr_line2) parts.push(value.addr_line2);
        if (value.city) parts.push(value.city);
        if (value.state) parts.push(value.state);
        if (value.postal) parts.push(value.postal);
        return parts.join(', ');
      }
      
      // Handle phone objects
      if (value.full !== undefined) {
        return value.full;
      }
      
      // For other objects, try to extract meaningful values
      const keys = Object.keys(value);
      if (keys.length === 1 && typeof value[keys[0]] === 'string') {
        return value[keys[0]];
      }
      
      // If it's a simple object with few properties, show them
      if (keys.length <= 3) {
        return keys.map(key => `${key}: ${value[key]}`).join(', ');
      }
      
      // For complex objects, stringify them
      return JSON.stringify(value);
    }
    
    // Handle strings
    if (typeof value === 'string') {
      // Check if value contains HTML tags or is HTML content
      if (value.includes('<') || value.includes('<br>') || value.includes('span') || value.includes('class=')) {
        return <div dangerouslySetInnerHTML={{ __html: value }} />;
      }
      
      // Handle empty or whitespace-only strings
      if (value.trim() === '') {
        return <span className="text-muted">Aucune donnée</span>;
      }
      
      return value;
    }
    
    // Handle other primitive types
    return String(value);
  };

  return (
    <AnimatePresence>
      <div 
        className="modal fade show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}
        onClick={onClose}
      >
        <div 
          className="modal-dialog modal-dialog-scrollable"
          style={{ 
            maxWidth: '95vw', 
            width: '95vw',
            height: '95vh',
            margin: '2.5vh auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="modal-content"
            style={{ height: '100%' }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="modal-header bg-primary text-white border-0">
              <h5 className="modal-title fw-bold">
                <FaFileSignature className="me-2" />
                {t('waiver.title')}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              />
            </div>

            {/* Body */}
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {loading && (
                <div className="text-center py-5">
                  <FaSpinner className="fa-spin text-primary" style={{ fontSize: '3rem' }} />
                  <p className="mt-3 text-muted">{t('waiver.loading')}</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  <strong>Erreur:</strong> {error}
                </div>
              )}

              {!loading && !error && waiver && (
                <div className="waiver-content">
                  {/* Submission Info */}
                  <div className="alert alert-info mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>ID Soumission:</strong> {waiver.submissionId}
                      </div>
                      <div className="col-md-6">
                        <strong>Date:</strong> {new Date(waiver.submissionDate).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  {waiver.client && (
                    <>
                      <div className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 fw-bold text-primary">📋 Informations Client</h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6 mb-2">
                              <strong>Nom:</strong> {waiver.client.firstName} {waiver.client.lastName}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Email:</strong> {renderFieldValue(waiver.client.email)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Téléphone:</strong> {renderFieldValue(waiver.client.phone)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Date de naissance:</strong> {renderFieldValue(waiver.client.birthDate)}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>Adresse:</strong> {renderFieldValue(waiver.client.address)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Anatomie:</strong> {renderFieldValue(waiver.client.anatomy)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Pronoms:</strong> {renderFieldValue(waiver.client.pronouns)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Practitioner Information */}
                      <div className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 fw-bold text-primary">👩‍⚕️ Informations Praticien</h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6 mb-2">
                              <strong>Nom:</strong> {renderFieldValue(waiver.practitioner.name)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Compagnie:</strong> {renderFieldValue(waiver.practitioner.company)}
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Email:</strong> {renderFieldValue(waiver.practitioner.email)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Client Responses */}
                      {waiver.responses && (
                        <div className="card mb-3">
                          <div className="card-header bg-light">
                            <h6 className="mb-0 fw-bold text-primary">💭 Réponses Client</h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>Expérience vapeur:</strong> {renderFieldValue(waiver.responses.steamExperience)}
                            </div>
                            <div className="mb-2">
                              <strong>Préoccupation principale:</strong> {renderFieldValue(waiver.responses.mainConcern)}
                            </div>
                            <div className="mb-2">
                              <strong>Autres informations:</strong> {renderFieldValue(waiver.responses.otherInfo)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Practitioner Notes */}
                      {waiver.notes && (
                        <div className="card mb-3">
                          <div className="card-header bg-light">
                            <h6 className="mb-0 fw-bold text-success">📝 Notes Praticien</h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>Notes principales:</strong> {renderFieldValue(waiver.notes.main)}
                            </div>
                            <div className="mb-2">
                              <strong>Notes finales:</strong> {renderFieldValue(waiver.notes.final)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Information */}
                      {waiver.additional && Object.keys(waiver.additional).length > 0 && (
                        <div className="card mb-3">
                          <div className="card-header bg-light">
                            <h6 className="mb-0 fw-bold text-secondary">📋 Informations Additionnelles</h6>
                          </div>
                          <div className="card-body">
                            {Object.entries(waiver.additional).map(([label, value]) => (
                              <div key={label} className="mb-2">
                                <strong>{label}:</strong> {renderFieldValue(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Raw Data Section - Collapsible for debugging */}
                  {waiver.raw && Object.keys(waiver.raw).length > 0 && (
                    <div className="card mb-3 border-secondary">
                      <div 
                        className="card-header bg-secondary text-white" 
                        style={{ cursor: 'pointer' }}
                        data-bs-toggle="collapse"
                        data-bs-target="#rawAnswers"
                      >
                        <h6 className="mb-0 fw-bold">
                          🔍 Données brutes (Debug) - Cliquer pour voir
                        </h6>
                      </div>
                      <div id="rawAnswers" className="collapse">
                        <div className="card-body bg-light">
                          <small className="text-muted d-block mb-2">
                            Section technique pour développeurs - Contient toutes les réponses brutes du formulaire JotForm
                          </small>
                          <pre className="bg-dark text-light p-3 rounded" style={{ fontSize: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                            {JSON.stringify(waiver.raw, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-0">
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                <FaTimes className="me-2" />
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default WaiverModal;
