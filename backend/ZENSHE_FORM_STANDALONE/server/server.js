import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// JotForm Configuration
const API_KEY = "6bf64d24968384e5983fb2090de7e7fc";
const FORM_ID = "251824851270052";

// Optional Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

console.log("🚀 Zenshe Backend Starting...");
console.log(`📋 Form ID: ${FORM_ID}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

// Comprehensive Field Mapping - Only actual data fields (no headers/page breaks)
const FIELD_MAPPING = {
  5: { label: '[INFO] Formulaire post-partum', questions: [] },
  9: { label: 'Nom Cliente', questions: [] },
  10: { label: 'Adresse Mail Cliente', questions: [] },
  11: { label: 'Numéro Téléphone (optionnel)', questions: [] },
  12: { label: 'Adresse (optionnel)', questions: [] },
  13: { label: 'Date de Naissance', questions: [] },
  // 14: Header "Details de Contact" - filtered out
  16: { label: 'Prenom de la Praticienne', questions: [] },
  17: { label: 'Compagnie (optionnel)', questions: [] },
  18: { label: 'Adresse Mail de la Praticienne', questions: [] },
  // 22: Header "Informations sur la Cliente" - filtered out
  24: { label: 'Organes reproducteurs à la naissance', questions: [] },
  25: { label: 'Modifications anatomiques génitales', questions: [] },
  26: { label: 'Pronoms préférés', questions: [] },
  // 30: Page Break - filtered out
  // 31: Header "Contre-Indications Majeures" - filtered out
  32: { label: 'Contre-Indications Saignements Utérins', questions: ["Avez-vous actuellement vos règles ou des saignements frais (spotting) en cours de couleur rouge vive ?","Avez-vous eu des pertes de sang légères et fraîches au cours des dernières 24 heures ?","Avez-vous eu des saignements abondants spontanés au cours des 3 derniers mois ?","Avez-vous eu deux cycles menstruels par mois (c.-à-d. un cycle tous les 19 jours ou moins) au cours des 3 derniers mois ?"] },
  33: { label: 'Contre-Indications Grossesse', questions: ["Êtes-vous enceinte ?","Y a-t-il une possibilité que vous soyez enceinte ?","Si vous suivez un traitement de fertilité, avez-vous déjà ovulé ou reçu un transfert (IAC/FIV) ?"] },
  34: { label: 'Informations Complémentaires (Contre-Indications Majeures)', questions: [] },
  // 35: Header "Contre-Indications Douces" - filtered out
  36: { label: 'Contre-Indications Médicales', questions: ["Avez-vous subi une coagulation tubaire (brûlure des trompes de Fallope par laparoscopie via le nombril) ?","Avez-vous un implant contraceptif dans le bras ou un patch (par exemple Nexplanon) ?","Avez-vous eu une ablation de l'endomètre (procédure où les parois de l'utérus sont brûlées pour provoquer une cicatrisation) ?","Êtes-vous à moins de 6 semaines d'une chirurgie ?","Avez-vous subi une embolisation de fibrome utérin ?","Portez-vous un anneau vaginal contraceptif (type NuvaRing) ?"] },
  37: { label: 'Contre-Indication Chaleur', questions: ["Avez-vous une infection génitale ou rectale accompagnée d'une sensation de brûlure ?"] },
  38: { label: 'Informations Complémentaires (Chaleur)', questions: [] },
  // 39: Header "Sensibilites Liees a La Vapeur" - filtered out
  40: { label: 'Sensibilités Saignements Utérins', questions: ["Vos cycles menstruels sont-ils actuellement, ou ont-ils déjà été dans le passé, de 27 jours ou moins ?","Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois (il y a 3 mois ou plus dans le passé) ?"] },
  41: { label: 'Sensibilités Médicales', questions: ["Avez-vous un stérilet (DIU) ?"] },
  42: { label: 'Sensibilités Chaleur', questions: ["Avez-vous eu des bouffées de chaleur au cours du dernier mois ?","Avez-vous eu des sueurs nocturnes au cours du dernier mois ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, des mycoses vaginales ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, une vaginose bactérienne ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, des infections urinaires (infections de la vessie) ?","Avez-vous de l'herpès actif ou dormant ?"] },
  43: { label: 'Sensibilité Age', questions: ["Avez-vous 13 ans ou moins ?"] },
  44: { label: 'Nouvelle Utilisatrice', questions: ["Est-ce votre première séance de vapeur ?"] },
  45: { label: 'Informations Complémentaires (Sensibilités Vapeur)', questions: [] },
  // 46: Page Break - filtered out
  // 47: Header "Absence De Regles" - filtered out
  48: { label: 'Raison absence des règles', questions: [] },
  49: { label: 'Informations Complémentaires (Absence Règles)', questions: [] },
  // 50: Page Break - filtered out
  // 51: Header "Choix Des Plantes" - filtered out
  52: { label: 'Indications Plantes Hydratantes', questions: ["Avez-vous une sécheresse vaginale ?","Avez-vous eu récemment des bouffées de chaleur ?","Avez-vous eu récemment des sueurs nocturnes ?","Avez-vous une infection génitale sèche (sans pertes) ?","Fait-il très chaud en ce moment ?","Avez-vous une aversion pour la chaleur ?","Votre corps dégage-t-il facilement de la chaleur ?"] },
  53: { label: 'Indications Plantes Hémostatiques', questions: ["Avez-vous des cycles menstruels de 27 jours ou moins ?","Au cours du dernier mois, avez-vous eu des pertes de sang fraîches avant ou le jour 27 de votre cycle ?","Au cours des 3 derniers mois, avez-vous eu des saignements prolongés (10 jours ou plus de sang frais) ?","Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois ?","Avez-vous 12 ans ou moins ?"] },
  54: { label: 'Indications Plantes Désinfectantes', questions: ["Avez-vous des pertes vaginales vertes ?","Avez-vous des pertes vaginales jaunes ?","Avez-vous des pertes vaginales blanches ?","Avez-vous des pertes vaginales épaisses ?","Avez-vous des pertes malodorantes (mauvaise odeur)?"] },
  55: { label: 'Indications Plantes Dépuratives', questions: ["Vos cycles menstruels durent-ils 28 jours ou plus ?","Votre cycle menstruel est-il absent pour une raison connue ou inconnue ? Ou êtes-vous une personne non menstruatrice (née sans utérus) ?","Prenez-vous actuellement la pilule contraceptive ?"] },
  56: { label: 'Allergies connues ou suspectées', questions: [] },
  // 57: Page Break - filtered out
  // 58: Header "Enveloppement" - filtered out
  59: { label: 'Indicateurs Enveloppement', questions: ["Avez-vous des bouffées de chaleur ?","Avez-vous des sueurs nocturnes ?","Votre corps dégage-t-il facilement de la chaleur ?","Avez-vous tendance à avoir des infections ou virus génitaux ?","Fait-il actuellement très chaud ?","Avez-vous une aversion pour la chaleur ?"] },
  60: { label: 'Informations Complémentaires (Enveloppement)', questions: [] },
  // 61: Header "Recommandations avant la Seance" - filtered out
  63: { label: 'Confirmation réception recommandations', questions: [] },
  // 64: Page Break - filtered out
  // 65: Header "FORMULAIRE DE CONSENTEMENT" - filtered out
  68: { label: 'Signature manuscrite', questions: [] },
  // 69: Header "Fin de La Section Cliente" - filtered out
  // 70: Page Break - filtered out
  // 76: Button "Envoyer a la Praticienne" - filtered out
  // 80: Info text - filtered out
  // 81: Header "Section Praticienne" - filtered out
  // 82: Page Break - filtered out
  // 83: Header "Protocol De Vapeur" - filtered out
  84: { label: 'Indication pour la vapeur', questions: [] },
  85: { label: 'Recommandation Contre-Indication', questions: [] },
  87: { label: 'Notes Praticienne', questions: [] },
  88: { label: 'Type de Contre-Indication', questions: [] },
  89: { label: 'Sensibilités à la Vapeur', questions: [] },
  90: { label: 'Configuration Séance Vapeur', questions: [] },
  91: { label: 'Durée Séance Vapeur', questions: [] },
  92: { label: 'Enveloppement', questions: [] },
  96: { label: 'Recommandation Planning Séances', questions: [] },
  98: { label: 'Orientations / Références', questions: [] },
  99: { label: 'Notes Coordonnées Orientation', questions: [] },
  100: { label: 'Notes de la Praticienne', questions: [] },
  // 106: Info text - filtered out
  // 126: Button "Envoyer" - filtered out
  131: { label: 'Date du Formulaire', questions: [] },
  132: { label: 'Date de Signature', questions: [] },
  // 133: Page Break - filtered out
  // 135: Widget - filtered out
  // 146: Page Break - filtered out
  // 149: Page Break - filtered out
  // 150: Header "Questionnaire de Vapeur" - filtered out
  151: { label: 'Expérience avec vapeur périnéale', questions: [] },
  152: { label: 'Principal souci à aborder', questions: [] },
  155: { label: 'Options de suivi', questions: [] },
  156: { label: 'Programme personnalisé', questions: [] },
  157: { label: 'Lieu séances vapeur', questions: [] },
  158: { label: 'Recommandations souhaitées', questions: [] },
  159: { label: 'Autres informations / Questions', questions: [] },
  160: { label: 'Formule Plantes Vapeur', questions: [] },
  161: { label: 'Ressources Vapeur', questions: [] },
  166: { label: 'Signature parent/tuteur (si <18 ans)', questions: [] },
  167: { label: 'Anatomie médicale naissance', questions: [] },
  // 168: Header "Formulaire d'Admission" - filtered out
  // 175: Long info text - filtered out
};

// Helper function to safely extract field values
function extractFieldValue(answers, fieldId, subField = null) {
  const field = answers[fieldId];
  if (!field || !field.answer) return null;
  
  const answer = field.answer;
  
  // If a specific subField is requested
  if (subField && typeof answer === 'object') {
    return answer[subField] || null;
  }
  
  // Handle different object types BEFORE returning to prevent [object Object]
  if (typeof answer === 'object') {
    // Handle name fields (check for various name field formats)
    if (answer.first !== undefined || answer.last !== undefined) {
      return `${answer.first || ''} ${answer.last || ''}`.trim();
    }
    // Handle bracket notation name fields (nomCliente[first], nomCliente[last])
    const firstKey = Object.keys(answer).find(k => k.includes('[first'));
    const lastKey = Object.keys(answer).find(k => k.includes('[last'));
    if (firstKey || lastKey) {
      return `${answer[firstKey] || ''} ${answer[lastKey] || ''}`.trim();
    }
    
    // Handle phone fields
    if (answer.full) {
      return answer.full;
    }
    
    // Handle address fields
    if (answer.addr_line1 || answer.city || answer.postal) {
      const parts = [
        answer.addr_line1,
        answer.addr_line2,
        answer.city,
        answer.state,
        answer.postal
      ].filter(Boolean);
      return parts.join(', ');
    }
    
    // Handle date objects (with year, month, day keys)
    if (answer.year !== undefined && answer.month !== undefined && answer.day !== undefined) {
      return `${answer.year}-${String(answer.month).padStart(2, '0')}-${String(answer.day).padStart(2, '0')}`;
    }
    
    // For other objects, check if it's a single field value wrapped in object
    const entries = Object.entries(answer).filter(([k, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length === 1) {
      // Single field - just return the value without the key
      return entries[0][1];
    } else if (entries.length > 1) {
      // Multiple fields - format as key-value pairs
      return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    
    return null;
  }
  
  // Return simple values as-is
  return answer;
}

// Helper function to format date from JotForm
function formatJotFormDate(answers, fieldId) {
  const field = answers[fieldId];
  if (!field || !field.answer) return null;
  
  if (typeof field.answer === 'object' && field.answer.year) {
    const { year, month, day } = field.answer;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  return field.answer;
}

// Format field value for display
function formatFieldDisplay(answers, fieldId) {
  const field = answers[fieldId];
  const mapping = FIELD_MAPPING[fieldId];
  
  if (!field || !field.answer) return '<span class="no-data">Non fourni</span>';
  
  const answer = field.answer;
  
  // Handle name fields
  if (typeof answer === 'object' && (answer.first || answer.last)) {
    return `${answer.first || ''} ${answer.last || ''}`.trim();
  }
  
  // Handle date fields
  if (typeof answer === 'object' && answer.year) {
    return `${answer.year}-${String(answer.month).padStart(2, '0')}-${String(answer.day).padStart(2, '0')}`;
  }
  
  // Handle phone fields
  if (typeof answer === 'object' && answer.full) {
    return answer.full;
  }
  
  // Handle address fields
  if (typeof answer === 'object' && (answer.addr_line1 || answer.city || answer.postal)) {
    const parts = [
      answer.addr_line1,
      answer.addr_line2,
      answer.city,
      answer.state,
      answer.postal
    ].filter(Boolean);
    return parts.join(', ') || '<span class="no-data">Adresse incomplète</span>';
  }
  
  // Handle checkbox arrays
  if (Array.isArray(answer)) {
    // Regular checkbox array - just join values
    return answer.join(', ');
  }
  
  // Handle matrix objects
  if (typeof answer === 'object' && mapping && mapping.questions && mapping.questions.length > 0) {
    // JotForm returns matrix answers as objects where keys are the question text itself
    // Example: { "Êtes-vous enceinte ?": "Non", "Y a-t-il...": "Non" }
    return Object.entries(answer).map(([questionKey, val]) => {
      // The key IS the question text, use it directly
      return `<strong>${questionKey}:</strong> ${val}`;
    }).join('<br>');
  }
  
  // Handle generic objects - format them nicely instead of [object Object]
  if (typeof answer === 'object') {
    // Check if object has meaningful data
    const entries = Object.entries(answer);
    if (entries.length === 0) {
      return '<span class="no-data">Vide</span>';
    }
    
    // Format as readable key-value pairs
    return entries
      .filter(([key, val]) => val !== null && val !== undefined && val !== '')
      .map(([key, val]) => {
        // Clean up the key (remove array brackets, underscores, etc.)
        const cleanKey = key.replace(/\[/g, ' ').replace(/\]/g, '').replace(/_/g, ' ').trim();
        return `<strong>${cleanKey}:</strong> ${val}`;
      })
      .join('<br>') || '<span class="no-data">Aucune donnée</span>';
  }
  
  // Default: return answer as is
  return answer;
}

// Telegram notification function
async function sendTelegramNotification(submissionData) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("🤖 Telegram not configured, skipping notification.");
    return;
  }

  try {
    const message = `🌿 NOUVELLE SOUMISSION ZENSHE

👤 CLIENT: ${submissionData.firstName} ${submissionData.lastName}
📧 Email: ${submissionData.email}
📞 Téléphone: ${submissionData.phone || 'N/A'}
🎂 Date de naissance: ${submissionData.birthDate || 'N/A'}

👩‍⚕️ PRATICIEN: ${submissionData.practitionerName || 'N/A'}
📧 Email Praticien: ${submissionData.practitionerEmail || 'N/A'}

📅 Date soumission: ${submissionData.submissionDate}
🆔 ID JotForm: ${submissionData.submissionId}

🔍 Voir tous les détails: http://localhost:${PORT}/submission/${submissionData.submissionId}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });
    
    console.log("📱 Telegram notification sent successfully");
  } catch (err) {
    console.error("❌ Telegram notification failed:", err.message);
  }
}

// Main route - serve the actual JotForm HTML
app.get("/", (req, res) => {
  res.send(`
    <h2>🌿 Zenshe Steam Therapy Backend</h2>
    <div style="max-width:600px;margin:auto;padding:2em;background:#f9f9f9;border-radius:8px;">
      <h3>✅ Backend Active</h3>
      <p><strong>Form ID:</strong> ${FORM_ID}</p>
      <p><strong>Webhook URL:</strong> <code>http://localhost:${PORT}/webhook</code></p>
      
      <h4>📡 Features:</h4>
      <ul>
        <li>✅ Comprehensive JotForm API integration</li>
        <li>✅ All form fields extracted from source code</li>
        <li>✅ Real-time submissions viewing</li>
        <li>✅ Telegram notifications (optional)</li>
        <li>✅ No local database needed - uses JotForm API</li>
      </ul>
      
      <div style="margin-top:20px;">
        <a href="/form" style="background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">📝 OPEN FORM</a>
        <a href="/submissions" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;margin-left:10px;">📋 View Submissions</a>
        <a href="/webhook" style="background:#6c757d;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;margin-left:10px;">🔌 Webhook</a>
      </div>
    </div>
  `);
});

// Serve the actual JotForm HTML source code as-is
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/form", (req, res) => {
  try {
    const formHtml = fs.readFileSync(path.join(__dirname, 'jotform_zenshe_form.html'), 'utf8');
    res.send(formHtml);
  } catch (error) {
    res.status(500).send(`
      <h3>Error loading form</h3>
      <p>Could not load the JotForm source code file.</p>
      <p>Error: ${error.message}</p>
      <a href="/">Back to Home</a>
    `);
  }
});

// Webhook handler - receives JotForm submissions
app.post('/webhook', async (req, res) => {
  try {
    console.log("📩 JotForm webhook received:", JSON.stringify(req.body, null, 2));
    
    const formData = req.body;
    if (!formData) {
      throw new Error("No form data received");
    }

    // Extract basic submission info
    const submissionData = {
      submissionId: formData.submissionID || 'unknown',
      submissionDate: new Date().toISOString(),
      firstName: formData['q9_nomCliente']?.first || '',
      lastName: formData['q9_nomCliente']?.last || '',
      email: formData['q10_adresseMail10'] || '',
      phone: formData['q11_phoneNumber11']?.full || '',
      birthDate: formData['q13_dateDe'] ? 
        `${formData['q13_dateDe'].year}-${String(formData['q13_dateDe'].month).padStart(2, '0')}-${String(formData['q13_dateDe'].day).padStart(2, '0')}` : null,
      practitionerName: formData['q16_prenomDe'] || '',
      practitionerEmail: formData['q18_adresseMail'] || ''
    };

    console.log(`✅ Submission processed: ${submissionData.firstName} ${submissionData.lastName}`);
    
    // Send Telegram notification
    await sendTelegramNotification(submissionData);
    
    res.status(200).json({ 
      success: true, 
      submissionId: submissionData.submissionId,
      message: "Submission received and processed successfully"
    });
    
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get webhook endpoint info
app.get('/webhook', (req, res) => {
  res.json({
    message: "Zenshe JotForm Webhook Endpoint",
    method: "POST",
    formId: FORM_ID,
    status: "Active",
    endpoint: `http://localhost:${PORT}/webhook`
  });
});

// Get all submissions from JotForm API
app.get("/submissions", async (req, res) => {
  try {
    // Get limit from query parameter, default to 100 (JotForm API max per request)
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(`📡 Fetching submissions from JotForm API (limit: ${limit}, offset: ${offset})...`);
    
    const response = await fetch(
      `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=${limit}&offset=${offset}&orderby=created_at`
    );
    
    if (!response.ok) {
      throw new Error(`JotForm API error: ${response.status}`);
    }
    
    const data = await response.json();
    const totalSubmissions = data.resultSet?.count || 0;
    
    // DEBUG: Log all field IDs from first submission
    if (data.content && data.content.length > 0) {
      const firstSubmission = data.content[0];
      const fieldIds = Object.keys(firstSubmission.answers || {});
      console.log('🔍 DEBUG: All field IDs in submission:', fieldIds.sort((a, b) => a - b));
      console.log('🔍 DEBUG: Total fields in submission:', fieldIds.length);
    }
    
    let html = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
      .container { max-width: 1200px; margin: 0 auto; }
      .submission { background: white; margin: 15px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background: #007bff; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
      .section { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff; }
      .field { margin: 8px 0; }
      .field strong { color: #495057; }
      .no-data { color: #6c757d; font-style: italic; }
      .btn { background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; float: right; }
      .btn:hover { background: #c82333; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background: #f8f9fa; }
    </style>
    
    <div class="container">
      <h1>🌿 Soumissions Zenshe (JotForm API)</h1>
      <p>📊 Total dans la base JotForm: <strong>${totalSubmissions}</strong> soumissions</p>
      <p>📋 Affichées sur cette page: <strong>${data.content?.length || 0}</strong> soumissions (limite: ${limit})</p>
      ${totalSubmissions > limit ? `<p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px;">⚠️ <strong>Attention:</strong> Il y a ${totalSubmissions} soumissions au total, mais seulement ${limit} sont affichées. <a href="/submissions?limit=1000">Afficher jusqu'à 1000</a> | <a href="/submissions/all">Afficher TOUTES les soumissions</a></p>` : ''}
      <p>🔄 <a href="/submissions">Actualiser</a> | <a href="/">🏠 Accueil</a></p>
    `;

    if (data.content && data.content.length > 0) {
      for (const submission of data.content) {
        const answers = submission.answers || {};
        const created = new Date(submission.created_at).toLocaleString('fr-FR');
        
        // Extract comprehensive data based on actual form structure
        // Handle name field - check if it's an object with first/last or a single value
        let firstName = '';
        let lastName = '';
        const nameField = answers[9];
        if (nameField && nameField.answer) {
          if (typeof nameField.answer === 'object') {
            // Object with first/last keys
            firstName = nameField.answer.first || nameField.answer['nomCliente[first'] || '';
            lastName = nameField.answer.last || nameField.answer['nomCliente[last'] || '';
          } else {
            // Single string value - split it
            const nameParts = String(nameField.answer).split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
        }
        
        const clientData = {
          firstName: firstName,
          lastName: lastName,
          email: extractFieldValue(answers, 10),
          phone: extractFieldValue(answers, 11, 'full') || extractFieldValue(answers, 11),
          birthDate: formatJotFormDate(answers, 13),
          address: extractFieldValue(answers, 12),
          practitionerName: extractFieldValue(answers, 16),
          practitionerCompany: extractFieldValue(answers, 17),
          practitionerEmail: extractFieldValue(answers, 18),
          anatomy: extractFieldValue(answers, 20),
          pronouns: extractFieldValue(answers, 23),
          steamExperience: extractFieldValue(answers, 87),
          mainConcern: extractFieldValue(answers, 99),
          otherInfo: extractFieldValue(answers, 100),
          practitionerNotes: extractFieldValue(answers, 152),
          finalNotes: extractFieldValue(answers, 161)
        };

        html += `<div class="submission">`;
        
        // Header
        html += `<div class="header">
          <h3>👤 ${clientData.firstName} ${clientData.lastName}</h3>
          <small>📅 Soumis le: ${created} | 🆔 ID: ${submission.id}</small>
        </div>`;
        
        // Client Information
        html += `<div class="section">
          <h4>📋 Informations Client</h4>
          <div class="field"><strong>Email:</strong> ${clientData.email || '<span class="no-data">Non fourni</span>'}</div>
          <div class="field"><strong>Téléphone:</strong> ${clientData.phone || '<span class="no-data">Non fourni</span>'}</div>
          <div class="field"><strong>Date de naissance:</strong> ${clientData.birthDate || '<span class="no-data">Non fournie</span>'}</div>
          <div class="field"><strong>Anatomie:</strong> ${clientData.anatomy || '<span class="no-data">Non spécifiée</span>'}</div>
          <div class="field"><strong>Pronoms:</strong> ${clientData.pronouns || '<span class="no-data">Non spécifiés</span>'}</div>
        </div>`;
        
        // Practitioner Information
        if (clientData.practitionerName || clientData.practitionerEmail) {
          html += `<div class="section">
            <h4>👩‍⚕️ Informations Praticien</h4>
            <div class="field"><strong>Nom:</strong> ${clientData.practitionerName || '<span class="no-data">Non fourni</span>'}</div>
            <div class="field"><strong>Compagnie:</strong> ${clientData.practitionerCompany || '<span class="no-data">Non fournie</span>'}</div>
            <div class="field"><strong>Email:</strong> ${clientData.practitionerEmail || '<span class="no-data">Non fourni</span>'}</div>
          </div>`;
        }
        
        // Client Responses
        html += `<div class="section">
          <h4>💭 Réponses Client</h4>
          <div class="field"><strong>Expérience vapeur:</strong> ${clientData.steamExperience || '<span class="no-data">Non spécifiée</span>'}</div>
          <div class="field"><strong>Préoccupation principale:</strong> ${clientData.mainConcern || '<span class="no-data">Non spécifiée</span>'}</div>
          <div class="field"><strong>Autres informations:</strong> ${clientData.otherInfo || '<span class="no-data">Aucune</span>'}</div>
        </div>`;
        
        // Practitioner Notes
        if (clientData.practitionerNotes || clientData.finalNotes) {
          html += `<div class="section">
            <h4>📝 Notes Praticien</h4>
            <div class="field"><strong>Notes principales:</strong> ${clientData.practitionerNotes || '<span class="no-data">Aucune</span>'}</div>
            <div class="field"><strong>Notes finales:</strong> ${clientData.finalNotes || '<span class="no-data">Aucune</span>'}</div>
          </div>`;
        }
        
        // All Other Fields - Production Ready (filter out headers, page breaks, buttons)
        const displayedFields = [9, 10, 11, 12, 13, 16, 17, 18, 20, 23, 87, 99, 100, 152, 161];
        const headerAndBreakFields = [14, 22, 30, 31, 35, 39, 46, 47, 50, 51, 57, 58, 61, 64, 65, 69, 70, 76, 80, 81, 82, 83, 106, 126, 133, 135, 146, 149, 150, 168, 175];
        
        const otherFields = Object.keys(answers).filter(id => {
          const numId = parseInt(id);
          // Exclude fields already displayed AND headers/page breaks/buttons
          return !displayedFields.includes(numId) && !headerAndBreakFields.includes(numId);
        });
        
        if (otherFields.length > 0) {
          html += `<div class="section">
            <h4>📋 Informations Additionnelles</h4>`;
          
          for (const fieldId of otherFields) {
            const mapping = FIELD_MAPPING[fieldId];
            const label = mapping ? mapping.label : `Champ ${fieldId}`;
            const value = formatFieldDisplay(answers, fieldId);
            
            html += `<div class="field"><strong>${label}:</strong> ${value}</div>`;
          }
          
          html += `</div>`;
        }
        
        html += `</div>`;
      }
    } else {
      html += `<div class="submission">
        <p style="text-align: center; color: #6c757d;">Aucune soumission trouvée.</p>
      </div>`;
    }
    
    html += `</div>`;
    res.send(html);
    
  } catch (error) {
    console.error("❌ Failed to fetch submissions:", error);
    res.status(500).send(`
      <h3>Erreur de récupération des soumissions</h3>
      <p>Erreur: ${error.message}</p>
      <a href="/">Retour à l'accueil</a>
    `);
  }
});

// Get ALL submissions from JotForm API (with pagination)
app.get("/submissions/all", async (req, res) => {
  try {
    console.log("📡 Fetching ALL submissions from JotForm API...");
    
    // First, get the total count
    const countResponse = await fetch(
      `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=1`
    );
    
    if (!countResponse.ok) {
      throw new Error(`JotForm API error: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const totalSubmissions = countData.resultSet?.count || 0;
    
    console.log(`📊 Total submissions to fetch: ${totalSubmissions}`);
    
    if (totalSubmissions === 0) {
      return res.send(`
        <h3>Aucune soumission trouvée</h3>
        <a href="/">Retour à l'accueil</a>
      `);
    }
    
    // Fetch all submissions in batches of 100 (JotForm API limit)
    const allSubmissions = [];
    const batchSize = 100;
    const totalBatches = Math.ceil(totalSubmissions / batchSize);
    
    res.write(`
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .progress { background: #e9ecef; border-radius: 4px; height: 30px; margin: 20px 0; }
        .progress-bar { background: #007bff; height: 100%; border-radius: 4px; transition: width 0.3s; }
      </style>
      <h2>🌿 Récupération de TOUTES les soumissions...</h2>
      <p>Total à récupérer: <strong>${totalSubmissions}</strong> soumissions</p>
      <div class="progress"><div class="progress-bar" id="progress" style="width: 0%"></div></div>
      <p id="status">Démarrage...</p>
      <script>
        function updateProgress(current, total) {
          const percent = Math.round((current / total) * 100);
          document.getElementById('progress').style.width = percent + '%';
          document.getElementById('status').textContent = 'Batch ' + current + ' / ' + total + ' (' + percent + '%)';
        }
      </script>
    `);
    
    for (let i = 0; i < totalBatches; i++) {
      const offset = i * batchSize;
      console.log(`📦 Fetching batch ${i + 1}/${totalBatches} (offset: ${offset})...`);
      
      const response = await fetch(
        `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}&limit=${batchSize}&offset=${offset}&orderby=created_at`
      );
      
      if (!response.ok) {
        throw new Error(`JotForm API error on batch ${i + 1}: ${response.status}`);
      }
      
      const batchData = await response.json();
      allSubmissions.push(...(batchData.content || []));
      
      // Update progress
      res.write(`<script>updateProgress(${i + 1}, ${totalBatches});</script>`);
      
      // Small delay to avoid rate limiting
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Successfully fetched ${allSubmissions.length} submissions`);
    
    // Redirect to display all submissions
    res.write(`
      <script>
        setTimeout(function() {
          window.location.href = '/submissions?limit=999999&_cache=' + Date.now();
        }, 1000);
      </script>
      <p style="color: green;">✅ Récupération terminée! Redirection...</p>
    `);
    res.end();
    
  } catch (error) {
    console.error("❌ Failed to fetch all submissions:", error);
    res.status(500).send(`
      <h3>Erreur de récupération de toutes les soumissions</h3>
      <p>Erreur: ${error.message}</p>
      <a href="/submissions">Retour aux soumissions</a>
    `);
  }
});

// Get individual submission details
app.get("/submission/:id", async (req, res) => {
  try {
    const submissionId = req.params.id;
    console.log(`📡 Fetching submission ${submissionId} from JotForm API...`);
    
    const response = await fetch(
      `https://api.jotform.com/submission/${submissionId}?apiKey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`JotForm API error: ${response.status}`);
    }
    
    const data = await response.json();
    const submission = data.content;
    const answers = submission.answers || {};
    
    let html = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
      .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff; }
      .section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
      .field { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
      .field:last-child { border-bottom: none; }
      .field strong { color: #495057; min-width: 150px; display: inline-block; }
      .no-data { color: #6c757d; font-style: italic; }
    </style>
    
    <div class="container">
      <div class="header">
        <h1>🌿 Détails Soumission Zenshe</h1>
        <p><strong>ID:</strong> ${submissionId}</p>
        <p><strong>Date:</strong> ${new Date(submission.created_at).toLocaleString('fr-FR')}</p>
        <a href="/submissions">← Retour aux soumissions</a>
      </div>
    `;
    
    // Display all fields systematically
    html += `<div class="section">
      <h3>📋 Tous les Champs</h3>`;
    
    for (const [fieldId, field] of Object.entries(answers)) {
      const answer = typeof field.answer === 'object' ? JSON.stringify(field.answer) : field.answer;
      html += `<div class="field">
        <strong>Field ${fieldId}:</strong> ${answer || '<span class="no-data">Vide</span>'}
      </div>`;
    }
    
    html += `</div>`;
    html += `</div>`;
    
    res.send(html);
    
  } catch (error) {
    console.error("❌ Failed to fetch submission:", error);
    res.status(500).send(`
      <h3>Erreur de récupération de la soumission</h3>
      <p>Erreur: ${error.message}</p>
      <a href="/submissions">Retour aux soumissions</a>
    `);
  }
});

// 🆕 POST /submit-form - Handle form submission and forward to JotForm
app.post('/submit-form', async (req, res) => {
  console.log('📝 Form submission received');
  
  try {
    const formData = req.body;
    
    // Convert form data to JotForm API format
    const submission = {};
    
    // Extract all form fields (they come as q{id}_{fieldname} or just q{id})
    Object.keys(formData).forEach(key => {
      if (key.startsWith('q') && key !== 'qid') {
        // Extract question ID (e.g., "q5_name" -> "5")
        const match = key.match(/^q(\d+)/);
        if (match) {
          const questionId = match[1];
          
          // Handle different field types
          if (key.includes('_')) {
            // Sub-field (like name[first], name[last])
            const fieldName = key.split('_')[1];
            if (!submission[`submission[${questionId}]`]) {
              submission[`submission[${questionId}]`] = {};
            }
            
            // For complex fields like fullname, address, etc.
            if (typeof formData[key] === 'object') {
              Object.keys(formData[key]).forEach(subKey => {
                submission[`submission[${questionId}][${subKey}]`] = formData[key][subKey];
              });
            } else {
              submission[`submission[${questionId}][${fieldName}]`] = formData[key];
            }
          } else {
            // Simple field
            if (typeof formData[key] === 'object') {
              // Handle object fields (like fullname, address)
              Object.keys(formData[key]).forEach(subKey => {
                submission[`submission[${questionId}][${subKey}]`] = formData[key][subKey];
              });
            } else {
              submission[`submission[${questionId}]`] = formData[key];
            }
          }
        }
      }
    });
    
    console.log('📤 Submitting to JotForm API...');
    
    // Submit to JotForm API
    const jotformUrl = `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}`;
    
    // Convert submission object to URL-encoded format
    const urlEncodedData = new URLSearchParams();
    Object.keys(submission).forEach(key => {
      urlEncodedData.append(key, submission[key]);
    });
    
    const response = await fetch(jotformUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: urlEncodedData
    });
    
    const result = await response.json();
    
    if (response.ok && result.responseCode === 200) {
      console.log('✅ Form submitted successfully to JotForm');
      console.log(`📋 Submission ID: ${result.content.submissionID}`);
      
      res.json({
        success: true,
        message: 'Form submitted successfully!',
        submissionId: result.content.submissionID,
        redirectUrl: '/thank-you'
      });
    } else {
      console.error('❌ JotForm API error:', result);
      res.status(400).json({
        success: false,
        message: result.message || 'Submission failed',
        error: result
      });
    }
    
  } catch (error) {
    console.error('❌ Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during submission',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zenshe backend running on http://localhost:${PORT}`);
  console.log("✅ Ready to receive JotForm webhooks");
  console.log("✅ Ready to handle form submissions at /submit-form");
  console.log("🔗 Configure JotForm webhook URL: http://localhost:3001/webhook");
});