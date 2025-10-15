import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaGlobe, FaSave } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

const MembershipTranslationsModal = ({ membership, isOpen, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(null); // language_code being edited, or 'new'
  const [formData, setFormData] = useState({
    language_code: '',
    nom: '',
    description: '',
    avantages: ''
  });
  const [error, setError] = useState('');

  const availableLanguages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' }
  ];

  useEffect(() => {
    if (isOpen && membership) {
      fetchTranslations();
    }
  }, [isOpen, membership]);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getMembershipTranslations(membership.id);
      setTranslations(response.data.data.translations || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      setError('Erreur lors du chargement des traductions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (translation) => {
    setEditMode(translation.language_code);
    setFormData({
      language_code: translation.language_code,
      nom: translation.nom || '',
      description: translation.description || '',
      avantages: translation.avantages || ''
    });
  };

  const handleAddNew = () => {
    // Find first language that doesn't have a translation
    const existingCodes = translations.map(t => t.language_code);
    const availableCode = availableLanguages.find(l => !existingCodes.includes(l.code))?.code;
    
    setEditMode('new');
    setFormData({
      language_code: availableCode || '',
      nom: '',
      description: '',
      avantages: ''
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      
      if (!formData.language_code || !formData.nom) {
        setError('Le code de langue et le nom sont requis');
        return;
      }

      if (editMode === 'new') {
        await adminAPI.createMembershipTranslation(membership.id, formData);
      } else {
        await adminAPI.updateMembershipTranslation(membership.id, formData.language_code, {
          nom: formData.nom,
          description: formData.description,
          avantages: formData.avantages
        });
      }

      await fetchTranslations();
      setEditMode(null);
      setFormData({ language_code: '', nom: '', description: '', avantages: '' });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving translation:', error);
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (languageCode) => {
    if (!confirm(`Supprimer la traduction ${languageCode} ?`)) return;

    try {
      setError('');
      await adminAPI.deleteMembershipTranslation(membership.id, languageCode);
      await fetchTranslations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting translation:', error);
      setError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setEditMode(null);
    setFormData({ language_code: '', nom: '', description: '', avantages: '' });
    setError('');
  };

  const getLanguageName = (code) => {
    return availableLanguages.find(l => l.code === code)?.name || code;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaGlobe className="text-primary" />
                Traductions de l'abonnement
              </h2>
              <p className="text-gray-600 mt-1">{membership?.nom}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Existing Translations */}
                <div className="space-y-4 mb-6">
                  {translations.map((translation) => (
                    <div key={translation.language_code} className="border border-gray-200 rounded-lg p-4">
                      {editMode === translation.language_code ? (
                        // Edit form
                        <div className="space-y-3">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-lg">
                              {getLanguageName(translation.language_code)}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                              >
                                <FaSave size={14} />
                                Sauvegarder
                              </button>
                              <button
                                onClick={handleCancel}
                                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                          
                          <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Nom de l'abonnement *"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description"
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          
                          <textarea
                            value={formData.avantages}
                            onChange={(e) => setFormData({ ...formData, avantages: e.target.value })}
                            placeholder="Avantages"
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      ) : (
                        // Display mode
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-primary bg-opacity-10 text-primary rounded font-medium">
                                {translation.language_code.toUpperCase()}
                              </span>
                              <span className="font-semibold text-gray-700">
                                {getLanguageName(translation.language_code)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(translation)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Modifier"
                              >
                                <FaEdit size={18} />
                              </button>
                              {translation.language_code !== 'fr' && (
                                <button
                                  onClick={() => handleDelete(translation.language_code)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Supprimer"
                                >
                                  <FaTrash size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Nom:</span>
                              <p className="text-gray-800">{translation.nom}</p>
                            </div>
                            {translation.description && (
                              <div>
                                <span className="font-medium text-gray-600">Description:</span>
                                <p className="text-gray-800">{translation.description}</p>
                              </div>
                            )}
                            {translation.avantages && (
                              <div>
                                <span className="font-medium text-gray-600">Avantages:</span>
                                <p className="text-gray-800 whitespace-pre-line">{translation.avantages}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Translation Form */}
                {editMode === 'new' ? (
                  <div className="border-2 border-dashed border-primary rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-700">Nouvelle traduction</h3>
                    <div className="space-y-3">
                      <select
                        value={formData.language_code}
                        onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">-- Sélectionner une langue --</option>
                        {availableLanguages
                          .filter(lang => !translations.find(t => t.language_code === lang.code))
                          .map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name} ({lang.code})
                            </option>
                          ))
                        }
                      </select>
                      
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        placeholder="Nom de l'abonnement *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description"
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      
                      <textarea
                        value={formData.avantages}
                        onChange={(e) => setFormData({ ...formData, avantages: e.target.value })}
                        placeholder="Avantages"
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <FaSave />
                          Créer la traduction
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAddNew}
                    disabled={translations.length >= availableLanguages.length}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaPlus />
                    Ajouter une traduction
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MembershipTranslationsModal;
