import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCog,
  FaUser,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaStore,
  FaClock,
  FaPaperPlane,
  FaCalendarDay,
  FaKey,
  FaUserShield,
  FaBriefcase,
  FaStar,
  FaStarHalfAlt,
  FaRegStar
} from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminSettings = () => {
  const { changePassword, admin } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [clients, setClients] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    client_id: '',
    note: 5,
    commentaire: '',
    visible: true,
    reponse_admin: ''
  });

  const [userForm, setUserForm] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'employe',
    actif: true,
    permissions: {
      pages: []
    }
  });

  // Available admin pages for permissions
  const availablePages = [
    { id: 'clients', label: 'Clients', icon: FaUsers },
    { id: 'services', label: 'Services', icon: FaBriefcase },
    { id: 'reservations', label: 'Réservations', icon: FaCalendarDay },
    { id: 'inventory', label: 'Inventaire', icon: FaStore },
    { id: 'store', label: 'Boutique', icon: FaStore },
    { id: 'statistics', label: 'Statistiques', icon: FaPaperPlane },
    { id: 'reviews', label: 'Avis', icon: FaStar },
    { id: 'settings', label: 'Paramètres', icon: FaCog }
  ];

  const [spaSettings, setSpaSettings] = useState({
    nom_spa: '',
    adresse: '',
    telephone: '',
    email: '',
    description: '',
    politique_annulation: '',
    horaires_ouverture: '',
    site_web: ''
  });

  const [adminAccountForm, setAdminAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchUsers();
    } else if (activeTab === 'spa') {
      fetchSpaSettings();
    } else if (activeTab === 'reviews') {
      fetchReviews();
      fetchClients();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdministrateurs();
      // Ensure users is always an array
      const usersData = response.data;
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.warn('Users data is not an array:', usersData);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // Check if it's a 403 error (insufficient permissions)
      if (error.response?.status === 403) {
        console.warn('Accès refusé - Permissions insuffisantes pour voir les utilisateurs');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpaSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSalonParams();
      setSpaSettings(response.data || {});
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAvis();
      setReviews(response.data.avis || []);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await adminAPI.getClients(1, 50);
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setClients([]);
    }
  };

  const openReviewModal = (review = null) => {
    setEditingReview(review);
    if (review) {
      setReviewForm({
        client_id: review.client_id,
        note: review.note,
        commentaire: review.commentaire,
        visible: review.visible,
        reponse_admin: review.reponse_admin || ''
      });
    } else {
      setReviewForm({
        client_id: '',
        note: 5,
        commentaire: '',
        visible: true,
        reponse_admin: ''
      });
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingReview) {
        await adminAPI.updateAvis(editingReview.id, reviewForm);
        alert('Avis mis à jour avec succès !');
      } else {
        // Check if we already have 3 reviews
        if (reviews.length >= 3) {
          alert('Limite de 3 avis atteinte. Veuillez supprimer un avis existant avant d\'en créer un nouveau.');
          return;
        }
        await adminAPI.createAvis(reviewForm);
        alert('Avis créé avec succès !');
      }
      
      await fetchReviews();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      try {
        setLoading(true);
        await adminAPI.deleteAvis(reviewId);
        await fetchReviews();
        alert('Avis supprimé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'avis');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleReviewVisibility = async (reviewId, currentVisibility) => {
    try {
      await adminAPI.toggleAvisVisibility(reviewId, !currentVisibility);
      await fetchReviews();
    } catch (error) {
      console.error('Erreur lors du changement de visibilité:', error);
      alert('Erreur lors du changement de visibilité');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-muted" />);
    }
    
    return stars;
  };

  const handleAdminAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAdminAccountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminAccountSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!adminAccountForm.currentPassword || !adminAccountForm.newPassword || !adminAccountForm.confirmPassword) {
      alert('Veuillez remplir tous les champs de mot de passe');
      return;
    }
    
    // Validate password match
    if (adminAccountForm.newPassword !== adminAccountForm.confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    // Validate password strength
    if (adminAccountForm.newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    try {
      setLoading(true);
      const result = await changePassword(
        adminAccountForm.currentPassword, 
        adminAccountForm.newPassword
      );
      
      if (result.success) {
        alert('✅ Mot de passe modifié avec succès !');
        setAdminAccountForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(`❌ ${result.message || 'Erreur lors du changement de mot de passe'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compte:', error);
      alert('❌ Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpaInputChange = (e) => {
    const { name, value } = e.target;
    setSpaSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminAPI.updateAdministrateur(editingUser.id, userForm);
      } else {
        await adminAPI.createAdministrateur(userForm);
      }
      
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
      alert(`Utilisateur ${editingUser ? 'mis à jour' : 'créé'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleSpaSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateSalonParams(spaSettings);
      alert('Paramètres du spa mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    
    // Parse permissions from database
    let permissions = { pages: [] };
    if (user.permissions) {
      try {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      } catch (e) {
        console.error('Error parsing permissions:', e);
      }
    }
    
    setUserForm({
      nom: user.nom || '',
      email: user.email || '',
      password: '',
      role: user.role || 'employe',
      actif: user.actif !== false,
      permissions: permissions
    });
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminAPI.toggleAdminStatus(userId);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      nom: '',
      email: '',
      password: '',
      role: 'employe',
      actif: true,
      permissions: {
        pages: []
      }
    });
  };

  const openCreateUserModal = () => {
    resetUserForm();
    setEditingUser(null);
    setShowUserModal(true);
  };

  // Handle permission checkbox change
  const handlePermissionChange = (pageId) => {
    setUserForm(prev => {
      const currentPages = prev.permissions?.pages || [];
      const newPages = currentPages.includes(pageId)
        ? currentPages.filter(p => p !== pageId)
        : [...currentPages, pageId];
      
      return {
        ...prev,
        permissions: {
          pages: newPages
        }
      };
    });
  };

  const tabs = [
    { id: 'employees', label: 'Employés', icon: FaBriefcase },
    { id: 'spa', label: 'Spa', icon: FaStore },
    { id: 'reviews', label: 'Avis Clients', icon: FaStar },
    { id: 'account', label: 'Mon Compte', icon: FaUserShield },
  ];

  return (
    <div className="admin-settings">
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
              <FaCog className="text-primary me-2" />
              Paramètres
            </h1>
            <p className="text-muted mb-0">
              Gérez les paramètres de votre spa et de votre équipe
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="settings-tabs mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <nav className="nav nav-tabs border-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-link border-0 px-4 py-3 ${activeTab === tab.id ? 'active bg-light' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="me-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="settings-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {activeTab === 'employees' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <FaUsers className="text-primary me-2" />
                Gestion des Employés
              </h5>
              <button
                className="btn btn-pink"
                onClick={openCreateUserModal}
              >
                <FaPlus className="me-2" />
                Nouvel Employé
              </button>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <p className="text-muted mt-2">Chargement...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 px-4 py-3">Utilisateur</th>
                        <th className="border-0 py-3">Pages autorisées</th>
                        <th className="border-0 py-3">Statut</th>
                        <th className="border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!Array.isArray(users) || users.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5 text-muted">
                            <FaUser className="mb-3" size={48} />
                            <p className="mb-0">
                              {!Array.isArray(users) 
                                ? 'Erreur de chargement des utilisateurs' 
                                : 'Aucun utilisateur trouvé'
                              }
                            </p>
                          </td>
                        </tr>
                      ) : (
                        users.map((user, index) => {
                          // Parse permissions
                          let userPermissions = { pages: [] };
                          if (user.permissions) {
                            try {
                              userPermissions = typeof user.permissions === 'string' 
                                ? JSON.parse(user.permissions) 
                                : user.permissions;
                            } catch (e) {
                              console.error('Error parsing permissions:', e);
                            }
                          }

                          return (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.4 }}
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <strong className="text-dark">
                                    {user.nom}
                                  </strong>
                                  <div className="small text-muted">
                                    {user.email}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                {user.role === 'super_admin' ? (
                                  <span className="badge bg-danger">
                                    <FaUserShield className="me-1" size={12} />
                                    Accès total
                                  </span>
                                ) : (
                                  <div className="d-flex flex-wrap gap-1">
                                    {userPermissions.pages?.length > 0 ? (
                                      userPermissions.pages.map(pageId => {
                                        const page = availablePages.find(p => p.id === pageId);
                                        return page ? (
                                          <span key={pageId} className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                                            {page.label}
                                          </span>
                                        ) : null;
                                      })
                                    ) : (
                                      <span className="text-muted small">Aucune page</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`badge ${user.actif ? 'bg-success' : 'bg-secondary'}`}>
                                  {user.actif ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEditUser(user)}
                                    title="Modifier"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button
                                    className={`btn btn-sm ${user.actif ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                    onClick={() => handleToggleUserStatus(user.id)}
                                    title={user.actif ? 'Désactiver' : 'Activer'}
                                  >
                                    {user.actif ? <FaTimes size={12} /> : <FaUser size={12} />}
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'spa' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaStore className="text-primary me-2" />
                Paramètres du Spa
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSpaSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nom du Spa</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nom_spa"
                      value={spaSettings.nom_spa || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telephone"
                      value={spaSettings.telephone || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={spaSettings.email || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Adresse</label>
                    <input
                      type="text"
                      className="form-control"
                      name="adresse"
                      value={spaSettings.adresse || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Description du Spa</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="4"
                      value={spaSettings.description || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Horaires d'ouverture</label>
                    <input
                      type="text"
                      className="form-control"
                      name="horaires_ouverture"
                      value={spaSettings.horaires_ouverture || ''}
                      onChange={handleSpaInputChange}
                      placeholder="Lun-Ven: 9h-18h, Sam: 9h-17h"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Site Web</label>
                    <input
                      type="url"
                      className="form-control"
                      name="site_web"
                      value={spaSettings.site_web || ''}
                      onChange={handleSpaInputChange}
                      placeholder="https://monspa.com"
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Politique d'annulation</label>
                    <textarea
                      className="form-control"
                      name="politique_annulation"
                      rows="3"
                      value={spaSettings.politique_annulation || ''}
                      onChange={handleSpaInputChange}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-pink">
                    <FaSave className="me-2" />
                    Sauvegarder les paramètres
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0">
              <h5 className="mb-0 fw-bold">
                <FaUserShield className="text-primary me-2" />
                Mon Compte Super Admin
              </h5>
            </div>
            <div className="card-body">
              {/* Account Info Section */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="bg-light p-4 rounded">
                    <h6 className="fw-bold mb-3">
                      <FaUser className="text-primary me-2" />
                      Informations du compte
                    </h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <strong>Nom:</strong> <span className="text-muted">{admin?.nom || 'N/A'}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Email:</strong> <span className="text-muted">{admin?.email || 'N/A'}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Rôle:</strong> 
                        <span className="badge bg-danger ms-2">
                          <FaUserShield className="me-1" />
                          Super Admin
                        </span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong>Statut:</strong> 
                        <span className="badge bg-success ms-2">
                          Actif
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="row">
                <div className="col-12">
                  <h6 className="fw-bold mb-3">
                    <FaKey className="text-warning me-2" />
                    Changer le mot de passe
                  </h6>
                  
                  <form onSubmit={handleAdminAccountSubmit}>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">Mot de passe actuel *</label>
                        <div className="input-group">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="form-control"
                            name="currentPassword"
                            value={adminAccountForm.currentPassword}
                            onChange={handleAdminAccountInputChange}
                            required
                            placeholder="Entrez votre mot de passe actuel"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nouveau mot de passe *</label>
                        <div className="input-group">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="form-control"
                            name="newPassword"
                            value={adminAccountForm.newPassword}
                            onChange={handleAdminAccountInputChange}
                            required
                            placeholder="Nouveau mot de passe"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <small className="text-muted">Minimum 6 caractères</small>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Confirmer le mot de passe *</label>
                        <div className="input-group">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="form-control"
                            name="confirmPassword"
                            value={adminAccountForm.confirmPassword}
                            onChange={handleAdminAccountInputChange}
                            required
                            placeholder="Confirmez le mot de passe"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="alert alert-info">
                          <FaKey className="me-2" />
                          <strong>Conseils de sécurité:</strong>
                          <ul className="mb-0 mt-2">
                            <li>Utilisez un mot de passe unique</li>
                            <li>Combinez lettres majuscules, minuscules et chiffres</li>
                            <li>Évitez les informations personnelles</li>
                            <li>Changez régulièrement votre mot de passe</li>
                          </ul>
                        </div>
                      </div>

                      <div className="col-12">
                        <motion.button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status" />
                              Mise à jour en cours...
                            </>
                          ) : (
                            <>
                              <FaSave className="me-2" />
                              Enregistrer le nouveau mot de passe
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <FaStar className="text-warning me-2" />
                Gestion des Avis Clients
              </h5>
              <div className="d-flex align-items-center gap-3">
                <small className="text-muted">
                  {reviews.length}/3 avis
                </small>
                <motion.button
                  className="btn btn-primary btn-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openReviewModal()}
                  disabled={reviews.length >= 3}
                  title={reviews.length >= 3 ? 'Limite de 3 avis atteinte' : 'Ajouter un avis'}
                >
                  <FaPlus className="me-1" />
                  Nouvel avis
                </motion.button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-5">
                  <FaStar className="text-muted mb-3" size={48} />
                  <h6 className="text-muted">Aucun avis client</h6>
                  <p className="text-muted mb-3">Commencez par ajouter votre premier avis client</p>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => openReviewModal()}
                  >
                    <FaPlus className="me-2" />
                    Ajouter un avis
                  </button>
                </div>
              ) : (
                <div className="row">
                  {reviews.map((review) => (
                    <div key={review.id} className="col-md-6 col-lg-4 mb-4">
                      <motion.div
                        className="card h-100 border-0 shadow-sm"
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-2">
                              {renderStars(review.note)}
                              <span className="fw-bold text-primary">{review.note}/5</span>
                            </div>
                            <div className="d-flex gap-1">
                              <button
                                className={`btn btn-sm ${review.visible ? 'btn-success' : 'btn-outline-secondary'}`}
                                onClick={() => toggleReviewVisibility(review.id, review.visible)}
                                title={review.visible ? 'Masquer' : 'Afficher'}
                              >
                                {review.visible ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openReviewModal(review)}
                                title="Modifier"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteReview(review.id)}
                                title="Supprimer"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h6 className="mb-1 fw-bold">{review.client_nom}</h6>
                            <small className="text-muted">{review.client_email}</small>
                          </div>
                          
                          <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                            "{review.commentaire}"
                          </p>
                          
                          {review.reponse_admin && (
                            <div className="bg-light p-2 rounded mb-3">
                              <small className="fw-bold text-primary d-block">Réponse admin:</small>
                              <small className="text-muted">"{review.reponse_admin}"</small>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {new Date(review.date_avis).toLocaleDateString('fr-FR')}
                            </small>
                            <span className={`badge ${review.visible ? 'bg-success' : 'bg-secondary'}`}>
                              {review.visible ? 'Visible' : 'Masqué'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Review Modal */}
      {showReviewModal && (
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
                  <FaStar className="text-warning me-2" />
                  {editingReview ? 'Modifier l\'avis' : 'Nouvel avis client'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowReviewModal(false)}
                  disabled={loading}
                />
              </div>
              
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Client <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={reviewForm.client_id}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, client_id: e.target.value }))}
                          required
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.prenom} {client.nom} ({client.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Note <span className="text-danger">*</span></label>
                        <div className="d-flex align-items-center gap-3">
                          <input
                            type="range"
                            className="form-range"
                            min="1"
                            max="5"
                            step="0.5"
                            value={reviewForm.note}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, note: parseFloat(e.target.value) }))}
                          />
                          <div className="d-flex align-items-center gap-2">
                            {renderStars(reviewForm.note)}
                            <span className="fw-bold text-primary">{reviewForm.note}/5</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="visible"
                            checked={reviewForm.visible}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, visible: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="visible">
                            Avis visible sur le site
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Commentaire <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={reviewForm.commentaire}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, commentaire: e.target.value }))}
                          placeholder="Commentaire du client..."
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Réponse admin (optionnelle)</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={reviewForm.reponse_admin}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, reponse_admin: e.target.value }))}
                          placeholder="Réponse de l'équipe..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {!editingReview && reviews.length >= 3 && (
                    <div className="alert alert-warning">
                      <strong>Attention:</strong> Vous avez atteint la limite de 3 avis. 
                      Supprimez un avis existant pour en ajouter un nouveau.
                    </div>
                  )}
                </div>
                
                <div className="modal-footer border-0">
                  <div className="d-flex gap-2 w-100">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowReviewModal(false)}
                      disabled={loading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={loading || (!editingReview && reviews.length >= 3)}
                    >
                      {loading ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          {editingReview ? 'Mise à jour...' : 'Création...'}
                        </>
                      ) : (
                        <>
                          <FaSave />
                          {editingReview ? 'Mettre à jour' : 'Créer l\'avis'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <FaUser className="text-primary me-2" />
                  {editingUser ? 'Modifier l\'employé' : 'Nouvel Employé'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUserModal(false)}
                />
              </div>
              <form onSubmit={handleUserSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nom"
                        value={userForm.nom}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={userForm.email}
                        onChange={handleUserInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">
                        {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          name="password"
                          value={userForm.password}
                          onChange={handleUserInputChange}
                          required={!editingUser}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="actif"
                          checked={userForm.actif}
                          onChange={handleUserInputChange}
                        />
                        <label className="form-check-label">
                          Utilisateur actif
                        </label>
                      </div>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label fw-bold">
                        <FaKey className="me-2 text-primary" />
                        Pages autorisées
                      </label>
                      <div className="card border">
                        <div className="card-body">
                          <div className="row">
                            {availablePages.map((page) => {
                              const Icon = page.icon;
                              const isChecked = userForm.permissions?.pages?.includes(page.id) || false;
                              
                              return (
                                <div key={page.id} className="col-md-6 mb-2">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`page-${page.id}`}
                                      checked={isChecked}
                                      onChange={() => handlePermissionChange(page.id)}
                                    />
                                    <label 
                                      className="form-check-label d-flex align-items-center" 
                                      htmlFor={`page-${page.id}`}
                                    >
                                      <Icon className="me-2 text-muted" size={14} />
                                      {page.label}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <small className="text-muted mt-2 d-block">
                            <FaKey className="me-1" size={12} />
                            Les employés ne peuvent accéder qu'aux pages sélectionnées
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUserModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-pink"
                  >
                    <FaSave className="me-2" />
                    {editingUser ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
