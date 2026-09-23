export type LegalDocumentKind = 'privacy' | 'terms';
export type LegalLanguage = 'en' | 'fr' | 'sw';

export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  introduction: string;
  sections: LegalSection[];
}

export const legalDocuments: Record<LegalLanguage, Record<LegalDocumentKind, LegalDocument>> = {
  en: {
    privacy: {
      title: 'Privacy Policy',
      introduction: 'This policy explains how Mama Air handles information when you use the app. Learn more about Mama Air at mamaair.africa.',
      sections: [
        { title: 'Information you provide', body: 'We process your email address and name; profile details such as date of birth, height, pre-pregnancy weight and pregnancy week; lifestyle details such as sleep, activity, diet and ventilation; and the symptoms, feelings, wellbeing check-ins and Daily Plan actions you record. Some of this is sensitive health-related information.' },
        { title: 'Location and environmental features', body: 'If you enable location tracking, the app may collect coordinates while its location service is active, including when the app is not on screen. Location supports indoor/outdoor classification and environmental exposure features. Coordinates may be sent to HERE for reverse geocoding. Outdoor location points and timestamps may be stored on your device and uploaded to Mama Air servers. Turning tracking off stops future tracking, but does not automatically remove data already sent or queued.' },
        { title: 'Other information and permissions', body: 'The app stores account tokens, preferences, progress and limited product-usage events on your device. If you choose Google sign-in, Google processes information needed for that sign-in. Camera or photo-library access is used when you choose a profile image. Notifications are optional and can be managed in device settings.' },
        { title: 'How information is used', body: 'We use information to create and secure your account, provide pregnancy and environmental information, personalize Daily Plans and recommendations, save your progress, deliver requested notifications and operate the service.' },
        { title: 'Services involved', body: 'Mama Air servers and technical service providers process information needed to operate the app. Google is involved if you choose Google sign-in. HERE may receive coordinates for reverse geocoding when location tracking is enabled. An external avatar-image service may receive your name when a generated profile avatar is displayed.' },
        { title: 'Your choices', body: 'You can turn off location tracking in Privacy Settings, manage notification permission in Android settings and edit available profile details. Some features may be limited without optional permissions. For questions about your information, visit mamaair.africa.' },
        { title: 'Account deletion and storage', body: 'You can initiate account deletion in App Settings. The app sends the request to Mama Air servers and signs you out after confirmation. Uninstalling the app alone does not delete information already uploaded. Information stored on your device may remain until it is cleared or the app is removed.' },
        { title: 'Security and changes', body: 'We use measures intended to protect information, although no system is completely secure. We may update this policy as the app changes. The current text is available in the app.' },
      ],
    },
    terms: {
      title: 'Terms of Use',
      introduction: 'These terms describe the use of the Mama Air app. Learn more at mamaair.africa.',
      sections: [
        { title: 'Your account', body: 'Provide accurate account information, keep your sign-in details private and use only your own account. Use the app lawfully and do not interfere with its operation.' },
        { title: 'What the app provides', body: 'Mama Air offers pregnancy-related educational content, wellbeing check-ins, environmental information, Daily Plans and recommendations. Features can change, and some depend on device permissions or third-party information.' },
        { title: 'Not medical care', body: 'Mama Air is not an emergency service and does not diagnose, treat or prevent a medical condition. Its information and recommendations do not replace advice from a qualified healthcare professional. Contact a clinician about concerning symptoms. For an emergency, contact local emergency services.' },
        { title: 'Accuracy and decisions', body: 'Environmental readings, location classification, estimates and recommendations may be incomplete, delayed or inaccurate. Do not make medical or safety decisions solely from the app. You are responsible for the information you enter and how you use the results.' },
        { title: 'Content and availability', body: 'Mama Air and its licensors retain rights in the app and its content. You may use them for your personal use of the service. The service may be interrupted or changed, including when necessary for maintenance or security.' },
        { title: 'Privacy and permissions', body: 'The Privacy Policy explains how information is handled. Location and notification permissions are separate choices. Accepting these terms does not itself enable optional location tracking.' },
        { title: 'Stopping use and changes', body: 'You can stop using the app and initiate account deletion in App Settings. These terms may be updated as the service changes. Nothing here limits rights that cannot be limited under applicable law.' },
      ],
    },
  },
  fr: {
    privacy: {
      title: 'Politique de confidentialité',
      introduction: 'Cette politique explique comment Mama Air traite les informations lorsque vous utilisez l’application. Pour en savoir plus, consultez mamaair.africa.',
      sections: [
        { title: 'Informations que vous fournissez', body: 'Nous traitons votre adresse e-mail et votre nom ; les informations de profil comme la date de naissance, la taille, le poids avant la grossesse et la semaine de grossesse ; les habitudes de vie comme le sommeil, l’activité, l’alimentation et la ventilation ; ainsi que les symptômes, les ressentis, les bilans de bien-être et les actions du programme quotidien que vous enregistrez. Certaines de ces données concernent la santé et sont sensibles.' },
        { title: 'Localisation et environnement', body: 'Si vous activez le suivi de localisation, l’application peut recueillir vos coordonnées pendant que son service de localisation est actif, même lorsque l’application n’est pas à l’écran. La localisation sert à distinguer les périodes à l’intérieur et à l’extérieur et à fournir des informations sur l’exposition environnementale. Les coordonnées peuvent être envoyées à HERE pour une géolocalisation inverse. Les positions extérieures horodatées peuvent être conservées sur votre appareil et envoyées aux serveurs de Mama Air. Désactiver le suivi interrompt la collecte future, mais ne supprime pas automatiquement les données déjà envoyées ou en attente d’envoi.' },
        { title: 'Autres informations et autorisations', body: 'L’application conserve sur votre appareil les jetons de connexion, les préférences, votre progression et un nombre limité d’événements d’utilisation. Si vous choisissez la connexion avec Google, Google traite les informations nécessaires à cette connexion. L’accès à l’appareil photo ou à la photothèque est utilisé lorsque vous choisissez une photo de profil. Les notifications sont facultatives et se gèrent dans les réglages de l’appareil.' },
        { title: 'Utilisation des informations', body: 'Nous utilisons ces informations pour créer et protéger votre compte, fournir des informations sur la grossesse et l’environnement, personnaliser les programmes et recommandations quotidiens, enregistrer votre progression, envoyer les notifications demandées et faire fonctionner le service.' },
        { title: 'Services concernés', body: 'Les serveurs de Mama Air et ses prestataires techniques traitent les informations nécessaires au fonctionnement de l’application. Google intervient si vous choisissez sa méthode de connexion. HERE peut recevoir des coordonnées pour la géolocalisation inverse lorsque le suivi est activé. Un service externe de génération d’avatar peut recevoir votre nom lors de l’affichage d’un avatar généré.' },
        { title: 'Vos choix', body: 'Vous pouvez désactiver le suivi dans les paramètres de confidentialité, gérer les notifications dans les réglages Android et modifier les informations de profil disponibles. Certaines fonctions peuvent être limitées sans les autorisations facultatives. Pour toute question sur vos informations, consultez mamaair.africa.' },
        { title: 'Suppression du compte et stockage', body: 'Vous pouvez demander la suppression de votre compte dans les paramètres de l’application. L’application envoie la demande aux serveurs de Mama Air et vous déconnecte après confirmation. Désinstaller l’application ne supprime pas les informations déjà transmises. Les informations conservées sur l’appareil peuvent y rester jusqu’à leur effacement ou la désinstallation.' },
        { title: 'Sécurité et modifications', body: 'Nous appliquons des mesures destinées à protéger les informations, mais aucun système n’est entièrement sûr. Cette politique peut évoluer avec l’application. La version actuelle reste disponible dans l’application.' },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      introduction: 'Ces conditions décrivent l’utilisation de l’application Mama Air. Pour en savoir plus, consultez mamaair.africa.',
      sections: [
        { title: 'Votre compte', body: 'Fournissez des informations exactes, protégez vos identifiants et utilisez uniquement votre propre compte. Utilisez l’application légalement et ne perturbez pas son fonctionnement.' },
        { title: 'Ce que propose l’application', body: 'Mama Air propose des contenus éducatifs sur la grossesse, des bilans de bien-être, des informations environnementales, des programmes quotidiens et des recommandations. Les fonctions peuvent évoluer et certaines dépendent des autorisations de l’appareil ou de données de tiers.' },
        { title: 'Ne remplace pas les soins médicaux', body: 'Mama Air n’est pas un service d’urgence et ne diagnostique, ne traite ni ne prévient une maladie. Ses informations et recommandations ne remplacent pas l’avis d’un professionnel de santé qualifié. Consultez un soignant pour tout symptôme préoccupant et contactez les secours locaux en cas d’urgence.' },
        { title: 'Exactitude et décisions', body: 'Les mesures environnementales, la classification de localisation, les estimations et les recommandations peuvent être incomplètes, retardées ou inexactes. Ne prenez pas de décisions médicales ou de sécurité uniquement à partir de l’application. Vous êtes responsable des informations saisies et de l’utilisation des résultats.' },
        { title: 'Contenu et disponibilité', body: 'Mama Air et ses concédants conservent leurs droits sur l’application et son contenu. Vous pouvez les utiliser à titre personnel dans le cadre du service. Le service peut être interrompu ou modifié, notamment pour sa maintenance ou sa sécurité.' },
        { title: 'Confidentialité et autorisations', body: 'La Politique de confidentialité explique le traitement des informations. Les autorisations de localisation et de notification sont des choix distincts. Accepter ces conditions n’active pas le suivi de localisation facultatif.' },
        { title: 'Fin d’utilisation et modifications', body: 'Vous pouvez cesser d’utiliser l’application et demander la suppression de votre compte dans ses paramètres. Ces conditions peuvent évoluer avec le service. Elles ne limitent aucun droit qui ne peut légalement être limité.' },
      ],
    },
  },
  sw: {
    privacy: {
      title: 'Sera ya Faragha',
      introduction: 'Sera hii inaeleza jinsi Mama Air inavyoshughulikia taarifa unapotumia programu. Pata maelezo zaidi katika mamaair.africa.',
      sections: [
        { title: 'Taarifa unazotoa', body: 'Tunashughulikia anwani yako ya barua pepe na jina; taarifa za wasifu kama tarehe ya kuzaliwa, urefu, uzito kabla ya ujauzito na wiki ya ujauzito; taarifa za maisha kama usingizi, shughuli, lishe na uingizaji hewa; pamoja na dalili, hisia, taarifa za hali yako na hatua za Mpango wa Kila Siku unazorekodi. Baadhi ya taarifa hizi ni data nyeti zinazohusu afya.' },
        { title: 'Eneo na mazingira', body: 'Ukiwasha ufuatiliaji wa eneo, programu inaweza kukusanya viwianishi wakati huduma yake ya eneo inafanya kazi, hata programu isipoonekana kwenye skrini. Eneo hutumika kutambua kama uko ndani au nje na kusaidia taarifa za mfiduo wa mazingira. Viwianishi vinaweza kutumwa kwa HERE ili kupata maelezo ya mahali. Maeneo ya nje pamoja na muda wake yanaweza kuhifadhiwa kwenye kifaa chako na kupakiwa kwenye seva za Mama Air. Kuzima ufuatiliaji husimamisha ukusanyaji mpya, lakini hakufuti kiotomatiki data iliyotumwa au inayosubiri kutumwa.' },
        { title: 'Taarifa nyingine na ruhusa', body: 'Programu huhifadhi tokeni za akaunti, mapendeleo, maendeleo na matukio machache ya matumizi kwenye kifaa chako. Ukichagua kuingia kwa Google, Google hushughulikia taarifa zinazohitajika kwa kuingia huko. Kamera au picha za kifaa hutumiwa unapochagua picha ya wasifu. Arifa ni za hiari na zinaweza kudhibitiwa kwenye mipangilio ya kifaa.' },
        { title: 'Jinsi taarifa zinavyotumiwa', body: 'Tunatumia taarifa kuunda na kulinda akaunti yako, kutoa taarifa za ujauzito na mazingira, kubinafsisha mipango na mapendekezo ya kila siku, kuhifadhi maendeleo yako, kutuma arifa ulizoomba na kuendesha huduma.' },
        { title: 'Huduma zinazohusika', body: 'Seva za Mama Air na watoa huduma wa kiufundi hushughulikia taarifa zinazohitajika kuendesha programu. Google huhusika ukichagua kuingia kwa Google. HERE inaweza kupokea viwianishi kwa ajili ya maelezo ya mahali ufuatiliaji wa eneo ukiwashwa. Huduma ya nje ya picha ya wasifu inaweza kupokea jina lako wakati picha iliyozalishwa inaonyeshwa.' },
        { title: 'Chaguo zako', body: 'Unaweza kuzima ufuatiliaji wa eneo katika mipangilio ya faragha, kudhibiti ruhusa ya arifa katika mipangilio ya Android na kurekebisha taarifa za wasifu zinazoweza kubadilishwa. Baadhi ya vipengele vinaweza kuwa vichache bila ruhusa za hiari. Kwa maswali kuhusu taarifa zako, tembelea mamaair.africa.' },
        { title: 'Kufuta akaunti na uhifadhi', body: 'Unaweza kuanzisha kufuta akaunti katika mipangilio ya programu. Programu hutuma ombi hilo kwa seva za Mama Air na kukuondoa kwenye akaunti baada ya uthibitisho. Kuondoa programu pekee hakufuti taarifa zilizokwisha kupakiwa. Taarifa kwenye kifaa zinaweza kubaki hadi zifutwe au programu iondolewe.' },
        { title: 'Usalama na mabadiliko', body: 'Tunatumia hatua zinazokusudiwa kulinda taarifa, ingawa hakuna mfumo ulio salama kabisa. Tunaweza kusasisha sera hii programu inapobadilika. Maandishi ya sasa yanapatikana ndani ya programu.' },
      ],
    },
    terms: {
      title: 'Masharti ya Matumizi',
      introduction: 'Masharti haya yanaeleza matumizi ya programu ya Mama Air. Pata maelezo zaidi katika mamaair.africa.',
      sections: [
        { title: 'Akaunti yako', body: 'Toa taarifa sahihi za akaunti, linda taarifa zako za kuingia na tumia akaunti yako pekee. Tumia programu kwa mujibu wa sheria na usivuruge utendaji wake.' },
        { title: 'Huduma ya programu', body: 'Mama Air hutoa maudhui ya elimu kuhusu ujauzito, taarifa za hali yako, taarifa za mazingira, Mipango ya Kila Siku na mapendekezo. Vipengele vinaweza kubadilika, na vingine hutegemea ruhusa za kifaa au taarifa za wengine.' },
        { title: 'Si huduma ya matibabu', body: 'Mama Air si huduma ya dharura na haitambui, haitibu wala kuzuia ugonjwa. Taarifa na mapendekezo yake hayachukui nafasi ya ushauri wa mtaalamu wa afya. Wasiliana na mhudumu wa afya kwa dalili zinazokutia wasiwasi. Katika dharura, wasiliana na huduma za dharura za eneo lako.' },
        { title: 'Usahihi na maamuzi', body: 'Vipimo vya mazingira, utambuzi wa eneo, makadirio na mapendekezo vinaweza kuwa havijakamilika, vimechelewa au si sahihi. Usifanye maamuzi ya afya au usalama kwa kutegemea programu pekee. Unawajibika kwa taarifa unazoingiza na jinsi unavyotumia matokeo.' },
        { title: 'Maudhui na upatikanaji', body: 'Mama Air na watoa leseni wake wanahifadhi haki za programu na maudhui yake. Unaweza kuyatumia binafsi ndani ya huduma. Huduma inaweza kukatizwa au kubadilishwa, ikiwemo kwa matengenezo au usalama.' },
        { title: 'Faragha na ruhusa', body: 'Sera ya Faragha inaeleza jinsi taarifa zinavyoshughulikiwa. Ruhusa za eneo na arifa ni chaguo tofauti. Kukubali masharti haya hakuwashi ufuatiliaji wa eneo wa hiari.' },
        { title: 'Kuacha kutumia na mabadiliko', body: 'Unaweza kuacha kutumia programu na kuanzisha kufuta akaunti katika mipangilio yake. Masharti haya yanaweza kusasishwa huduma inapobadilika. Hakuna sehemu inayopunguza haki ambazo haziwezi kupunguzwa kisheria.' },
      ],
    },
  },
};
