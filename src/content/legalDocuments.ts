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
      introduction: 'Effective 31 October 2026. This Privacy Policy explains how Mama Air collects, uses, stores, protects and shares information when you use the Mama Air app, its supporting services and its public account-deletion page.',
      sections: [
        {
          title: 'About Mama Air and this policy',
          body: 'Mama Air is a pregnancy wellbeing and environmental-information service. This policy covers the app, Mama Air servers and the public pages used to manage privacy requests. The public policy is available at https://api.mamaair.work/privacy-policy. Privacy questions may be sent to service@mamaair.work.',
        },
        {
          title: 'Information you provide',
          body: 'We may process your name, email address, account identifiers and sign-in information; profile details such as date of birth, height, pre-pregnancy weight, expected due date, pregnancy week, pregnancy history, country, area, language and time zone; lifestyle details such as sleep, activity, diet, hydration, work, cooking and ventilation; and the moods, feelings, physical changes, wellbeing check-ins, reminders and Daily Plan actions you choose to record. Some of this is sensitive pregnancy and wellbeing information. A photo selected from your device remains on your device unless the app clearly tells you that it will be uploaded. A profile image supplied by a sign-in provider may remain hosted by that provider.',
        },
        {
          title: 'Location and environmental features',
          body: 'Location tracking is optional. If you enable it, Mama Air collects and sends precise or approximate coordinates and timestamps to Mama Air servers while the location service is active, including when the app is not visible on screen. Location accuracy and movement information may be processed to classify activity as indoors or outdoors and to provide local air, weather and environmental-exposure information. Mama Air servers may send coordinates to HERE for reverse geocoding and to OpenWeather for air-quality and weather results. These requests do not include your name, email address or Mama Air password. Turning tracking off stops future collection but does not automatically remove information already uploaded. Uploaded information can be removed by deleting your account.',
        },
        {
          title: 'App activity, generated information and permissions',
          body: 'We may process consent choices, completed recommendations, check-in dates, progress, reminder schedules and limited product-interaction events. Mama Air may generate indoor or outdoor classifications, exposure estimates, personalised environmental indicators, Daily Plans, recommendations and progress summaries. The app may request location, notification, camera or photo-library access only for the related feature. You can refuse or withdraw optional permissions in the app or device settings, although the related feature may then be unavailable.',
        },
        {
          title: 'How information is used',
          body: 'We use information to create, authenticate and protect your account; verify email and process password-reset requests; provide and personalise pregnancy wellbeing and environmental features; calculate and display exposure history; save progress and preferences; deliver requested reminders; process privacy and account-deletion requests; maintain service reliability; prevent misuse; troubleshoot problems; and comply with applicable legal obligations. Mama Air does not use this information to make decisions that produce legal or similarly significant effects.',
        },
        {
          title: 'Service providers and sharing',
          body: 'Mama Air does not sell personal information. Limited information may be processed by cloud hosting, email delivery, security and technical-support providers that help operate the service. Google or Firebase processes sign-in information when you choose those methods. HERE and OpenWeather may process coordinates needed to return location-based results. We may also disclose the minimum information required by law, to protect users or the service, or as part of a business transfer with appropriate notice and safeguards. We do not share precise location, pregnancy information or wellbeing entries with advertising networks.',
        },
        {
          title: 'Advertising and local device storage',
          body: 'Mama Air may show promotional content selected by the app or general app context. Precise location, pregnancy information and wellbeing entries are not used to personalise advertising, and the current app does not include a third-party advertising SDK. On your device, account credentials are protected by Android Keystore or iOS Keychain and sensitive app storage is encrypted. Local storage may include preferences, progress, notification settings, limited product-interaction events and temporarily queued location points. Signing out clears account-linked queued locations, pending local events and scheduled notifications.',
        },
        {
          title: 'Retention',
          body: 'Account, profile, pregnancy, lifestyle, wellbeing, progress, recommendation, movement and exposure information is retained while needed to provide your active account and is deleted with the account. Queued location points on the device are kept for no more than seven days and are removed earlier after successful upload, sign-out or account deletion. Authentication tokens remain only until expiry, revocation, sign-out or deletion. Verification and password-reset records are removed after use or expiry. Operational and security logs are automatically deleted or irreversibly anonymised within 30 days. Encrypted backups are rotated and overwritten within 30 days; completed deletion requests are reapplied if a backup is restored. If limited information must be kept by law or to prevent fraud, only the minimum required is retained for the applicable period and kept separate from normal app use.',
        },
        {
          title: 'Account deletion',
          body: 'You can permanently delete your account from App Settings or at https://api.mamaair.work/delete-account without reinstalling the app. After ownership is verified and deletion is confirmed, Mama Air deletes the account and its associated profile, pregnancy, wellbeing, lifestyle, location, exposure, reminder, progress, task, recommendation and authentication information, and revokes active Mama Air sessions and tokens. Deleting your Mama Air account does not delete a separate Google or Firebase account. Uninstalling the app alone does not delete information already uploaded.',
        },
        {
          title: 'Your choices and rights',
          body: 'You can edit available profile details, turn off tracking in Privacy Settings and manage permissions in device settings. Depending on where you live, you may ask to access, correct, receive, restrict or delete your information, object to certain processing, withdraw consent or complain to a data-protection authority. Contact service@mamaair.work to make a privacy request. We may ask for limited information to verify your identity. Do not send passwords, precise coordinates or sensitive personal information by email.',
        },
        {
          title: 'Age and security',
          body: 'Mama Air is intended only for people aged 18 or older. Invalid or future birth dates and registrations by people under 18 are not accepted. We use HTTPS, encrypted local storage, protected credential storage, access controls, session revocation, data minimisation and logging rules intended to exclude passwords, tokens, precise coordinates and sensitive pregnancy and wellbeing entries. No electronic service can guarantee absolute security. Report a suspected privacy or security issue to service@mamaair.work.',
        },
        {
          title: 'International processing and policy changes',
          body: 'Mama Air and its service providers may process information in countries other than the country where you live. Where required, appropriate contractual, organisational or technical safeguards are used. We may update this policy when features, providers, legal requirements or data practices change. The updated version will remain available in the app and at https://api.mamaair.work/privacy-policy with a revised effective date. Material changes will receive additional notice or consent where required.',
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      introduction: 'These terms describe the use of the Mama Air app. Learn more at mamaair.africa.',
      sections: [
        { title: 'Your account', body: 'Provide accurate account information, keep your sign-in details private and use only your own account. Use the app lawfully and do not interfere with its operation.' },
        { title: 'What the app provides', body: 'Mama Air offers pregnancy-related educational content, wellbeing check-ins, environmental information, Daily Plans and recommendations. Features can change, and some depend on device permissions or third-party information.' },
        { title: 'Not medical care', body: 'Mama Air is not an emergency service and does not diagnose, treat or prevent a medical condition. Its information and recommendations do not replace advice from a qualified medical professional. Contact a clinician about concerning physical changes or warning signs. For an emergency, contact local emergency services.' },
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
      introduction: 'En vigueur le 31 octobre 2026. Cette Politique de confidentialité explique comment Mama Air collecte, utilise, conserve, protège et partage les informations lorsque vous utilisez l’application Mama Air, ses services associés et sa page publique de suppression de compte.',
      sections: [
        {
          title: 'À propos de Mama Air et de cette politique',
          body: 'Mama Air est un service de bien-être pendant la grossesse et d’information environnementale. Cette politique couvre l’application, les serveurs de Mama Air et les pages publiques utilisées pour gérer les demandes relatives à la vie privée. La politique publique est disponible à l’adresse https://api.mamaair.work/privacy-policy. Les questions peuvent être envoyées à service@mamaair.work.',
        },
        {
          title: 'Informations que vous fournissez',
          body: 'Nous pouvons traiter votre nom, votre adresse e-mail, vos identifiants de compte et de connexion ; les informations de profil comme la date de naissance, la taille, le poids avant la grossesse, la date prévue d’accouchement, la semaine de grossesse, les grossesses précédentes, le pays, la zone, la langue et le fuseau horaire ; les habitudes de vie comme le sommeil, l’activité, l’alimentation, l’hydratation, le travail, la cuisine et la ventilation ; ainsi que les humeurs, ressentis, changements physiques, bilans de bien-être, rappels et actions du programme quotidien que vous choisissez d’enregistrer. Certaines de ces données sensibles concernent la grossesse et le bien-être. Une photo choisie sur votre appareil y reste, sauf si l’application vous informe clairement qu’elle sera envoyée. Une image fournie par un service de connexion peut rester hébergée par ce service.',
        },
        {
          title: 'Localisation et environnement',
          body: 'Le suivi de localisation est facultatif. Si vous l’activez, Mama Air recueille et transmet aux serveurs de Mama Air des coordonnées précises ou approximatives et des horodatages pendant que le service de localisation est actif, même lorsque l’application n’est pas visible à l’écran. La précision et les mouvements peuvent être traités pour classer l’activité comme intérieure ou extérieure et fournir des informations locales sur l’air, la météo et l’exposition environnementale. Les serveurs de Mama Air peuvent transmettre les coordonnées à HERE pour la géolocalisation inverse et à OpenWeather pour les résultats sur la qualité de l’air et la météo. Ces demandes n’incluent ni votre nom, ni votre adresse e-mail, ni votre mot de passe Mama Air. Désactiver le suivi arrête la collecte future sans supprimer automatiquement les données déjà envoyées. Vous pouvez supprimer les données envoyées en supprimant votre compte.',
        },
        {
          title: 'Activité, informations générées et autorisations',
          body: 'Nous pouvons traiter vos choix de consentement, recommandations terminées, dates de bilan, progression, horaires de rappel et un nombre limité d’interactions avec le produit. Mama Air peut générer des classifications intérieur/extérieur, des estimations d’exposition, des indicateurs environnementaux personnalisés, des programmes quotidiens, des recommandations et des résumés de progression. L’application peut demander l’accès à la localisation, aux notifications, à l’appareil photo ou à la photothèque uniquement pour la fonction concernée. Vous pouvez refuser ou retirer une autorisation facultative dans l’application ou les réglages de l’appareil, mais la fonction correspondante peut alors être indisponible.',
        },
        {
          title: 'Utilisation des informations',
          body: 'Nous utilisons les informations pour créer, authentifier et protéger votre compte ; vérifier votre adresse e-mail et traiter les demandes de réinitialisation du mot de passe ; fournir et personnaliser les fonctions de bien-être pendant la grossesse et les fonctions environnementales ; calculer et afficher l’historique d’exposition ; enregistrer votre progression et vos préférences ; envoyer les rappels demandés ; traiter les demandes relatives à la vie privée et à la suppression du compte ; maintenir la fiabilité du service ; prévenir les abus ; résoudre les problèmes et respecter les obligations légales applicables. Mama Air n’utilise pas ces informations pour prendre des décisions produisant des effets juridiques ou similaires importants.',
        },
        {
          title: 'Prestataires et partage',
          body: 'Mama Air ne vend pas les informations personnelles. Des informations limitées peuvent être traitées par des prestataires d’hébergement, d’envoi d’e-mails, de sécurité et d’assistance technique qui contribuent au fonctionnement du service. Google ou Firebase traite les informations de connexion lorsque vous choisissez ces méthodes. HERE et OpenWeather peuvent traiter les coordonnées nécessaires pour renvoyer des résultats liés à la localisation. Nous pouvons aussi communiquer le minimum d’informations exigé par la loi, nécessaire pour protéger les utilisateurs ou le service, ou dans le cadre d’un transfert d’activité assorti d’un avis et de garanties appropriés. Nous ne partageons pas la localisation précise, les informations de grossesse ou les bilans de bien-être avec des réseaux publicitaires.',
        },
        {
          title: 'Publicité et stockage local',
          body: 'Mama Air peut afficher du contenu promotionnel choisi par l’application ou selon le contexte général de l’application. La localisation précise, les informations de grossesse et les bilans de bien-être ne servent pas à personnaliser la publicité, et l’application actuelle n’intègre aucun kit publicitaire tiers. Sur votre appareil, les identifiants de compte sont protégés par Android Keystore ou iOS Keychain et le stockage sensible est chiffré. Le stockage local peut inclure les préférences, la progression, les réglages de notification, des interactions limitées et des positions temporairement en attente. La déconnexion supprime les positions en attente liées au compte, les événements locaux en attente et les notifications programmées.',
        },
        {
          title: 'Durée de conservation',
          body: 'Les informations de compte, de profil, de grossesse, de mode de vie, de bien-être, de progression, de recommandation, de mouvement et d’exposition sont conservées tant qu’elles sont nécessaires au compte actif, puis supprimées avec le compte. Les positions en attente sur l’appareil sont conservées au maximum sept jours et supprimées plus tôt après leur envoi, la déconnexion ou la suppression du compte. Les jetons restent uniquement jusqu’à leur expiration, révocation, déconnexion ou suppression. Les enregistrements de vérification et de réinitialisation sont supprimés après utilisation ou expiration. Les journaux opérationnels et de sécurité sont automatiquement supprimés ou rendus anonymes de manière irréversible sous 30 jours. Les sauvegardes chiffrées sont renouvelées et écrasées sous 30 jours ; les suppressions terminées sont réappliquées si une sauvegarde est restaurée. Si la loi ou la prévention de la fraude impose une conservation limitée, seul le minimum requis est conservé pendant la période applicable et séparé de l’utilisation normale.',
        },
        {
          title: 'Suppression du compte',
          body: 'Vous pouvez supprimer définitivement votre compte dans les paramètres de l’application ou à l’adresse https://api.mamaair.work/delete-account sans réinstaller l’application. Après vérification de votre identité et confirmation, Mama Air supprime le compte et les informations de profil, grossesse, bien-être, mode de vie, localisation, exposition, rappel, progression, tâche, recommandation et authentification qui lui sont associées, puis révoque les sessions et jetons Mama Air actifs. La suppression du compte Mama Air ne supprime pas un compte Google ou Firebase distinct. Désinstaller l’application ne supprime pas à lui seul les informations déjà envoyées.',
        },
        {
          title: 'Vos choix et vos droits',
          body: 'Vous pouvez modifier les informations de profil disponibles, arrêter le suivi dans les paramètres de confidentialité et gérer les autorisations dans les réglages de l’appareil. Selon votre lieu de résidence, vous pouvez demander l’accès, la correction, la réception, la limitation ou la suppression de vos informations, vous opposer à certains traitements, retirer votre consentement ou déposer une plainte auprès d’une autorité compétente. Écrivez à service@mamaair.work pour exercer un droit. Nous pouvons demander des informations limitées pour vérifier votre identité. N’envoyez pas de mot de passe, de coordonnées précises ou d’informations personnelles sensibles par e-mail.',
        },
        {
          title: 'Âge et sécurité',
          body: 'Mama Air est destiné uniquement aux personnes âgées de 18 ans ou plus. Les dates de naissance invalides ou futures et les inscriptions de personnes de moins de 18 ans ne sont pas acceptées. Nous utilisons HTTPS, un stockage local chiffré, une protection des identifiants, des contrôles d’accès, la révocation des sessions, la minimisation des données et des règles de journalisation destinées à exclure les mots de passe, jetons, coordonnées précises et informations sensibles sur la grossesse et le bien-être. Aucun service électronique ne peut garantir une sécurité absolue. Signalez un problème présumé de confidentialité ou de sécurité à service@mamaair.work.',
        },
        {
          title: 'Traitement international et modifications',
          body: 'Mama Air et ses prestataires peuvent traiter des informations dans d’autres pays que votre pays de résidence. Lorsque cela est exigé, des garanties contractuelles, organisationnelles ou techniques appropriées sont utilisées. Nous pouvons mettre à jour cette politique lorsque les fonctions, prestataires, obligations légales ou pratiques relatives aux données changent. La version mise à jour restera disponible dans l’application et à l’adresse https://api.mamaair.work/privacy-policy avec une nouvelle date d’entrée en vigueur. Les changements importants feront l’objet d’un avis ou d’un consentement supplémentaire lorsque cela est nécessaire.',
        },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      introduction: 'Ces conditions décrivent l’utilisation de l’application Mama Air. Pour en savoir plus, consultez mamaair.africa.',
      sections: [
        { title: 'Votre compte', body: 'Fournissez des informations exactes, protégez vos identifiants et utilisez uniquement votre propre compte. Utilisez l’application légalement et ne perturbez pas son fonctionnement.' },
        { title: 'Ce que propose l’application', body: 'Mama Air propose des contenus éducatifs sur la grossesse, des bilans de bien-être, des informations environnementales, des programmes quotidiens et des recommandations. Les fonctions peuvent évoluer et certaines dépendent des autorisations de l’appareil ou de données de tiers.' },
        { title: 'Ne remplace pas les soins médicaux', body: 'Mama Air n’est pas un service d’urgence et ne diagnostique, ne traite ni ne prévient une maladie. Ses informations et recommandations ne remplacent pas l’avis d’un professionnel médical qualifié. Consultez un soignant pour tout symptôme préoccupant et contactez les secours locaux en cas d’urgence.' },
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
      introduction: 'Inaanza kutumika tarehe 31 Oktoba 2026. Sera hii ya Faragha inaeleza jinsi Mama Air inavyokusanya, kutumia, kuhifadhi, kulinda na kushiriki taarifa unapotumia programu ya Mama Air, huduma zake zinazoiunga mkono na ukurasa wa umma wa kufuta akaunti.',
      sections: [
        {
          title: 'Kuhusu Mama Air na sera hii',
          body: 'Mama Air ni huduma ya ustawi wakati wa ujauzito na taarifa za mazingira. Sera hii inahusu programu, seva za Mama Air na kurasa za umma zinazotumiwa kushughulikia maombi ya faragha. Sera ya umma inapatikana katika https://api.mamaair.work/privacy-policy. Maswali ya faragha yanaweza kutumwa kwa service@mamaair.work.',
        },
        {
          title: 'Taarifa unazotoa',
          body: 'Tunaweza kushughulikia jina lako, anwani ya barua pepe, vitambulisho vya akaunti na taarifa za kuingia; taarifa za wasifu kama tarehe ya kuzaliwa, urefu, uzito kabla ya ujauzito, tarehe inayotarajiwa ya kujifungua, wiki ya ujauzito, historia ya ujauzito, nchi, eneo, lugha na saa za eneo; taarifa za maisha kama usingizi, shughuli, lishe, unywaji wa maji, kazi, kupika na uingizaji hewa; pamoja na hali ya moyo, hisia, mabadiliko ya mwili, taarifa za ustawi, vikumbusho na hatua za Mpango wa Kila Siku unazochagua kurekodi. Baadhi ya taarifa hizi ni nyeti na zinahusu ujauzito na ustawi. Picha iliyochaguliwa kutoka kwenye kifaa chako hubaki kwenye kifaa isipokuwa programu ikueleze wazi kuwa itapakiwa. Picha ya wasifu iliyotolewa na mtoa huduma wa kuingia inaweza kuendelea kuhifadhiwa na mtoa huduma huyo.',
        },
        {
          title: 'Eneo na mazingira',
          body: 'Ufuatiliaji wa eneo ni wa hiari. Ukiuwasha, Mama Air hukusanya na kutuma viwianishi sahihi au vya kukadiria pamoja na muda wake kwenye seva za Mama Air wakati huduma ya eneo inafanya kazi, hata programu isipoonekana kwenye skrini. Usahihi wa eneo na taarifa za mwendo zinaweza kutumiwa kutambua shughuli ya ndani au nje na kutoa taarifa za karibu kuhusu hewa, hali ya hewa na mfiduo wa mazingira. Seva za Mama Air zinaweza kutuma viwianishi kwa HERE ili kupata maelezo ya mahali na kwa OpenWeather ili kupata matokeo ya ubora wa hewa na hali ya hewa. Maombi haya hayajumuishi jina lako, anwani ya barua pepe au nenosiri la Mama Air. Kuzima ufuatiliaji husimamisha ukusanyaji mpya lakini hakufuti kiotomatiki taarifa zilizokwisha kutumwa. Taarifa zilizotumwa zinaweza kufutwa kwa kufuta akaunti yako.',
        },
        {
          title: 'Matumizi ya programu, taarifa zinazoundwa na ruhusa',
          body: 'Tunaweza kushughulikia maamuzi ya idhini, mapendekezo yaliyokamilishwa, tarehe za taarifa, maendeleo, ratiba za vikumbusho na matukio machache ya matumizi ya programu. Mama Air inaweza kuunda uainishaji wa ndani au nje, makadirio ya mfiduo, viashiria vya mazingira vilivyobinafsishwa, Mipango ya Kila Siku, mapendekezo na muhtasari wa maendeleo. Programu inaweza kuomba ruhusa ya eneo, arifa, kamera au maktaba ya picha kwa kipengele husika tu. Unaweza kukataa au kuondoa ruhusa ya hiari katika programu au mipangilio ya kifaa, ingawa kipengele husika kinaweza kutopatikana.',
        },
        {
          title: 'Jinsi taarifa zinavyotumiwa',
          body: 'Tunatumia taarifa kuunda, kuthibitisha na kulinda akaunti yako; kuthibitisha barua pepe na kushughulikia maombi ya kuweka upya nenosiri; kutoa na kubinafsisha vipengele vya ustawi wa ujauzito na mazingira; kukokotoa na kuonyesha historia ya mfiduo; kuhifadhi maendeleo na mapendeleo; kutuma vikumbusho ulivyoomba; kushughulikia maombi ya faragha na kufuta akaunti; kudumisha uaminifu wa huduma; kuzuia matumizi mabaya; kutatua matatizo; na kutimiza wajibu wa kisheria. Mama Air haitumii taarifa hizi kufanya maamuzi yenye athari za kisheria au athari kubwa zinazofanana.',
        },
        {
          title: 'Watoa huduma na kushiriki taarifa',
          body: 'Mama Air haiuzi taarifa binafsi. Taarifa chache zinaweza kushughulikiwa na watoa huduma za kuhifadhi mtandaoni, kutuma barua pepe, usalama na usaidizi wa kiufundi wanaosaidia kuendesha huduma. Google au Firebase hushughulikia taarifa za kuingia unapochagua njia hizo. HERE na OpenWeather zinaweza kushughulikia viwianishi vinavyohitajika kurudisha matokeo yanayotegemea eneo. Tunaweza pia kutoa kiwango cha chini cha taarifa kinachohitajika kisheria, kulinda watumiaji au huduma, au wakati wa kuhamisha biashara kwa taarifa na ulinzi unaofaa. Hatushiriki eneo sahihi, taarifa za ujauzito au taarifa za ustawi na mitandao ya matangazo.',
        },
        {
          title: 'Matangazo na hifadhi ya kifaa',
          body: 'Mama Air inaweza kuonyesha maudhui ya matangazo yaliyochaguliwa na programu au muktadha wa jumla wa programu. Eneo sahihi, taarifa za ujauzito na taarifa za ustawi hazitumiki kubinafsisha matangazo, na programu ya sasa haina kifurushi cha matangazo cha mtu mwingine. Kwenye kifaa chako, taarifa za akaunti zinalindwa na Android Keystore au iOS Keychain na hifadhi nyeti ya programu imesimbwa. Hifadhi ya kifaa inaweza kujumuisha mapendeleo, maendeleo, mipangilio ya arifa, matukio machache ya matumizi na maeneo yanayosubiri kutumwa. Kuondoka kwenye akaunti hufuta maeneo yanayosubiri yanayohusishwa na akaunti, matukio ya ndani yanayosubiri na arifa zilizopangwa.',
        },
        {
          title: 'Muda wa kuhifadhi',
          body: 'Taarifa za akaunti, wasifu, ujauzito, maisha, ustawi, maendeleo, mapendekezo, mwendo na mfiduo huhifadhiwa wakati zinahitajika kutoa akaunti hai na hufutwa pamoja na akaunti. Maeneo yanayosubiri kwenye kifaa huhifadhiwa kwa muda usiozidi siku saba na huondolewa mapema baada ya kutumwa, kuondoka kwenye akaunti au kufuta akaunti. Tokeni za uthibitishaji hubaki hadi muda wake kuisha, kufutwa, kuondoka au kufuta akaunti. Rekodi za uthibitishaji na kuweka upya nenosiri huondolewa baada ya kutumika au muda wake kuisha. Kumbukumbu za uendeshaji na usalama hufutwa au kuondolewa utambulisho kabisa ndani ya siku 30. Nakala rudufu zilizosimbwa huzungushwa na kuandikwa upya ndani ya siku 30; maombi ya kufuta yaliyokamilishwa hutekelezwa tena ikiwa nakala rudufu itarejeshwa. Ikiwa sheria au kuzuia udanganyifu kunahitaji uhifadhi mdogo, kiwango cha chini tu huhifadhiwa kwa muda husika na kutengwa na matumizi ya kawaida.',
        },
        {
          title: 'Kufuta akaunti',
          body: 'Unaweza kufuta akaunti yako kabisa katika Mipangilio ya Programu au kupitia https://api.mamaair.work/delete-account bila kusakinisha programu tena. Baada ya umiliki kuthibitishwa na ufutaji kuthibitishwa, Mama Air hufuta akaunti na taarifa zake za wasifu, ujauzito, ustawi, maisha, eneo, mfiduo, vikumbusho, maendeleo, kazi, mapendekezo na uthibitishaji, na kubatilisha vipindi na tokeni zote hai za Mama Air. Kufuta akaunti ya Mama Air hakufuti akaunti tofauti ya Google au Firebase. Kuondoa programu pekee hakufuti taarifa zilizokwisha kutumwa.',
        },
        {
          title: 'Chaguo na haki zako',
          body: 'Unaweza kurekebisha taarifa za wasifu zinazopatikana, kuzima ufuatiliaji katika Mipangilio ya Faragha na kudhibiti ruhusa katika mipangilio ya kifaa. Kulingana na mahali unapoishi, unaweza kuomba kufikia, kusahihisha, kupokea, kuzuia au kufuta taarifa zako, kupinga aina fulani za uchakataji, kuondoa idhini au kulalamika kwa mamlaka ya ulinzi wa data. Wasiliana na service@mamaair.work kuwasilisha ombi la faragha. Tunaweza kuomba taarifa chache kuthibitisha utambulisho wako. Usitume manenosiri, viwianishi sahihi au taarifa nyeti kwa barua pepe.',
        },
        {
          title: 'Umri na usalama',
          body: 'Mama Air imekusudiwa watu wenye umri wa miaka 18 au zaidi pekee. Tarehe za kuzaliwa zisizo sahihi au za baadaye na usajili wa watu walio chini ya miaka 18 hazikubaliki. Tunatumia HTTPS, hifadhi ya kifaa iliyosimbwa, ulinzi wa taarifa za kuingia, udhibiti wa ufikiaji, kubatilisha vipindi, kupunguza data na kanuni za kumbukumbu zinazokusudiwa kutojumuisha manenosiri, tokeni, viwianishi sahihi na taarifa nyeti za ujauzito na ustawi. Hakuna huduma ya kielektroniki inayoweza kuhakikisha usalama kamili. Ripoti tatizo la faragha au usalama kwa service@mamaair.work.',
        },
        {
          title: 'Uchakataji wa kimataifa na mabadiliko ya sera',
          body: 'Mama Air na watoa huduma wake wanaweza kushughulikia taarifa katika nchi nyingine tofauti na nchi unayoishi. Inapohitajika, ulinzi unaofaa wa kimkataba, kiutawala au kiufundi hutumiwa. Tunaweza kusasisha sera hii vipengele, watoa huduma, mahitaji ya kisheria au namna ya kushughulikia data vinapobadilika. Toleo lililosasishwa litaendelea kupatikana katika programu na https://api.mamaair.work/privacy-policy pamoja na tarehe mpya ya kuanza kutumika. Mabadiliko makubwa yatatolewa taarifa au kuombewa idhini ya ziada inapohitajika.',
        },
      ],
    },
    terms: {
      title: 'Masharti ya Matumizi',
      introduction: 'Masharti haya yanaeleza matumizi ya programu ya Mama Air. Pata maelezo zaidi katika mamaair.africa.',
      sections: [
        { title: 'Akaunti yako', body: 'Toa taarifa sahihi za akaunti, linda taarifa zako za kuingia na tumia akaunti yako pekee. Tumia programu kwa mujibu wa sheria na usivuruge utendaji wake.' },
        { title: 'Huduma ya programu', body: 'Mama Air hutoa maudhui ya elimu kuhusu ujauzito, taarifa za hali yako, taarifa za mazingira, Mipango ya Kila Siku na mapendekezo. Vipengele vinaweza kubadilika, na vingine hutegemea ruhusa za kifaa au taarifa za wengine.' },
        { title: 'Si huduma ya matibabu', body: 'Mama Air si huduma ya dharura na haitambui, haitibu wala kuzuia ugonjwa. Taarifa na mapendekezo yake hayachukui nafasi ya ushauri wa mtaalamu wa matibabu. Wasiliana na mtoa huduma kwa dalili zinazokutia wasiwasi. Katika dharura, wasiliana na huduma za dharura za eneo lako.' },
        { title: 'Usahihi na maamuzi', body: 'Vipimo vya mazingira, utambuzi wa eneo, makadirio na mapendekezo vinaweza kuwa havijakamilika, vimechelewa au si sahihi. Usifanye maamuzi ya matibabu au usalama kwa kutegemea programu pekee. Unawajibika kwa taarifa unazoingiza na jinsi unavyotumia matokeo.' },
        { title: 'Maudhui na upatikanaji', body: 'Mama Air na watoa leseni wake wanahifadhi haki za programu na maudhui yake. Unaweza kuyatumia binafsi ndani ya huduma. Huduma inaweza kukatizwa au kubadilishwa, ikiwemo kwa matengenezo au usalama.' },
        { title: 'Faragha na ruhusa', body: 'Sera ya Faragha inaeleza jinsi taarifa zinavyoshughulikiwa. Ruhusa za eneo na arifa ni chaguo tofauti. Kukubali masharti haya hakuwashi ufuatiliaji wa eneo wa hiari.' },
        { title: 'Kuacha kutumia na mabadiliko', body: 'Unaweza kuacha kutumia programu na kuanzisha kufuta akaunti katika mipangilio yake. Masharti haya yanaweza kusasishwa huduma inapobadilika. Hakuna sehemu inayopunguza haki ambazo haziwezi kupunguzwa kisheria.' },
      ],
    },
  },
};
