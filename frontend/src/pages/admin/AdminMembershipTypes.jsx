import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCrown, FaGlobe, FaEye } from 'react-icons/fa';
import { publicAPI } from '../../services/api';
import MembershipTranslationsModal from '../../components/admin/MembershipTranslationsModal';

const AdminMembershipTypes = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showTranslationsModal, setShowTranslationsModal] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getMemberships();
      setMemberships(response.data.memberships || []);
    } catch (error) {
      console.error('Error loading memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageTranslations = (membership) => {
    setSelectedMembership(membership);
    setShowTranslationsModal(true);
  };

  const formatPrice = (prix, periodicite) => {
    const periodicityText = {
      'mensuel': '/mois',
      'trimestriel': '/3 mois',
      'semestriel': '/6 mois',
      'annuel': '/an'
    };
    return `${prix} DH ${periodicityText[periodicite] || ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaCrown className="text-primary" />
            Types d'abonnements & Traductions
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les traductions multilingues des types d'abonnements
          </p>
        </div>

        {/* Memberships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((membership) => (
            <motion.div
              key={membership.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              {/* Membership Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {membership.nom}
                  </h3>
                  <p className="text-primary font-semibold text-lg">
                    {formatPrice(membership.prix, membership.periodicite)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    membership.actif 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {membership.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {membership.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {membership.description}
                </p>
              )}

              {/* Membership Details */}
              <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durée engagement:</span>
                  <span className="font-medium">{membership.duree_engagement} mois</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Services inclus:</span>
                  <span className="font-medium">{membership.services_inclus || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Visites/mois:</span>
                  <span className="font-medium">{membership.visites_par_mois || 'Illimité'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleManageTranslations(membership)}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  <FaGlobe size={16} />
                  Traductions
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {memberships.length === 0 && (
          <div className="text-center py-12">
            <FaCrown className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun abonnement trouvé</p>
          </div>
        )}
      </div>

      {/* Translations Modal */}
      {showTranslationsModal && selectedMembership && (
        <MembershipTranslationsModal
          membership={selectedMembership}
          isOpen={showTranslationsModal}
          onClose={() => {
            setShowTranslationsModal(false);
            setSelectedMembership(null);
          }}
          onUpdate={fetchMemberships}
        />
      )}
    </div>
  );
};

export default AdminMembershipTypes;
