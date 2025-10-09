/**
 * Jotform Data Service
 * 
 * This service handles all Jotform data operations including:
 * - Fetching submissions from Jotform API
 * - Formatting and parsing submission data
 * - Field mapping and extraction (from your standalone server.js)
 * 
 * NO HTML/CSS rendering - just pure data operations
 * Frontend handles all presentation
 */

const axios = require('axios');
const jotformConfig = require('../config/jotform');

// Comprehensive Field Mapping - From your standalone server.js
const FIELD_MAPPING = {
  5: { label: '[INFO] Formulaire post-partum', questions: [] },
  9: { label: 'Nom Cliente', questions: [] },
  10: { label: 'Adresse Mail Cliente', questions: [] },
  11: { label: 'Numéro Téléphone (optionnel)', questions: [] },
  12: { label: 'Adresse (optionnel)', questions: [] },
  13: { label: 'Date de Naissance', questions: [] },
  16: { label: 'Prenom de la Praticienne', questions: [] },
  17: { label: 'Compagnie (optionnel)', questions: [] },
  18: { label: 'Adresse Mail de la Praticienne', questions: [] },
  24: { label: 'Organes reproducteurs à la naissance', questions: [] },
  25: { label: 'Modifications anatomiques génitales', questions: [] },
  26: { label: 'Pronoms préférés', questions: [] },
  32: { label: 'Contre-Indications Saignements Utérins', questions: ["Avez-vous actuellement vos règles ou des saignements frais (spotting) en cours de couleur rouge vive ?","Avez-vous eu des pertes de sang légères et fraîches au cours des dernières 24 heures ?","Avez-vous eu des saignements abondants spontanés au cours des 3 derniers mois ?","Avez-vous eu deux cycles menstruels par mois (c.-à-d. un cycle tous les 19 jours ou moins) au cours des 3 derniers mois ?"] },
  33: { label: 'Contre-Indications Grossesse', questions: ["Êtes-vous enceinte ?","Y a-t-il une possibilité que vous soyez enceinte ?","Si vous suivez un traitement de fertilité, avez-vous déjà ovulé ou reçu un transfert (IAC/FIV) ?"] },
  34: { label: 'Informations Complémentaires (Contre-Indications Majeures)', questions: [] },
  36: { label: 'Contre-Indications Médicales', questions: ["Avez-vous subi une coagulation tubaire (brûlure des trompes de Fallope par laparoscopie via le nombril) ?","Avez-vous un implant contraceptif dans le bras ou un patch (par exemple Nexplanon) ?","Avez-vous eu une ablation de l'endomètre (procédure où les parois de l'utérus sont brûlées pour provoquer une cicatrisation) ?","Êtes-vous à moins de 6 semaines d'une chirurgie ?","Avez-vous subi une embolisation de fibrome utérin ?","Portez-vous un anneau vaginal contraceptif (type NuvaRing) ?"] },
  37: { label: 'Contre-Indication Chaleur', questions: ["Avez-vous une infection génitale ou rectale accompagnée d'une sensation de brûlure ?"] },
  38: { label: 'Informations Complémentaires (Chaleur)', questions: [] },
  40: { label: 'Sensibilités Saignements Utérins', questions: ["Vos cycles menstruels sont-ils actuellement, ou ont-ils déjà été dans le passé, de 27 jours ou moins ?","Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois (il y a 3 mois ou plus dans le passé) ?"] },
  41: { label: 'Sensibilités Médicales', questions: ["Avez-vous un stérilet (DIU) ?"] },
  42: { label: 'Sensibilités Chaleur', questions: ["Avez-vous eu des bouffées de chaleur au cours du dernier mois ?","Avez-vous eu des sueurs nocturnes au cours du dernier mois ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, des mycoses vaginales ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, une vaginose bactérienne ?","Avez-vous actuellement, ou avez-vous déjà eu au passé, des infections urinaires (infections de la vessie) ?","Avez-vous de l'herpès actif ou dormant ?"] },
  43: { label: 'Sensibilité Age', questions: ["Avez-vous 13 ans ou moins ?"] },
  44: { label: 'Nouvelle Utilisatrice', questions: ["Est-ce votre première séance de vapeur ?"] },
  45: { label: 'Informations Complémentaires (Sensibilités Vapeur)', questions: [] },
  48: { label: 'Raison absence des règles', questions: [] },
  49: { label: 'Informations Complémentaires (Absence Règles)', questions: [] },
  52: { label: 'Indications Plantes Hydratantes', questions: ["Avez-vous une sécheresse vaginale ?","Avez-vous eu récemment des bouffées de chaleur ?","Avez-vous eu récemment des sueurs nocturnes ?","Avez-vous une infection génitale sèche (sans pertes) ?","Fait-il très chaud en ce moment ?","Avez-vous une aversion pour la chaleur ?","Votre corps dégage-t-il facilement de la chaleur ?"] },
  53: { label: 'Indications Plantes Hémostatiques', questions: ["Avez-vous des cycles menstruels de 27 jours ou moins ?","Au cours du dernier mois, avez-vous eu des pertes de sang fraîches avant ou le jour 27 de votre cycle ?","Au cours des 3 derniers mois, avez-vous eu des saignements prolongés (10 jours ou plus de sang frais) ?","Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois ?","Avez-vous 12 ans ou moins ?"] },
  54: { label: 'Indications Plantes Désinfectantes', questions: ["Avez-vous des pertes vaginales vertes ?","Avez-vous des pertes vaginales jaunes ?","Avez-vous des pertes vaginales blanches ?","Avez-vous des pertes vaginales épaisses ?","Avez-vous des pertes malodorantes (mauvaise odeur)?"] },
  55: { label: 'Indications Plantes Dépuratives', questions: ["Vos cycles menstruels durent-ils 28 jours ou plus ?","Votre cycle menstruel est-il absent pour une raison connue ou inconnue ? Ou êtes-vous une personne non menstruatrice (née sans utérus) ?","Prenez-vous actuellement la pilule contraceptive ?"] },
  56: { label: 'Allergies connues ou suspectées', questions: [] },
  59: { label: 'Indicateurs Enveloppement', questions: ["Avez-vous des bouffées de chaleur ?","Avez-vous des sueurs nocturnes ?","Votre corps dégage-t-il facilement de la chaleur ?","Avez-vous tendance à avoir des infections ou virus génitaux ?","Fait-il actuellement très chaud ?","Avez-vous une aversion pour la chaleur ?"] },
  60: { label: 'Informations Complémentaires (Enveloppement)', questions: [] },
  63: { label: 'Confirmation réception recommandations', questions: [] },
  68: { label: 'Signature manuscrite', questions: [] },
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
  131: { label: 'Date du Formulaire', questions: [] },
  132: { label: 'Date de Signature', questions: [] },
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
  167: { label: 'Anatomie médicale naissance', questions: [] }
};

class JotformDataService {
  constructor() {
    this.apiKey = jotformConfig.apiKey;
    this.apiUrl = jotformConfig.apiUrl;
    this.formId = jotformConfig.formId;
    this.enabled = jotformConfig.enabled;
  }

  /**
   * Check if Jotform integration is enabled
   */
  isEnabled() {
    return this.enabled && this.apiKey && this.formId;
  }

  /**
   * Get configuration
   */
  getConfig() {
    return {
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      formId: this.formId,
      enabled: this.enabled
    };
  }

  /**
   * Extract field value safely - YOUR CODE
   */
  extractFieldValue(answers, fieldId, subField = null) {
    const field = answers[fieldId];
    if (!field || !field.answer) return null;
    
    const answer = field.answer;
    
    // If a specific subField is requested
    if (subField && typeof answer === 'object') {
      return answer[subField] || null;
    }
    
    // Handle different object types
    if (typeof answer === 'object') {
      // Handle name fields
      if (answer.first !== undefined || answer.last !== undefined) {
        return `${answer.first || ''} ${answer.last || ''}`.trim();
      }
      
      // Handle bracket notation name fields
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
      
      // Handle date objects
      if (answer.year !== undefined && answer.month !== undefined && answer.day !== undefined) {
        return `${answer.year}-${String(answer.month).padStart(2, '0')}-${String(answer.day).padStart(2, '0')}`;
      }
      
      // Single field object
      const entries = Object.entries(answer).filter(([k, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 1) {
        return entries[0][1];
      } else if (entries.length > 1) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      
      return null;
    }
    
    // Return simple values as-is
    return answer;
  }

  /**
   * Format field for display - YOUR CODE
   * Returns structured data, not HTML (frontend handles rendering)
   */
  formatFieldDisplay(answers, fieldId) {
    const field = answers[fieldId];
    const mapping = FIELD_MAPPING[fieldId];
    
    if (!field || !field.answer) {
      return { type: 'empty', value: null };
    }
    
    const answer = field.answer;
    
    // Handle name fields
    if (typeof answer === 'object' && (answer.first || answer.last)) {
      return { 
        type: 'text', 
        value: `${answer.first || ''} ${answer.last || ''}`.trim() 
      };
    }
    
    // Handle date fields
    if (typeof answer === 'object' && answer.year) {
      return { 
        type: 'date', 
        value: `${answer.year}-${String(answer.month).padStart(2, '0')}-${String(answer.day).padStart(2, '0')}` 
      };
    }
    
    // Handle phone fields
    if (typeof answer === 'object' && answer.full) {
      return { type: 'phone', value: answer.full };
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
      return { 
        type: 'address', 
        value: parts.length > 0 ? parts.join(', ') : null 
      };
    }
    
    // Handle checkbox arrays
    if (Array.isArray(answer)) {
      return { type: 'array', value: answer };
    }
    
    // Handle matrix objects
    if (typeof answer === 'object' && mapping && mapping.questions && mapping.questions.length > 0) {
      const matrixData = Object.entries(answer).map(([question, value]) => ({
        question,
        answer: value
      }));
      return { type: 'matrix', value: matrixData };
    }
    
    // Handle generic objects
    if (typeof answer === 'object') {
      const entries = Object.entries(answer).filter(([k, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) {
        return { type: 'empty', value: null };
      }
      return { 
        type: 'object', 
        value: entries.map(([key, val]) => ({
          key: key.replace(/\[/g, ' ').replace(/\]/g, '').replace(/_/g, ' ').trim(),
          value: val
        }))
      };
    }
    
    // Default: simple text
    return { type: 'text', value: answer };
  }

  /**
   * Get submission from Jotform API
   */
  async getSubmission(submissionId) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled');
      }

      const url = `${this.apiUrl}/submission/${submissionId}?apiKey=${this.apiKey}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.content) {
        return response.data.content;
      }
      
      throw new Error('Invalid response from Jotform API');
    } catch (error) {
      console.error('Error fetching submission:', error.message);
      throw error;
    }
  }

  /**
   * Parse submission into structured data - NO HTML
   */
  async parseSubmission(submissionId) {
    try {
      const rawSubmission = await this.getSubmission(submissionId);
      const answers = rawSubmission.answers;
      
      // Extract all fields using field mapping
      const fields = {};
      Object.keys(FIELD_MAPPING).forEach(fieldId => {
        const mapping = FIELD_MAPPING[fieldId];
        const fieldData = this.formatFieldDisplay(answers, fieldId);
        
        if (fieldData.value !== null) {
          fields[fieldId] = {
            label: mapping.label,
            questions: mapping.questions,
            data: fieldData
          };
        }
      });
      
      return {
        submissionId: rawSubmission.id,
        formId: rawSubmission.form_id,
        status: rawSubmission.status,
        createdAt: rawSubmission.created_at,
        updatedAt: rawSubmission.updated_at,
        ip: rawSubmission.ip,
        fields: fields,
        raw: rawSubmission // Include raw data for advanced use
      };
    } catch (error) {
      console.error('Error parsing submission:', error.message);
      throw error;
    }
  }

  /**
   * Submit form data to Jotform API - YOUR CODE
   */
  async submitFormData(formData) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled');
      }

      // Convert form data to JotForm API format
      const submission = {};
      
      Object.keys(formData).forEach(key => {
        if (key.startsWith('q') && key !== 'qid') {
          const match = key.match(/^q(\d+)/);
          if (match) {
            const questionId = match[1];
            
            if (key.includes('_')) {
              const fieldName = key.split('_')[1];
              if (!submission[`submission[${questionId}]`]) {
                submission[`submission[${questionId}]`] = {};
              }
              
              if (typeof formData[key] === 'object') {
                Object.keys(formData[key]).forEach(subKey => {
                  submission[`submission[${questionId}][${subKey}]`] = formData[key][subKey];
                });
              } else {
                submission[`submission[${questionId}][${fieldName}]`] = formData[key];
              }
            } else {
              if (typeof formData[key] === 'object') {
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
      
      // Submit to JotForm API
      const jotformUrl = `https://api.jotform.com/form/${this.formId}/submissions?apiKey=${this.apiKey}`;
      const urlEncodedData = new URLSearchParams();
      Object.keys(submission).forEach(key => {
        urlEncodedData.append(key, submission[key]);
      });
      
      const response = await axios.post(jotformUrl, urlEncodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true
      });
      
      const result = response.data;
      
      if (response.status === 200 && result.responseCode === 200) {
        return {
          success: true,
          submissionId: result.content.submissionID,
          message: 'Form submitted successfully'
        };
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error.message);
      throw error;
    }
  }

  /**
   * Get all submissions for the form
   */
  async getAllSubmissions(limit = 100, offset = 0) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled');
      }

      const url = `${this.apiUrl}/form/${this.formId}/submissions?apiKey=${this.apiKey}&limit=${limit}&offset=${offset}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.content) {
        return response.data.content;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching submissions:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new JotformDataService();
