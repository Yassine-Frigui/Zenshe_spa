// Database test utilities

const mysql = require('mysql2/promise');

let connection;

/**
 * Connect to test database
 */
async function setupTestDatabase() {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zenshespa_database',
    port: process.env.DB_PORT || 4306
  });
  return connection;
}

/**
 * Close database connection
 */
async function closeTestDatabase() {
  if (connection) {
    await connection.end();
  }
}

/**
 * Clean all tables (use with caution!)
 */
async function cleanDatabase() {
  if (!connection) {
    throw new Error('Database connection not established');
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'referral_usage',
    'referral_codes',
    'store_order_items',
    'store_orders',
    'reservation_items',
    'reservations',
    'clients',
    'services',
    'categories_services',
    'products',
    'product_categories',
    'memberships',
    'utilisateurs'
  ];

  for (const table of tables) {
    try {
      await connection.query(`TRUNCATE TABLE ${table}`);
    } catch (error) {
      console.warn(`Could not truncate table ${table}:`, error.message);
    }
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Insert a test client
 */
async function insertTestClient(clientData) {
  const {
    nom = 'Test',
    prenom = 'User',
    email = 'test@example.com',
    telephone = '+216 20 000 000',
    date_naissance = '1990-01-01',
    adresse = 'Test Address',
    mot_de_passe = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7H8z.dqpW6',
    email_verifie = true,
    statut = 'actif',
    langue_preferee = 'fr',
    actif = true
  } = clientData;

  const [result] = await connection.query(
    `INSERT INTO clients 
     (nom, prenom, email, telephone, date_naissance, adresse, 
      mot_de_passe, email_verifie, statut, langue_preferee, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nom, prenom, email, telephone, date_naissance, adresse, 
     mot_de_passe, email_verifie, statut, langue_preferee, actif]
  );

  return result.insertId;
}

/**
 * Insert a test service
 */
async function insertTestService(serviceData) {
  const {
    nom = 'Test Service',
    description = 'Test description',
    service_type = 'base',
    categorie_id = 1,
    prix = 100.00,
    duree = 60,
    actif = true
  } = serviceData;

  const [result] = await connection.query(
    `INSERT INTO services 
     (nom, description, service_type, categorie_id, prix, duree, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nom, description, service_type, categorie_id, prix, duree, actif]
  );

  return result.insertId;
}

/**
 * Insert a test service category
 */
async function insertTestServiceCategory(categoryData) {
  const {
    nom = 'Test Category',
    description = 'Test category description',
    couleur_theme = '#000000',
    actif = true
  } = categoryData;

  const [result] = await connection.query(
    `INSERT INTO categories_services (nom, description, couleur_theme, actif)
     VALUES (?, ?, ?, ?)`,
    [nom, description, couleur_theme, actif]
  );

  return result.insertId;
}

/**
 * Insert a test reservation
 */
async function insertTestReservation(reservationData) {
  const {
    client_id,
    service_id,
    date_reservation = '2024-02-15',
    heure_debut = '10:00:00',
    heure_fin = '11:00:00',
    statut = 'en_attente',
    reservation_status = 'reserved',
    prix_service = 100.00,
    prix_final = 100.00
  } = reservationData;

  const [result] = await connection.query(
    `INSERT INTO reservations 
     (client_id, service_id, date_reservation, heure_debut, heure_fin, 
      statut, reservation_status, prix_service, prix_final)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client_id, service_id, date_reservation, heure_debut, heure_fin, 
     statut, reservation_status, prix_service, prix_final]
  );

  return result.insertId;
}

/**
 * Insert a test membership
 */
async function insertTestMembership(membershipData) {
  const {
    nom = 'Test Membership',
    prix_mensuel = 50.00,
    prix_3_mois = 135.00,
    services_par_mois = 2,
    description = 'Test membership',
    avantages = 'Test benefits',
    actif = true
  } = membershipData;

  const [result] = await connection.query(
    `INSERT INTO memberships 
     (nom, prix_mensuel, prix_3_mois, services_par_mois, description, avantages, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nom, prix_mensuel, prix_3_mois, services_par_mois, description, avantages, actif]
  );

  return result.insertId;
}

/**
 * Insert a test referral code
 */
async function insertTestReferralCode(codeData) {
  const {
    code = 'TEST1234',
    owner_client_id,
    discount_percentage = 10.00,
    max_uses = null,
    current_uses = 0,
    is_active = true,
    expires_at = null
  } = codeData;

  const [result] = await connection.query(
    `INSERT INTO referral_codes 
     (code, owner_client_id, discount_percentage, max_uses, current_uses, is_active, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, owner_client_id, discount_percentage, max_uses, current_uses, is_active, expires_at]
  );

  return result.insertId;
}

/**
 * Insert a test product
 */
async function insertTestProduct(productData) {
  const {
    name = 'Test Product',
    description = 'Test product description',
    price = 100.00,
    category_id = 1,
    is_preorder = true,
    estimated_delivery_days = 14,
    active = true
  } = productData;

  const [result] = await connection.query(
    `INSERT INTO products 
     (name, description, price, category_id, is_preorder, estimated_delivery_days, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, category_id, is_preorder, estimated_delivery_days, active]
  );

  return result.insertId;
}

/**
 * Insert a test product category
 */
async function insertTestProductCategory(categoryData) {
  const {
    name = 'Test Category',
    description = 'Test category description',
    active = true
  } = categoryData;

  const [result] = await connection.query(
    `INSERT INTO product_categories (name, description, active)
     VALUES (?, ?, ?)`,
    [name, description, active]
  );

  return result.insertId;
}

/**
 * Get current connection
 */
function getConnection() {
  return connection;
}

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  cleanDatabase,
  insertTestClient,
  insertTestService,
  insertTestServiceCategory,
  insertTestReservation,
  insertTestMembership,
  insertTestReferralCode,
  insertTestProduct,
  insertTestProductCategory,
  getConnection
};
