import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaSave,
  FaTimes,
  FaCrown
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const MembershipForm = ({
  membership = null,
  isOpen,
  onClose,
  onSave,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    duree: '',
    visites_max: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (membership && mode === 'edit') {
        populateForm();
      } else {
        resetForm();
      }
    }
  }, [isOpen, membership, mode]);

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      duree: '',
      visites_max: ''
    });
  };

  const populateForm = () => {
    if (!membership) return;

    setFormData({
      nom: membership.nom || '',
      description: membership.description || '',
      prix: membership.prix || '',
      duree: membership.duree || '',
      visites_max: membership.visites_max || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.nom || !formData.prix || !formData.duree || !formData.visites_max) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const dataToSend = {
        ...formData,
        prix: parseFloat(formData.prix),
        duree: parseInt(formData.duree),
        visites_max: parseInt(formData.visites_max)
      };

      if (mode === 'edit' && membership) {
        await adminAPI.updateMembershipType(membership.id, dataToSend);
        alert('Type d\'abonnement mis à jour avec succès!');
      } else {
        await adminAPI.createMembershipType(dataToSend);
        alert('Type d\'abonnement créé avec succès!');
      }

      onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Error saving membership:', error);
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              <FaCrown className="text-warning me-2" />
              {mode === 'edit' ? 'Modifier le type d\'abonnement' : 'Nouveau type d\'abonnement'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="Ex: Abonnement Premium"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Prix (DT) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="prix"
                    value={formData.prix}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Durée (jours) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="duree"
                    value={formData.duree}
                    onChange={handleInputChange}
                    placeholder="30"
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Visites maximum <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="visites_max"
                    value={formData.visites_max}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Description du type d'abonnement..."
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <div className="d-flex gap-2">
                <motion.button
                  type="submit"
                  className="btn btn-pink"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      {mode === 'edit' ? 'Modifier' : 'Créer'}
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  className="btn btn-outline-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  disabled={loading}
                >
                  <FaTimes className="me-2" />
                  Annuler
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default MembershipForm;