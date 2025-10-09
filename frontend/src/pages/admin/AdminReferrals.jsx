import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge, Modal, Form, Alert, Spinner, Table, Pagination } from 'react-bootstrap';
import { FaGift, FaPlus, FaEye, FaUserFriends, FaPercent, FaTimes, FaCheck } from 'react-icons/fa';
import { adminAPI } from '../../services/api';

const AdminReferrals = () => {
    const [referralCodes, setReferralCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedCode, setSelectedCode] = useState(null);
    const [codeStats, setCodeStats] = useState([]);
    const [clients, setClients] = useState([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    // Form data for creating new referral code
    const [newCodeData, setNewCodeData] = useState({
        clientId: '',
        discountPercentage: 10,
        maxUses: '',
        expiresAt: ''
    });

    useEffect(() => {
        fetchReferralCodes();
        fetchClients();
    }, [currentPage]);

    const fetchReferralCodes = async () => {
        try {
            setLoading(true);
            const offset = (currentPage - 1) * itemsPerPage;
            const response = await adminAPI.getReferralCodes(itemsPerPage, offset);
            setReferralCodes(response.data.data);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching referral codes:', error);
            setError('Erreur lors du chargement des codes de parrainage');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await adminAPI.getClients();
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchCodeStats = async (codeId) => {
        try {
            const response = await adminAPI.getReferralCodeStats(codeId);
            setCodeStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching code stats:', error);
            setError('Erreur lors du chargement des statistiques');
        }
    };

    const handleCreateCode = async (e) => {
        e.preventDefault();
        
        try {
            const payload = {
                clientId: parseInt(newCodeData.clientId),
                discountPercentage: parseFloat(newCodeData.discountPercentage),
                maxUses: newCodeData.maxUses ? parseInt(newCodeData.maxUses) : null,
                expiresAt: newCodeData.expiresAt || null
            };

            await adminAPI.createReferralCodeForClient(payload);
            setSuccess('Code de parrainage créé avec succès');
            setShowCreateModal(false);
            setNewCodeData({
                clientId: '',
                discountPercentage: 10,
                maxUses: '',
                expiresAt: ''
            });
            fetchReferralCodes();
        } catch (error) {
            console.error('Error creating referral code:', error);
            setError(error.response?.data?.message || 'Erreur lors de la création du code');
        }
    };

    const handleDeactivateCode = async (codeId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce code de parrainage?')) {
            return;
        }

        try {
            await adminAPI.deactivateReferralCode(codeId);
            setSuccess('Code désactivé avec succès');
            fetchReferralCodes();
        } catch (error) {
            console.error('Error deactivating code:', error);
            setError('Erreur lors de la désactivation du code');
        }
    };

    const handleViewStats = async (code) => {
        setSelectedCode(code);
        await fetchCodeStats(code.id);
        setShowStatsModal(true);
    };

    const getStatusBadge = (code) => {
        if (!code.is_active) return <Badge bg="danger">Inactif</Badge>;
        if (code.expires_at && new Date() > new Date(code.expires_at)) {
            return <Badge bg="warning">Expiré</Badge>;
        }
        if (code.max_uses && code.current_uses >= code.max_uses) {
            return <Badge bg="secondary">Limite atteinte</Badge>;
        }
        return <Badge bg="success">Actif</Badge>;
    };

    return (
        <div className="container-fluid p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="text-dark mb-1">
                            <FaGift className="me-2 text-primary" />
                            Gestion des Codes de Parrainage
                        </h2>
                        <p className="text-muted">Gérez les codes de parrainage et suivez leurs performances</p>
                    </div>
                    <Button 
                        variant="primary" 
                        onClick={() => setShowCreateModal(true)}
                        className="d-flex align-items-center"
                    >
                        <FaPlus className="me-2" />
                        Créer un Code
                    </Button>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {/* Referral Codes Table */}
                <Card>
                    <Card.Header className="bg-light">
                        <h5 className="mb-0">Codes de Parrainage</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center p-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Chargement des codes...</p>
                            </div>
                        ) : (
                            <>
                                <Table responsive striped hover>
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Code</th>
                                            <th>Propriétaire</th>
                                            <th>Réduction</th>
                                            <th>Utilisations</th>
                                            <th>Statut</th>
                                            <th>Créé le</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referralCodes.map((code) => (
                                            <tr key={code.id}>
                                                <td>
                                                    <Badge bg="info" className="font-monospace">
                                                        {code.code}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{code.owner_name}</strong>
                                                        <br />
                                                        <small className="text-muted">{code.owner_email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="fw-bold text-success">
                                                        {code.discount_percentage}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{code.total_uses || 0}</strong>
                                                        {code.max_uses && (
                                                            <span className="text-muted">
                                                                / {code.max_uses}
                                                            </span>
                                                        )}
                                                        <br />
                                                        <small className="text-success">
                                                            ${code.total_discounts_given || 0} économisé
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>{getStatusBadge(code)}</td>
                                                <td>
                                                    <small>
                                                        {new Date(code.created_at).toLocaleDateString('fr-FR')}
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-info"
                                                            onClick={() => handleViewStats(code)}
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        {code.is_active && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() => handleDeactivateCode(code.id)}
                                                            >
                                                                <FaTimes />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-center p-3">
                                        <Pagination>
                                            <Pagination.Prev 
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                            />
                                            {[...Array(totalPages)].map((_, index) => (
                                                <Pagination.Item
                                                    key={index + 1}
                                                    active={index + 1 === currentPage}
                                                    onClick={() => setCurrentPage(index + 1)}
                                                >
                                                    {index + 1}
                                                </Pagination.Item>
                                            ))}
                                            <Pagination.Next 
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                            />
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </Card.Body>
                </Card>

                {/* Create Code Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Créer un Code de Parrainage</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCreateCode}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Client</Form.Label>
                                <Form.Select
                                    value={newCodeData.clientId}
                                    onChange={(e) => setNewCodeData({...newCodeData, clientId: e.target.value})}
                                    required
                                >
                                    <option value="">Sélectionner un client...</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom} {client.prenom} ({client.email})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Pourcentage de Réduction (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="0.1"
                                    value={newCodeData.discountPercentage}
                                    onChange={(e) => setNewCodeData({...newCodeData, discountPercentage: e.target.value})}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Nombre Maximum d'Utilisations (optionnel)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={newCodeData.maxUses}
                                    onChange={(e) => setNewCodeData({...newCodeData, maxUses: e.target.value})}
                                    placeholder="Illimité si vide"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Date d'Expiration (optionnel)</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={newCodeData.expiresAt}
                                    onChange={(e) => setNewCodeData({...newCodeData, expiresAt: e.target.value})}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" type="submit">
                                Créer le Code
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Stats Modal */}
                <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Statistiques du Code: <Badge bg="info">{selectedCode?.code}</Badge>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedCode && (
                            <>
                                {/* Code Details */}
                                <Card className="mb-3">
                                    <Card.Header>Détails du Code</Card.Header>
                                    <Card.Body>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p><strong>Propriétaire:</strong> {selectedCode.owner_name}</p>
                                                <p><strong>Réduction:</strong> {selectedCode.discount_percentage}%</p>
                                                <p><strong>Utilisations:</strong> {selectedCode.total_uses || 0}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p><strong>Max utilisations:</strong> {selectedCode.max_uses || 'Illimité'}</p>
                                                <p><strong>Total économisé:</strong> ${selectedCode.total_discounts_given || 0}</p>
                                                <p><strong>Statut:</strong> {getStatusBadge(selectedCode)}</p>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* Usage History */}
                                <Card>
                                    <Card.Header>Historique d'Utilisation</Card.Header>
                                    <Card.Body>
                                        {codeStats.length === 0 ? (
                                            <p className="text-muted text-center">Aucune utilisation enregistrée</p>
                                        ) : (
                                            <Table responsive striped>
                                                <thead>
                                                    <tr>
                                                        <th>Client</th>
                                                        <th>Email</th>
                                                        <th>Réduction</th>
                                                        <th>Date d'utilisation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {codeStats.map((usage) => (
                                                        <tr key={usage.id}>
                                                            <td>{usage.nom}</td>
                                                            <td>{usage.email}</td>
                                                            <td className="text-success">
                                                                ${usage.discount_amount}
                                                            </td>
                                                            <td>
                                                                {new Date(usage.used_at).toLocaleString('fr-FR')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
                            Fermer
                        </Button>
                    </Modal.Footer>
                </Modal>
            </motion.div>
        </div>
    );
};

export default AdminReferrals;