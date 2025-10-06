// Comprehensive sample data for testing all features

// ============================================================================
// CLIENTS
// ============================================================================
const sampleClients = [
  {
    id: 1,
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@example.com',
    telephone: '+216 20 123 456',
    date_naissance: '1990-05-15',
    adresse: '123 Rue de la Paix, Tunis',
    notes: 'Préfère les massages doux',
    mot_de_passe: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6', // password: test123
    email_verifie: true,
    statut: 'actif',
    langue_preferee: 'fr',
    actif: true
  },
  {
    id: 2,
    nom: 'Martin',
    prenom: 'Jean',
    email: 'jean.martin@example.com',
    telephone: '+216 20 234 567',
    date_naissance: '1985-08-20',
    adresse: '456 Avenue Habib Bourguiba, Tunis',
    notes: null,
    mot_de_passe: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6',
    email_verifie: false,
    statut: 'actif',
    langue_preferee: 'fr',
    actif: true
  },
  {
    id: 3,
    nom: 'Ben Ali',
    prenom: 'Fatma',
    email: 'fatma.benali@example.com',
    telephone: '+216 20 345 678',
    date_naissance: '1995-03-10',
    adresse: '789 Rue de Carthage, Tunis',
    notes: 'Cliente VIP',
    mot_de_passe: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6',
    email_verifie: true,
    statut: 'actif',
    langue_preferee: 'ar',
    actif: true
  }
];

// ============================================================================
// SERVICES
// ============================================================================
const sampleServices = [
  {
    id: 1,
    nom: 'Massage Relaxant',
    description: 'Massage complet du corps pour détente profonde',
    description_detaillee: 'Un massage relaxant de 60 minutes qui apaise les tensions musculaires',
    service_type: 'base',
    parent_service_id: null,
    categorie_id: 1,
    prix: 80.00,
    duree: 60,
    image_url: '/images/services/massage-relaxant.jpg',
    inclus: 'Huiles essentielles, Musique douce, Thé offert',
    contre_indications: 'Grossesse, Problèmes cardiaques',
    conseils_apres_soin: 'Boire beaucoup d\'eau, Se reposer',
    nombre_sessions: null,
    prix_par_session: null,
    validite_jours: null,
    actif: true,
    populaire: true,
    nouveau: false,
    ordre_affichage: 1
  },
  {
    id: 2,
    nom: 'Soin du Visage',
    description: 'Soin hydratant et purifiant du visage',
    description_detaillee: 'Nettoyage en profondeur, exfoliation et masque hydratant',
    service_type: 'base',
    parent_service_id: null,
    categorie_id: 2,
    prix: 60.00,
    duree: 45,
    image_url: '/images/services/soin-visage.jpg',
    inclus: 'Produits bio, Massage du visage',
    contre_indications: 'Acné sévère, Allergies',
    conseils_apres_soin: 'Éviter le soleil, Hydrater',
    nombre_sessions: null,
    prix_par_session: null,
    validite_jours: null,
    actif: true,
    populaire: true,
    nouveau: true,
    ordre_affichage: 2
  },
  {
    id: 3,
    nom: 'Package Relaxation 5 séances',
    description: 'Package de 5 séances de massage',
    description_detaillee: '5 séances de massage relaxant à utiliser sur 3 mois',
    service_type: 'package',
    parent_service_id: 1,
    categorie_id: 1,
    prix: 350.00,
    duree: 60,
    image_url: '/images/services/package-massage.jpg',
    inclus: 'Huiles essentielles, Musique douce, Thé offert',
    contre_indications: 'Grossesse, Problèmes cardiaques',
    conseils_apres_soin: 'Boire beaucoup d\'eau, Se reposer',
    nombre_sessions: 5,
    prix_par_session: 70.00,
    validite_jours: 90,
    actif: true,
    populaire: false,
    nouveau: false,
    ordre_affichage: 3
  }
];

const sampleServiceCategories = [
  {
    id: 1,
    nom: 'Massages',
    description: 'Massages thérapeutiques et relaxants',
    couleur_theme: '#E91E63',
    actif: true
  },
  {
    id: 2,
    nom: 'Soins du Visage',
    description: 'Soins esthétiques pour le visage',
    couleur_theme: '#9C27B0',
    actif: true
  },
  {
    id: 3,
    nom: 'Soins du Corps',
    description: 'Soins complets du corps',
    couleur_theme: '#3F51B5',
    actif: true
  }
];

// ============================================================================
// RESERVATIONS
// ============================================================================
const sampleReservations = [
  {
    id: 1,
    client_id: 1,
    service_id: 1,
    date_reservation: '2024-02-15',
    heure_debut: '10:00:00',
    heure_fin: '11:00:00',
    statut: 'confirmee',
    reservation_status: 'reserved',
    prix_service: 80.00,
    prix_final: 72.00, // 10% discount applied
    notes_client: 'Préfère une pression moyenne',
    client_nom: 'Dupont',
    client_prenom: 'Marie',
    client_telephone: '+216 20 123 456',
    client_email: 'marie.dupont@example.com',
    session_id: null,
    referral_code_id: 1,
    has_healing_addon: false,
    addon_price: 0.00
  },
  {
    id: 2,
    client_id: 2,
    service_id: 2,
    date_reservation: '2024-02-16',
    heure_debut: '14:00:00',
    heure_fin: '14:45:00',
    statut: 'en_attente',
    reservation_status: 'reserved',
    prix_service: 60.00,
    prix_final: 60.00,
    notes_client: null,
    client_nom: 'Martin',
    client_prenom: 'Jean',
    client_telephone: '+216 20 234 567',
    client_email: 'jean.martin@example.com',
    session_id: 'draft_abc123',
    referral_code_id: null,
    has_healing_addon: true,
    addon_price: 20.00
  },
  {
    id: 3,
    client_id: null,
    service_id: 1,
    date_reservation: '2024-02-20',
    heure_debut: '15:00:00',
    heure_fin: '16:00:00',
    statut: 'draft',
    reservation_status: 'draft',
    prix_service: 80.00,
    prix_final: 80.00,
    notes_client: 'À confirmer',
    client_nom: 'Test',
    client_prenom: 'User',
    client_telephone: '+216 20 999 999',
    client_email: 'test@example.com',
    session_id: 'draft_xyz789',
    referral_code_id: null,
    has_healing_addon: false,
    addon_price: 0.00
  }
];

// ============================================================================
// MEMBERSHIPS
// ============================================================================
const sampleMemberships = [
  {
    id: 1,
    nom: 'Bronze',
    prix_mensuel: 50.00,
    prix_3_mois: 135.00,
    services_par_mois: 2,
    description: 'Adhésion idéale pour découvrir nos services',
    avantages: 'Réduction 5%, Priorité de réservation',
    actif: true
  },
  {
    id: 2,
    nom: 'Silver',
    prix_mensuel: 80.00,
    prix_3_mois: 216.00,
    services_par_mois: 4,
    description: 'Adhésion pour des soins réguliers',
    avantages: 'Réduction 10%, Priorité de réservation, Service gratuit anniversaire',
    actif: true
  },
  {
    id: 3,
    nom: 'Gold',
    prix_mensuel: 120.00,
    prix_3_mois: 324.00,
    services_par_mois: 8,
    description: 'Adhésion premium pour soins illimités',
    avantages: 'Réduction 15%, Priorité absolue, Services gratuits, Cadeaux exclusifs',
    actif: true
  }
];

// ============================================================================
// REFERRAL CODES
// ============================================================================
const sampleReferralCodes = [
  {
    id: 1,
    code: 'MARIE2024',
    owner_client_id: 1,
    discount_percentage: 10.00,
    max_uses: null,
    current_uses: 5,
    is_active: true,
    expires_at: null
  },
  {
    id: 2,
    code: 'JEAN5OFF',
    owner_client_id: 2,
    discount_percentage: 5.00,
    max_uses: 10,
    current_uses: 3,
    is_active: true,
    expires_at: '2024-12-31'
  },
  {
    id: 3,
    code: 'FATMA15',
    owner_client_id: 3,
    discount_percentage: 15.00,
    max_uses: 5,
    current_uses: 5,
    is_active: false, // Reached max uses
    expires_at: null
  }
];

const sampleReferralUsage = [
  {
    id: 1,
    referral_code_id: 1,
    used_by_client_id: 2,
    reservation_id: 1,
    discount_amount: 8.00,
    used_at: '2024-01-15 10:00:00'
  },
  {
    id: 2,
    referral_code_id: 2,
    used_by_client_id: 3,
    reservation_id: null,
    discount_amount: 0.00,
    used_at: '2024-01-20 14:30:00'
  }
];

// ============================================================================
// STORE PRODUCTS
// ============================================================================
const sampleProducts = [
  {
    id: 1,
    name: 'Chaise de Spa Luxe',
    description: 'Chaise ergonomique pour soins spa',
    price: 2500.00,
    category_id: 1,
    is_preorder: true,
    estimated_delivery_days: 14,
    image_url: '/images/products/chaise-spa.jpg',
    active: true
  },
  {
    id: 2,
    name: 'Lit de Soins du Visage',
    description: 'Lit professionnel pour soins du visage',
    price: 1200.00,
    category_id: 1,
    is_preorder: true,
    estimated_delivery_days: 21,
    image_url: '/images/products/lit-soins.jpg',
    active: true
  },
  {
    id: 3,
    name: 'Sérum Visage Bio',
    description: 'Sérum naturel pour le visage',
    price: 89.99,
    category_id: 2,
    is_preorder: true,
    estimated_delivery_days: 7,
    image_url: '/images/products/serum.jpg',
    active: true
  }
];

const sampleProductCategories = [
  {
    id: 1,
    name: 'Équipement',
    description: 'Équipement professionnel pour spa',
    active: true
  },
  {
    id: 2,
    name: 'Produits de beauté',
    description: 'Produits cosmétiques et de soin',
    active: true
  },
  {
    id: 3,
    name: 'Accessoires',
    description: 'Accessoires pour soins',
    active: true
  },
  {
    id: 4,
    name: 'Mobilier',
    description: 'Mobilier de spa',
    active: true
  }
];

const sampleOrders = [
  {
    id: 1,
    client_id: 1,
    total_amount: 2589.99,
    status: 'pending',
    order_date: '2024-01-15',
    estimated_delivery: '2024-02-05'
  },
  {
    id: 2,
    client_id: 2,
    total_amount: 1200.00,
    status: 'confirmed',
    order_date: '2024-01-20',
    estimated_delivery: '2024-02-15'
  }
];

const sampleOrderItems = [
  {
    id: 1,
    order_id: 1,
    product_id: 1,
    quantity: 1,
    unit_price: 2500.00,
    subtotal: 2500.00
  },
  {
    id: 2,
    order_id: 1,
    product_id: 3,
    quantity: 1,
    unit_price: 89.99,
    subtotal: 89.99
  }
];

// ============================================================================
// ADMINS
// ============================================================================
const sampleAdmins = [
  {
    id: 1,
    nom: 'Admin',
    email: 'admin@zenshespa.com',
    mot_de_passe: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6', // password: test123
    role: 'admin',
    actif: true
  },
  {
    id: 2,
    nom: 'Manager',
    email: 'manager@zenshespa.com',
    mot_de_passe: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6',
    role: 'manager',
    actif: true
  }
];

module.exports = {
  sampleClients,
  sampleServices,
  sampleServiceCategories,
  sampleReservations,
  sampleMemberships,
  sampleReferralCodes,
  sampleReferralUsage,
  sampleProducts,
  sampleProductCategories,
  sampleOrders,
  sampleOrderItems,
  sampleAdmins
};
