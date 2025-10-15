import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCut,
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaClock,
  FaMoneyBill,
  FaStar,
  FaImage,
  FaCrown,
  FaCalendar,
  FaUsers
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import ServiceForm from '../../components/forms/ServiceForm';
import MembershipForm from '../../components/forms/MembershipForm';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';

const AdminServices = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  // New state for forms and modals
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showMembershipForm, setShowMembershipForm] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState('create');
  const [membershipFormMode, setMembershipFormMode] = useState('create');
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);
  const [selectedMembershipForEdit, setSelectedMembershipForEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [membershipToDelete, setMembershipToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Membership modal states
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showMembershipDeleteModal, setShowMembershipDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm]);

  useEffect(() => {
    filterMemberships();
  }, [memberships, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, membershipsRes] = await Promise.all([
        adminAPI.getServicesAdmin(),
        adminAPI.getMembershipTypes()
      ]);
      setServices(servicesRes.data);
      setMemberships(membershipsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setServices([]);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const filterMemberships = () => {
    let filtered = [...memberships];

    if (searchTerm) {
      filtered = filtered.filter(membership => 
        membership.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        membership.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMemberships(filtered);
  };

  const openModal = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const openCreateForm = () => {
    setServiceFormMode('create');
    setSelectedServiceForEdit(null);
    setShowServiceForm(true);
  };

  const openEditForm = (service) => {
    setServiceFormMode('edit');
    setSelectedServiceForEdit(service);
    setShowServiceForm(true);
  };

  const closeServiceForm = () => {
    setShowServiceForm(false);
    setSelectedServiceForEdit(null);
  };

  const handleServiceSave = (savedService) => {
    if (serviceFormMode === 'create') {
      setServices(prev => [...prev, savedService]);
    } else {
      setServices(prev => prev.map(service => 
        service.id === savedService.id ? savedService : service
      ));
    }
    fetchServices(); // Refresh the list to get updated data
  };

  const openDeleteModal = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    
    setDeleteLoading(true);
    try {
      await adminAPI.deleteService(serviceToDelete.id);
      setServices(prev => prev.filter(service => service.id !== serviceToDelete.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Membership CRUD functions
  const handleMembershipCreate = () => {
    setMembershipFormMode('create');
    setSelectedMembershipForEdit(null);
    setShowMembershipForm(true);
  };

  const handleMembershipEdit = (membership) => {
    setMembershipFormMode('edit');
    setSelectedMembershipForEdit(membership);
    setShowMembershipForm(true);
  };

  const handleMembershipSave = async (membershipData) => {
    try {
      if (membershipFormMode === 'create') {
        await adminAPI.createMembershipType(membershipData);
        alert('Type d\'abonnement créé avec succès!');
      } else {
        await adminAPI.updateMembershipType(selectedMembershipForEdit.id, membershipData);
        alert('Type d\'abonnement mis à jour avec succès!');
      }
      fetchData(); // Refresh both services and memberships
      setShowMembershipForm(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMembershipDelete = async (membership) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le type d'abonnement "${membership.nom}" ?`)) return;
    
    try {
      await adminAPI.deleteMembershipType(membership.id);
      alert('Type d\'abonnement supprimé avec succès!');
      fetchData(); // Refresh both services and memberships
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
    }
  };

  // Membership modal functions
  const openMembershipModal = (membership) => {
    setSelectedMembership(membership);
    setShowMembershipModal(true);
  };

  const openMembershipEditForm = (membership) => {
    setMembershipFormMode('edit');
    setSelectedMembershipForEdit(membership);
    setShowMembershipForm(true);
  };

  const openMembershipDeleteModal = (membership) => {
    setMembershipToDelete(membership);
    setShowMembershipDeleteModal(true);
  };

  const closeMembershipModal = () => {
    setShowMembershipModal(false);
    setSelectedMembership(null);
  };

  const closeMembershipForm = () => {
    setShowMembershipForm(false);
    setSelectedMembershipForEdit(null);
  };

  const closeMembershipDeleteModal = () => {
    setShowMembershipDeleteModal(false);
    setMembershipToDelete(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-pink-500 mb-3" style={{ width: '3rem', height: '3rem' }} />
          <p className="text-muted">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-services">
      {/* Header */}
      <motion.div
        className="page-header mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-dark mb-1">
              {activeTab === 'services' ? (
                <>
                  <FaCut className="text-primary me-2" />
                  Gestion des Services
                </>
              ) : (
                <>
                  <FaCrown className="text-warning me-2" />
                  Gestion des Abonnements
                </>
              )}
            </h1>
            <p className="text-muted mb-0">
              {activeTab === 'services' 
                ? `${services.length} services disponibles`
                : `${memberships.length} types d'abonnements disponibles`
              }
            </p>
          </div>
          <div className="col-auto">
            <motion.button
              className="btn btn-pink"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={activeTab === 'services' ? openCreateForm : handleMembershipCreate}
            >
              <FaPlus className="me-2" />
              {activeTab === 'services' ? 'Nouveau service' : 'Nouveau type d\'abonnement'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="tabs-section mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <nav className="nav nav-pills nav-fill">
              <button
                className={`nav-link border-0 px-4 py-3 ${activeTab === 'services' ? 'active bg-pink text-white' : 'text-dark'}`}
                onClick={() => setActiveTab('services')}
              >
                <FaCut className="me-2" />
                Services
              </button>
              <button
                className={`nav-link border-0 px-4 py-3 ${activeTab === 'memberships' ? 'active bg-pink text-white' : 'text-dark'}`}
                onClick={() => setActiveTab('memberships')}
              >
                <FaCrown className="me-2" />
                Abonnements
              </button>
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="search-section mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder={activeTab === 'services' ? "Rechercher un service..." : "Rechercher un abonnement..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <span className="badge bg-light text-dark fs-6 w-100 py-2">
                  {filteredServices.length} résultat(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <motion.div
        className="content-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {activeTab === 'services' ? (
          // Services content
          filteredServices.length === 0 ? (
          <div className="text-center py-5">
            <FaCut className="text-muted mb-3" size={48} />
            <p className="text-muted">Aucun service trouvé</p>
          </div>
        ) : (
          <div className="row">
            {filteredServices.map((service, index) => (
              <div key={service.id} className="col-lg-4 col-md-6 mb-4">
                <motion.div
                  className="card border-0 shadow-sm h-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title text-dark fw-bold">{service.nom}</h5>
                      <span className="badge bg-pink text-white">{service.prix}DT</span>
                    </div>
                    
                    <p className="card-text text-muted small mb-3">
                      {service.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <FaClock className="text-primary me-2" size={14} />
                        <span className="small text-muted">{service.duree} min</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaMoneyBill className="text-success me-2" size={14} />
                        <span className="small text-muted">{service.prix} DT</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <motion.button
                        className="btn btn-sm btn-outline-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal(service)}
                        title="Voir détails"
                      >
                        <FaEye size={12} />
                      </motion.button>
                      <motion.button
                        className="btn btn-sm btn-outline-secondary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditForm(service)}
                        title="Modifier"
                      >
                        <FaEdit size={12} />
                      </motion.button>
                      <motion.button
                        className="btn btn-sm btn-outline-danger"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openDeleteModal(service)}
                        title="Supprimer"
                      >
                        <FaTrash size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )
    ) : (
      // Memberships content
      filteredMemberships.length === 0 ? (
        <div className="text-center py-5">
          <FaCrown className="text-muted mb-3" size={48} />
          <p className="text-muted">Aucun type d'abonnement trouvé</p>
        </div>
      ) : (
        <div className="row">
          {filteredMemberships.map((membership, index) => (
            <div key={membership.id} className="col-lg-4 col-md-6 mb-4">
              <motion.div
                className="card border-0 shadow-sm h-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title text-dark fw-bold">{membership.nom}</h5>
                    <span className="badge bg-warning text-dark">{membership.prix}DT</span>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {membership.description}
                  </p>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <FaCalendar className="text-primary me-2" size={14} />
                      <span className="small text-muted">{membership.duree} jours</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <FaUsers className="text-success me-2" size={14} />
                      <span className="small text-muted">{membership.visites_max} visites</span>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <motion.button
                      className="btn btn-sm btn-outline-primary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openMembershipModal(membership)}
                      title="Voir détails"
                    >
                      <FaEye size={12} />
                    </motion.button>
                    <motion.button
                      className="btn btn-sm btn-outline-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openMembershipEditForm(membership)}
                      title="Modifier"
                    >
                      <FaEdit size={12} />
                    </motion.button>
                    <motion.button
                      className="btn btn-sm btn-outline-danger"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openMembershipDeleteModal(membership)}
                      title="Supprimer"
                    >
                      <FaTrash size={12} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )
    )}
      </motion.div>

      {/* Modal de détails service */}
      {showModal && selectedService && (
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
                  <FaCut className="text-primary me-2" />
                  {selectedService.nom}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Détails du service</h6>
                    <div className="mb-2">
                      <strong>Nom:</strong> {selectedService.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Prix:</strong> <span className="text-success">{selectedService.prix} DT</span>
                    </div>
                    <div className="mb-2">
                      <strong>Durée:</strong> {selectedService.duree} minutes
                    </div>
                    <div className="mb-3">
                      <strong>Description:</strong> {selectedService.description}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    {selectedService.image && (
                      <>
                        <h6 className="fw-bold text-primary mb-3">Image</h6>
                        <img 
                          src={selectedService.image} 
                          alt={selectedService.nom}
                          className="img-fluid rounded"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => openEditForm(selectedService)}>
                    <FaEdit className="me-2" />
                    Modifier
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Modal de détails abonnement */}
      {showMembershipModal && selectedMembership && (
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
                  {selectedMembership.nom}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => closeMembershipModal()}
                />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3">Détails de l'abonnement</h6>
                    <div className="mb-2">
                      <strong>Nom:</strong> {selectedMembership.nom}
                    </div>
                    <div className="mb-2">
                      <strong>Prix:</strong> <span className="text-success">{selectedMembership.prix} DT</span>
                    </div>
                    <div className="mb-2">
                      <strong>Durée:</strong> {selectedMembership.duree} jours
                    </div>
                    <div className="mb-2">
                      <strong>Visites maximum:</strong> {selectedMembership.visites_max}
                    </div>
                    <div className="mb-3">
                      <strong>Description:</strong> {selectedMembership.description}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => openMembershipEditForm(selectedMembership)}>
                    <FaEdit className="me-2" />
                    Modifier
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => closeMembershipModal()}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Service Form Modal */}
      <ServiceForm
        service={selectedServiceForEdit}
        isOpen={showServiceForm}
        onClose={closeServiceForm}
        onSave={handleServiceSave}
        mode={serviceFormMode}
      />

      {/* Membership Form Modal */}
      <MembershipForm
        membership={selectedMembershipForEdit}
        isOpen={showMembershipForm}
        onClose={closeMembershipForm}
        onSave={handleMembershipSave}
        mode={membershipFormMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ?"
        itemName={serviceToDelete?.nom}
        loading={deleteLoading}
      />

      {/* Membership Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showMembershipDeleteModal}
        onClose={closeMembershipDeleteModal}
        onConfirm={() => handleMembershipDelete(membershipToDelete)}
        title="Supprimer le type d'abonnement"
        message="Êtes-vous sûr de vouloir supprimer ce type d'abonnement ?"
        itemName={membershipToDelete?.nom}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminServices;
