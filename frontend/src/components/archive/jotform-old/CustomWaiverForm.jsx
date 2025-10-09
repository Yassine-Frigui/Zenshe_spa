import { useState } from 'react';
import './CustomWaiverForm.css';

/**
 * CustomWaiverForm - Native React form based on JotForm fields
 * 
 * This replaces the JotForm iframe completely.
 * All data is collected locally and submitted to backend only.
 * No captcha, no external submissions, full control.
 */
function CustomWaiverForm({ 
  onFormDataReady,
  onError
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    // Client Information (Section 1)
    nomCliente: '',
    emailCliente: '',
    telephone: '',
    adresse: '',
    dateNaissance: '',
    
    // Practitioner Information
    prenomPraticienne: '',
    compagnie: '',
    emailPraticienne: '',
    
    // Client Identity Information
    organesReproducteurs: '',
    modificationsAnatomiques: '',
    pronoms: '',
    
    // Major Contraindications - Bleeding
    contreSaignements: [],
    
    // Major Contraindications - Pregnancy
    contreGrossesse: [],
    
    // Additional Info - Major Contraindications
    infoContreIndicationsMajeures: '',
    
    // Soft Contraindications - Medical
    contreMedicales: [],
    
    // Soft Contraindications - Heat
    contreChaleur: [],
    
    // Additional Info - Heat
    infoContreChaleur: '',
    
    // Sensitivities - Bleeding
    sensibilitesSaignements: [],
    
    // Sensitivities - Medical
    sensibilitesMedicales: [],
    
    // Sensitivities - Heat
    sensibilitesChaleur: [],
    
    // Sensitivities - Age
    sensibiliteAge: [],
    
    // New User
    nouvelleUtilisatrice: '',
    
    // Additional Info - Sensitivities
    infoSensibilites: '',
    
    // Absence of Periods
    raisonAbsenceRegles: '',
    infoAbsenceRegles: '',
    
    // Plant Indications - Hydrating
    indicationsPlantesHydratantes: [],
    
    // Plant Indications - Hemostatic
    indicationsPlantesHemostatiques: [],
    
    // Plant Indications - Disinfectant
    indicationsPlantesDésinfectantes: [],
    
    // Plant Indications - Depurative
    indicationsPlantesDépuratives: [],
    
    // Allergies
    allergies: '',
    
    // Wrap Indications
    indicateursEnveloppement: [],
    infoEnveloppement: '',
    
    // Recommendations confirmation
    confirmationRecommandations: false,
    
    // Signature
    signature: '',
    
    // Practitioner Section (optional)
    indicationVapeur: '',
    recommandationContreIndication: '',
    notesPraticienne: '',
    typeContreIndication: '',
    sensibilitesVapeur: '',
    configurationSeance: '',
    dureeSeance: '',
    enveloppement: '',
    recommandationPlanning: '',
    orientations: '',
    notesCoordonnees: '',
    notesPraticienneFinal: '',
    
    // Dates
    dateFormulaire: new Date().toISOString().split('T')[0],
    dateSignature: '',
    
    // Additional questionnaire
    experienceVapeur: '',
    principalSouci: '',
    optionsSuivi: '',
    programmePersannalise: '',
    lieuSeances: '',
    recommandationsSouhaitees: ''
  });

  const sections = [
    {
      title: "Informations Cliente",
      description: "Veuillez remplir vos coordonnées",
      fields: ['nomCliente', 'emailCliente', 'telephone', 'adresse', 'dateNaissance']
    },
    {
      title: "Informations Praticienne",
      description: "Coordonnées de votre praticienne",
      fields: ['prenomPraticienne', 'compagnie', 'emailPraticienne']
    },
    {
      title: "Informations sur la Cliente",
      description: "Informations personnelles",
      fields: ['organesReproducteurs', 'modificationsAnatomiques', 'pronoms']
    },
    {
      title: "Contre-Indications Majeures",
      description: "Questions importantes sur votre santé",
      fields: ['contreSaignements', 'contreGrossesse', 'infoContreIndicationsMajeures']
    },
    {
      title: "Contre-Indications Douces",
      description: "Questions médicales supplémentaires",
      fields: ['contreMedicales', 'contreChaleur', 'infoContreChaleur']
    },
    {
      title: "Sensibilités Liées à la Vapeur",
      description: "Identifiez vos sensibilités",
      fields: ['sensibilitesSaignements', 'sensibilitesMedicales', 'sensibilitesChaleur', 'sensibiliteAge', 'nouvelleUtilisatrice', 'infoSensibilites']
    },
    {
      title: "Absence de Règles",
      description: "Si applicable",
      fields: ['raisonAbsenceRegles', 'infoAbsenceRegles']
    },
    {
      title: "Choix des Plantes",
      description: "Indications pour les plantes appropriées",
      fields: ['indicationsPlantesHydratantes', 'indicationsPlantesHemostatiques', 'indicationsPlantesDésinfectantes', 'indicationsPlantesDépuratives', 'allergies']
    },
    {
      title: "Enveloppement",
      description: "Préférences d'enveloppement",
      fields: ['indicateursEnveloppement', 'infoEnveloppement']
    },
    {
      title: "Consentement et Signature",
      description: "Confirmation finale",
      fields: ['confirmationRecommandations', 'signature', 'dateSignature']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      if (checked) {
        return { ...prev, [field]: [...currentValues, value] };
      } else {
        return { ...prev, [field]: currentValues.filter(v => v !== value) };
      }
    });
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('📤 Submitting custom waiver form data...');
    
    // Convert to JotForm-compatible format
    const submission = {
      form_id: 'custom_waiver',
      created_at: new Date().toISOString(),
      answers: {
        9: { answer: formData.nomCliente, text: formData.nomCliente },
        10: { answer: formData.emailCliente, text: formData.emailCliente },
        11: { answer: formData.telephone, text: formData.telephone },
        12: { answer: formData.adresse, text: formData.adresse },
        13: { answer: formData.dateNaissance, text: formData.dateNaissance },
        16: { answer: formData.prenomPraticienne, text: formData.prenomPraticienne },
        17: { answer: formData.compagnie, text: formData.compagnie },
        18: { answer: formData.emailPraticienne, text: formData.emailPraticienne },
        24: { answer: formData.organesReproducteurs, text: formData.organesReproducteurs },
        25: { answer: formData.modificationsAnatomiques, text: formData.modificationsAnatomiques },
        26: { answer: formData.pronoms, text: formData.pronoms },
        32: { answer: formData.contreSaignements, text: formData.contreSaignements.join(', ') },
        33: { answer: formData.contreGrossesse, text: formData.contreGrossesse.join(', ') },
        34: { answer: formData.infoContreIndicationsMajeures, text: formData.infoContreIndicationsMajeures },
        36: { answer: formData.contreMedicales, text: formData.contreMedicales.join(', ') },
        37: { answer: formData.contreChaleur, text: formData.contreChaleur.join(', ') },
        38: { answer: formData.infoContreChaleur, text: formData.infoContreChaleur },
        40: { answer: formData.sensibilitesSaignements, text: formData.sensibilitesSaignements.join(', ') },
        41: { answer: formData.sensibilitesMedicales, text: formData.sensibilitesMedicales.join(', ') },
        42: { answer: formData.sensibilitesChaleur, text: formData.sensibilitesChaleur.join(', ') },
        43: { answer: formData.sensibiliteAge, text: formData.sensibiliteAge.join(', ') },
        44: { answer: formData.nouvelleUtilisatrice, text: formData.nouvelleUtilisatrice },
        45: { answer: formData.infoSensibilites, text: formData.infoSensibilites },
        48: { answer: formData.raisonAbsenceRegles, text: formData.raisonAbsenceRegles },
        49: { answer: formData.infoAbsenceRegles, text: formData.infoAbsenceRegles },
        52: { answer: formData.indicationsPlantesHydratantes, text: formData.indicationsPlantesHydratantes.join(', ') },
        53: { answer: formData.indicationsPlantesHemostatiques, text: formData.indicationsPlantesHemostatiques.join(', ') },
        54: { answer: formData.indicationsPlantesDésinfectantes, text: formData.indicationsPlantesDésinfectantes.join(', ') },
        55: { answer: formData.indicationsPlantesDépuratives, text: formData.indicationsPlantesDépuratives.join(', ') },
        56: { answer: formData.allergies, text: formData.allergies },
        59: { answer: formData.indicateursEnveloppement, text: formData.indicateursEnveloppement.join(', ') },
        60: { answer: formData.infoEnveloppement, text: formData.infoEnveloppement },
        63: { answer: formData.confirmationRecommandations ? 'Oui' : 'Non', text: formData.confirmationRecommandations ? 'Oui' : 'Non' },
        68: { answer: formData.signature, text: formData.signature },
        131: { answer: formData.dateFormulaire, text: formData.dateFormulaire },
        132: { answer: formData.dateSignature, text: formData.dateSignature }
      },
      rawData: formData
    };
    
    console.log('✅ Custom form data prepared:', Object.keys(submission.answers).length, 'fields');
    
    if (onFormDataReady) {
      onFormDataReady(submission);
    }
  };

  const renderField = (field) => {
    switch (field) {
      case 'nomCliente':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Nom Cliente *</label>
            <input
              id={field}
              type="text"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
              placeholder="Votre nom complet"
            />
          </div>
        );
      
      case 'emailCliente':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Adresse Email Cliente *</label>
            <input
              id={field}
              type="email"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
              placeholder="votre.email@exemple.com"
            />
          </div>
        );
      
      case 'telephone':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Numéro de Téléphone (optionnel)</label>
            <input
              id={field}
              type="tel"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        );
      
      case 'adresse':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Adresse (optionnel)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Votre adresse complète"
              rows={3}
            />
          </div>
        );
      
      case 'dateNaissance':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Date de Naissance *</label>
            <input
              id={field}
              type="date"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
            />
          </div>
        );
      
      case 'prenomPraticienne':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Prénom de la Praticienne *</label>
            <input
              id={field}
              type="text"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
              placeholder="Prénom de votre praticienne"
            />
          </div>
        );
      
      case 'compagnie':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Compagnie (optionnel)</label>
            <input
              id={field}
              type="text"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Nom de la compagnie"
            />
          </div>
        );
      
      case 'emailPraticienne':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Email de la Praticienne *</label>
            <input
              id={field}
              type="email"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
              placeholder="praticienne@exemple.com"
            />
          </div>
        );
      
      case 'organesReproducteurs':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Organes reproducteurs à la naissance *</label>
            <select
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="Ovaires et utérus">Ovaires et utérus</option>
              <option value="Testicules">Testicules</option>
              <option value="Intersexe">Intersexe</option>
              <option value="Préfère ne pas répondre">Préfère ne pas répondre</option>
            </select>
          </div>
        );
      
      case 'modificationsAnatomiques':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Modifications anatomiques génitales</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Décrivez toute modification (chirurgie, etc.)"
              rows={2}
            />
          </div>
        );
      
      case 'pronoms':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Pronoms préférés</label>
            <input
              id={field}
              type="text"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Elle/Il/Iel/Autre"
            />
          </div>
        );
      
      case 'contreSaignements':
        return (
          <div className="form-field" key={field}>
            <label>Contre-Indications: Saignements Utérins *</label>
            <div className="checkbox-group">
              {[
                "Avez-vous actuellement vos règles ou des saignements frais (spotting) en cours de couleur rouge vive ?",
                "Avez-vous eu des pertes de sang légères et fraîches au cours des dernières 24 heures ?",
                "Avez-vous eu des saignements abondants spontanés au cours des 3 derniers mois ?",
                "Avez-vous eu deux cycles menstruels par mois (c.-à-d. un cycle tous les 19 jours ou moins) au cours des 3 derniers mois ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'contreGrossesse':
        return (
          <div className="form-field" key={field}>
            <label>Contre-Indications: Grossesse *</label>
            <div className="checkbox-group">
              {[
                "Êtes-vous enceinte ?",
                "Y a-t-il une possibilité que vous soyez enceinte ?",
                "Si vous suivez un traitement de fertilité, avez-vous déjà ovulé ou reçu un transfert (IAC/FIV) ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'infoContreIndicationsMajeures':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Informations Complémentaires (Contre-Indications Majeures)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Précisez si nécessaire..."
              rows={3}
            />
          </div>
        );
      
      case 'contreMedicales':
        return (
          <div className="form-field" key={field}>
            <label>Contre-Indications Médicales</label>
            <div className="checkbox-group">
              {[
                "Avez-vous subi une coagulation tubaire (brûlure des trompes de Fallope par laparoscopie via le nombril) ?",
                "Avez-vous un implant contraceptif dans le bras ou un patch (par exemple Nexplanon) ?",
                "Avez-vous eu une ablation de l'endomètre (procédure où les parois de l'utérus sont brûlées pour provoquer une cicatrisation) ?",
                "Êtes-vous à moins de 6 semaines d'une chirurgie ?",
                "Avez-vous subi une embolisation de fibrome utérin ?",
                "Portez-vous un anneau vaginal contraceptif (type NuvaRing) ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'contreChaleur':
        return (
          <div className="form-field" key={field}>
            <label>Contre-Indication Chaleur</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData[field].includes("Avez-vous une infection génitale ou rectale accompagnée d'une sensation de brûlure ?")}
                  onChange={(e) => handleCheckboxChange(field, "Avez-vous une infection génitale ou rectale accompagnée d'une sensation de brûlure ?", e.target.checked)}
                />
                <span>Avez-vous une infection génitale ou rectale accompagnée d'une sensation de brûlure ?</span>
              </label>
            </div>
          </div>
        );
      
      case 'infoContreChaleur':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Informations Complémentaires (Chaleur)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Précisez si nécessaire..."
              rows={2}
            />
          </div>
        );
      
      // Continue with remaining fields...
      case 'sensibilitesSaignements':
        return (
          <div className="form-field" key={field}>
            <label>Sensibilités: Saignements Utérins</label>
            <div className="checkbox-group">
              {[
                "Vos cycles menstruels sont-ils actuellement, ou ont-ils déjà été dans le passé, de 27 jours ou moins ?",
                "Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois (il y a 3 mois ou plus dans le passé) ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'sensibilitesMedicales':
        return (
          <div className="form-field" key={field}>
            <label>Sensibilités Médicales</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData[field].includes("Avez-vous un stérilet (DIU) ?")}
                  onChange={(e) => handleCheckboxChange(field, "Avez-vous un stérilet (DIU) ?", e.target.checked)}
                />
                <span>Avez-vous un stérilet (DIU) ?</span>
              </label>
            </div>
          </div>
        );
      
      case 'sensibilitesChaleur':
        return (
          <div className="form-field" key={field}>
            <label>Sensibilités: Chaleur</label>
            <div className="checkbox-group">
              {[
                "Avez-vous eu des bouffées de chaleur au cours du dernier mois ?",
                "Avez-vous eu des sueurs nocturnes au cours du dernier mois ?",
                "Avez-vous actuellement, ou avez-vous déjà eu au passé, des mycoses vaginales ?",
                "Avez-vous actuellement, ou avez-vous déjà eu au passé, une vaginose bactérienne ?",
                "Avez-vous actuellement, ou avez-vous déjà eu au passé, des infections urinaires (infections de la vessie) ?",
                "Avez-vous de l'herpès actif ou dormant ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'sensibiliteAge':
        return (
          <div className="form-field" key={field}>
            <label>Sensibilité: Âge</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData[field].includes("Avez-vous 13 ans ou moins ?")}
                  onChange={(e) => handleCheckboxChange(field, "Avez-vous 13 ans ou moins ?", e.target.checked)}
                />
                <span>Avez-vous 13 ans ou moins ?</span>
              </label>
            </div>
          </div>
        );
      
      case 'nouvelleUtilisatrice':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Est-ce votre première séance de vapeur ? *</label>
            <select
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>
        );
      
      case 'infoSensibilites':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Informations Complémentaires (Sensibilités)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Précisez si nécessaire..."
              rows={3}
            />
          </div>
        );
      
      case 'raisonAbsenceRegles':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Raison de l'absence des règles</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Si applicable, expliquez pourquoi vous n'avez pas de règles"
              rows={2}
            />
          </div>
        );
      
      case 'infoAbsenceRegles':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Informations Complémentaires (Absence Règles)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Précisez si nécessaire..."
              rows={2}
            />
          </div>
        );
      
      // Plant indications fields - continuing the pattern
      case 'indicationsPlantesHydratantes':
        return (
          <div className="form-field" key={field}>
            <label>Indications: Plantes Hydratantes</label>
            <div className="checkbox-group">
              {[
                "Avez-vous une sécheresse vaginale ?",
                "Avez-vous eu récemment des bouffées de chaleur ?",
                "Avez-vous eu récemment des sueurs nocturnes ?",
                "Avez-vous une infection génitale sèche (sans pertes) ?",
                "Fait-il très chaud en ce moment ?",
                "Avez-vous une aversion pour la chaleur ?",
                "Votre corps dégage-t-il facilement de la chaleur ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'indicationsPlantesHemostatiques':
        return (
          <div className="form-field" key={field}>
            <label>Indications: Plantes Hémostatiques</label>
            <div className="checkbox-group">
              {[
                "Avez-vous des cycles menstruels de 27 jours ou moins ?",
                "Au cours du dernier mois, avez-vous eu des pertes de sang fraîches avant ou le jour 27 de votre cycle ?",
                "Au cours des 3 derniers mois, avez-vous eu des saignements prolongés (10 jours ou plus de sang frais) ?",
                "Avez-vous des antécédents de saignements spontanés ou de deux cycles menstruels par mois ?",
                "Avez-vous 12 ans ou moins ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'indicationsPlantesDésinfectantes':
        return (
          <div className="form-field" key={field}>
            <label>Indications: Plantes Désinfectantes</label>
            <div className="checkbox-group">
              {[
                "Avez-vous des pertes vaginales vertes ?",
                "Avez-vous des pertes vaginales jaunes ?",
                "Avez-vous des pertes vaginales blanches ?",
                "Avez-vous des pertes vaginales épaisses ?",
                "Avez-vous des pertes malodorantes (mauvaise odeur)?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'indicationsPlantesDépuratives':
        return (
          <div className="form-field" key={field}>
            <label>Indications: Plantes Dépuratives</label>
            <div className="checkbox-group">
              {[
                "Vos cycles menstruels durent-ils 28 jours ou plus ?",
                "Votre cycle menstruel est-il absent pour une raison connue ou inconnue ? Ou êtes-vous une personne non menstruatrice (née sans utérus) ?",
                "Prenez-vous actuellement la pilule contraceptive ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'allergies':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Allergies connues ou suspectées</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Listez vos allergies (plantes, aliments, etc.)"
              rows={3}
            />
          </div>
        );
      
      case 'indicateursEnveloppement':
        return (
          <div className="form-field" key={field}>
            <label>Indicateurs: Enveloppement</label>
            <div className="checkbox-group">
              {[
                "Avez-vous des bouffées de chaleur ?",
                "Avez-vous des sueurs nocturnes ?",
                "Votre corps dégage-t-il facilement de la chaleur ?",
                "Avez-vous tendance à avoir des infections ou virus génitaux ?",
                "Fait-il actuellement très chaud ?",
                "Avez-vous une aversion pour la chaleur ?"
              ].map((question, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData[field].includes(question)}
                    onChange={(e) => handleCheckboxChange(field, question, e.target.checked)}
                  />
                  <span>{question}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'infoEnveloppement':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Informations Complémentaires (Enveloppement)</label>
            <textarea
              id={field}
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder="Précisez si nécessaire..."
              rows={2}
            />
          </div>
        );
      
      case 'confirmationRecommandations':
        return (
          <div className="form-field" key={field}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                required
              />
              <span>Je confirme avoir reçu et compris les recommandations avant la séance *</span>
            </label>
          </div>
        );
      
      case 'signature':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Signature manuscrite *</label>
            <input
              id={field}
              type="text"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
              placeholder="Tapez votre nom complet comme signature"
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              En signant, vous acceptez les termes et conditions du formulaire de consentement.
            </small>
          </div>
        );
      
      case 'dateSignature':
        return (
          <div className="form-field" key={field}>
            <label htmlFor={field}>Date de Signature *</label>
            <input
              id={field}
              type="date"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const currentSectionData = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="custom-waiver-form">
      <div className="form-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          Section {currentSection + 1} sur {sections.length}
        </div>
      </div>

      <div className="form-section">
        <h2>{currentSectionData.title}</h2>
        <p className="section-description">{currentSectionData.description}</p>

        <form onSubmit={handleSubmit}>
          {currentSectionData.fields.map(field => renderField(field))}

          <div className="form-navigation">
            {currentSection > 0 && (
              <button
                type="button"
                onClick={prevSection}
                className="btn-secondary"
              >
                ← Précédent
              </button>
            )}

            {currentSection < sections.length - 1 ? (
              <button
                type="button"
                onClick={nextSection}
                className="btn-primary"
              >
                Suivant →
              </button>
            ) : (
              <button
                type="submit"
                className="btn-submit"
              >
                📤 Envoyer à la Praticienne
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomWaiverForm;
