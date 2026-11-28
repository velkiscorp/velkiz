// Velkiz Terms of Service, Privacy Policy and Community Guidelines.
//
// Written by the Velkiz team, then checked line by line against how the app
// actually works (disappearing chats, one-time media, screenshot notices,
// city-based location, calls). If a feature changes, change the matching
// sentence here too, because Apple and users hold us to what these say.
//
// Still open:
// - GDPR Art. 27 / UK GDPR: a non-EU operator with EU or UK users usually
//   needs a representative in the EU and the UK. Name them in the GDPR section
//   once appointed.

export const LEGAL = {
  appName: 'Velkiz',
  operatorName: 'Anshika Pant',
  // How the policies name who runs Velkiz
  operator: 'Anshika Pant, an individual based in Bengaluru, Karnataka, India',
  operatingLocation: 'Bengaluru, Karnataka, India',
  governingLaw: 'India',
  courts: 'Bengaluru, Karnataka, India',
  grievanceOfficer: 'Anshika Pant',
  grievanceEmail: 'grievance@velkiz.com',
  supportEmail: 'support@velkiz.com',
  privacyEmail: 'privacy@velkiz.com',
  website: 'https://velkiz.com',
  lastUpdated: 'November 28, 2026',
}

const { appName: APP, operator: OP, operatorName: NAME, supportEmail: SUPPORT, privacyEmail: PRIVACY } = LEGAL
const GRIEVANCE = `Grievance Officer: ${LEGAL.grievanceOfficer}, ${LEGAL.grievanceEmail}, ${LEGAL.operatingLocation}.`
const NOT_A_COMPANY = `${APP} is independently operated by ${NAME} and is not a separately incorporated company.`

// Each document: a title, a short intro, and sections of paragraphs (p),
// then bullet lists (list), then paragraphs after the list (after).

export const TERMS = {
  title: 'Terms of Service',
  intro: `These Terms of Service ("Terms") govern your use of ${APP} ("${APP}", "we", "us" or "our"), including our iOS app and related services. ${APP} is independently operated by ${OP} (the "Operator"), and is not a separately incorporated company. By creating an account or using ${APP}, you agree to these Terms, our Privacy Policy and our Community Guidelines. If you do not agree, do not use ${APP}.`,
  sections: [
    {
      h: '1. Who can use Velkiz',
      p: [`You may use ${APP} only if:`],
      list: [
        'You are at least 18 years old.',
        'You can legally enter into a binding agreement.',
        'You are not barred by law from using the service.',
        'You create and keep only one account, for yourself.',
        'The information you give us is accurate and not misleading.',
      ],
      after: ['We may restrict or close accounts where we have reasonable grounds to believe these requirements are not met.'],
    },
    {
      h: '2. Zero tolerance for abuse',
      p: [`There is no tolerance on ${APP} for objectionable content or abusive users. The following are banned:`],
      list: [
        'Harassment, threats, bullying, intimidation or stalking.',
        'Hate speech or targeted abuse.',
        'Sexual content involving minors, and child sexual exploitation or grooming.',
        'Non-consensual intimate images or videos, or sharing intimate content without the consent of the person shown.',
        'Sexual coercion, blackmail or extortion.',
        'Fraud, scams, impersonation or deceptive activity.',
        'Illegal content or activity.',
        'Any attempt to exploit, harm or endanger other users.',
      ],
      after: ['We review reports, usually within 24 hours, remove content that breaks these rules, and restrict, suspend or permanently ban the accounts responsible. We may report serious matters to the appropriate authorities where the law requires or permits it.'],
    },
    {
      h: '3. Your account',
      p: ['You are responsible for keeping your login details private and for what happens on your account. You agree to:'],
      list: [
        'Give accurate registration information.',
        'Keep your login details secure, and tell us straight away if you think someone else has used your account.',
        'Not share your account with anyone.',
        'Not create more accounts to get around restrictions, blocks or bans.',
      ],
      after: ['We may suspend or restrict accounts where we reasonably suspect fraud, impersonation, a security risk or a breach of these Terms.'],
    },
    {
      h: '4. Your content',
      p: [
        `You keep ownership of the photos, videos, voice messages, profile information, messages and other content you create or upload to ${APP} ("User Content"), subject to the rights of other people.`,
        'By uploading or sharing User Content, you give the Operator a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, display, transmit and process it only as reasonably needed to:',
      ],
      list: [
        `Run and provide ${APP}, including showing your profile and content to the people allowed to see it.`,
        'Deliver messages and media between users.',
        'Provide safety, moderation and reporting.',
        'Maintain, secure and fix the service.',
        'Meet our legal obligations.',
      ],
      after: [
        'This licence ends when you delete the content or your account, except for copies kept for a limited time as our Privacy Policy describes.',
        'You confirm that you own the content you upload or have permission to use it, that you have consent from anyone else shown in it, and that it does not break these Terms, the law or anyone else\'s privacy, publicity or intellectual property rights.',
      ],
    },
    {
      h: '5. Rules of conduct',
      p: [`When using ${APP}, you agree not to:`],
      list: [
        'Pretend to be someone else, or create a fake or misleading profile.',
        'Harass, threaten, stalk, bully or intimidate anyone.',
        'Share hateful, violent, exploitative or illegal content.',
        'Share intimate photos or videos without consent.',
        'Try to uncover or reveal another user\'s real identity, location or personal information without their permission.',
        'Record, screenshot, download, redistribute or publish another user\'s private content, calls or messages without their permission.',
        `Use ${APP} to ask for money, run scams, or promote any commercial activity.`,
        `Use ${APP} for sex trafficking, exploitation or commercial sexual activity.`,
        'Use bots, scrapers or other automated means to access the service.',
        `Reverse engineer, interfere with or try to compromise ${APP}.`,
        'Get around account restrictions, blocks, reporting or security.',
        'Manipulate matches, likes, purchases or other features.',
      ],
      after: ['Respect other users\' boundaries, consent and privacy at all times.'],
    },
    {
      h: '6. Disappearing chats, one-time media and calls',
      list: [
        'Chats disappear. Once both people have opened a chat, it is deleted 36 hours later, with all its messages, photos, videos and voice messages, unless you both tap Keep chat.',
        'Photos and videos are one-time view by default. A one-time photo closes a few seconds after it is opened, and a one-time video plays once. The sender can turn one-time view off before sending, and then the media stays in the chat until the chat ends.',
        'Voice and video calls are never recorded by us.',
        'Screenshots and screen recordings of chats are blocked where iOS allows it, and the other person is told when we detect an attempt.',
      ],
      after: [
        'Disappearing content and screenshot protection do not guarantee that content cannot be kept. Someone can still photograph their screen with another device. Think about that risk before sharing anything sensitive or intimate.',
        'You must never share another person\'s intimate content without their explicit consent.',
      ],
    },
    {
      h: '7. Safety',
      p: [
        `${APP} helps people discover and talk to each other. We do not guarantee that users are who they say they are, that profiles are accurate, or that any interaction will be safe. We do not run criminal background checks or verify every user\'s identity.`,
        'Be careful when talking to or meeting anyone:',
      ],
      list: [
        'Don\'t share sensitive personal information too quickly.',
        'Never send money to someone you have only met through the app.',
        'Meet in public the first time, and tell someone you trust where you are going.',
        'Report suspicious, threatening or abusive behaviour.',
      ],
      after: ['If you are in immediate danger, contact local emergency services first.'],
    },
    {
      h: '8. Reporting, moderation and appeals',
      p: ['You can report profiles, messages or other content you believe break these Terms or our Community Guidelines, and block anyone at any time. We review reports and may:'],
      list: [
        'Remove content.',
        'Restrict features.',
        'Issue warnings.',
        'Suspend accounts temporarily.',
        'Close accounts permanently.',
        'Report serious violations to the authorities where appropriate.',
      ],
      after: [
        'We may act with or without notice where needed to protect users, comply with the law or prevent harm. Where reasonably possible, we will explain significant enforcement decisions, unless the law, someone\'s safety or an investigation prevents it.',
        `Appeals: if you think a suspension, account closure or content removal was wrong, email ${SUPPORT} with your username, the decision, and why it should be reconsidered. Where practicable, someone who was not involved in the original decision will review it.`,
      ],
    },
    {
      h: '9. Deleting your account',
      p: [
        'You can delete your account at any time in Settings. We then delete your information as our Privacy Policy describes. Some information may be kept for longer where needed for legal compliance, fraud prevention, security, resolving disputes, enforcing these Terms or responding to lawful requests.',
        'We may suspend or close your access if you break these Terms, put other users at risk, misuse the service, or expose us to legal or security risk.',
      ],
    },
    {
      h: '10. Paid features and Super Likes',
      p: [
        `${APP} is free to use. Everyone gets one free Super Like every 24 hours, and you can buy packs of extra Super Likes in the iOS app. Purchases are made through Apple\'s App Store, and Apple\'s payment terms apply to billing and refunds. We never see or store your card details.`,
        'Unless the law or Apple\'s policies say otherwise:',
      ],
      list: [
        'Purchased Super Likes do not expire, have no cash value and cannot be transferred to another account.',
        'A Super Like is used up when you send it, even if you later undo it.',
        'If Apple refunds a purchase, the unused Super Likes from it are removed.',
        'Unused Super Likes are lost when you delete your account.',
      ],
      after: ['Nothing here affects your rights under mandatory consumer protection laws.'],
    },
    {
      h: '11. Intellectual property',
      p: [`${APP} and its software, branding, logos, designs and features are owned by or licensed to the Operator. You may not copy, reproduce, distribute, modify, reverse engineer or commercially exploit any part of ${APP} without written permission, except where the law allows. Nothing in these Terms transfers ownership of ${APP}\'s intellectual property to you.`],
    },
    {
      h: '12. Third-party services',
      p: [`${APP} relies on third-party services, including Apple, hosting, login, email, calling and purchase services. Their own terms and privacy policies may also apply to you. We are not responsible for services run independently by third parties, except where the law says otherwise.`],
    },
    {
      h: '13. Disclaimers',
      p: [`To the fullest extent the law allows, ${APP} is provided "as is" and "as available". We do not promise that the service will always be available or error-free, that every profile is accurate, that every report will lead to removal or a ban, that you will find a match, or that every interaction will be safe. We may change, suspend or stop features when reasonably needed. Nothing in this section excludes warranties or consumer rights that cannot legally be excluded.`],
    },
    {
      h: '14. Limitation of liability',
      p: [
        'To the fullest extent the law allows, the Operator is not liable for indirect, incidental, special, punitive or consequential losses arising from your use of Velkiz, including losses from interactions with or conduct of other users, user content, service interruptions, loss of data, or unauthorised access beyond our reasonable control.',
        'Our total liability to you is limited to the greater of the amount you paid us in the 12 months before the claim arose and ₹10,000. This does not limit any liability that cannot legally be limited, including mandatory consumer protection rights.',
      ],
    },
    {
      h: '15. Apple App Store',
      p: [`If you downloaded ${APP} from the Apple App Store:`],
      list: [
        `These Terms are between you and the Operator, not Apple. Apple is not responsible for ${APP} or its content.`,
        `Apple has no obligation to provide maintenance or support for ${APP}.`,
        `If ${APP} fails to meet any applicable warranty, you may notify Apple, and Apple may refund the purchase price (if any). Apple has no other warranty obligation for ${APP}.`,
        `Apple is not responsible for any claims relating to ${APP}, including product liability claims, claims that it fails to meet legal requirements, and consumer protection or privacy claims.`,
        `Apple is not responsible for investigating, defending, settling or discharging any claim that ${APP} infringes someone else\'s intellectual property.`,
        'You confirm you are not in a country subject to a US government embargo and are not on any US government list of prohibited or restricted parties.',
        'Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.',
      ],
    },
    {
      h: '16. Privacy',
      p: [`Our Privacy Policy explains how we collect, use, store, share and protect personal information, including profile information, location, photos, videos, calls and private messages. Our processing remains subject to applicable data protection laws, including India\'s Digital Personal Data Protection Act, 2023, as its provisions come into force.`],
    },
    {
      h: '17. Changes to these Terms',
      p: [`We may update these Terms. If a change is material, we will tell you in the app before it takes effect and, where the law requires, ask for your consent. If you keep using ${APP} after the change takes effect, you accept the new Terms. If you do not agree, stop using ${APP} and delete your account.`],
    },
    {
      h: '18. Complaints and disputes',
      p: [
        `If you have a complaint, email ${SUPPORT} and tell us what happened and what outcome you want. We acknowledge complaints within 24 hours and aim to resolve them within 7 days, or sooner where the law requires.`,
        `For complaints under Indian law: ${GRIEVANCE}`,
        'Nothing here stops you from going to a consumer protection authority, a court or a data protection authority.',
      ],
    },
    {
      h: '19. Governing law',
      p: [
        `These Terms are governed by the laws of ${LEGAL.governingLaw}, and, subject to applicable law, disputes may be brought before the competent courts in ${LEGAL.courts}.`,
        'If you live in the EU, the EEA or the UK, you keep the protection of the mandatory consumer laws of the country where you live and can bring proceedings there.',
        'If you live in the United States, you can bring a qualifying claim in your local small claims court.',
      ],
    },
    {
      h: '20. Severability and entire agreement',
      p: [`If any part of these Terms is found invalid or unenforceable, it is limited or removed only as far as necessary, and the rest still applies. These Terms, with our Privacy Policy and Community Guidelines, are the whole agreement between you and the Operator about ${APP}.`],
    },
    {
      h: '21. Contact',
      p: [
        `Support, account issues and complaints: ${SUPPORT}. Privacy: ${PRIVACY}.`,
        GRIEVANCE,
        `Operator: ${NAME}, ${LEGAL.operatingLocation}. ${NOT_A_COMPANY}`,
      ],
    },
  ],
}

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  intro: `${APP} ("${APP}", "we", "us" or "our") is a dating app independently operated by ${OP} (the "Operator"). ${APP} lets adults create profiles, discover each other, match, chat, call and share photos and videos. You choose how much of yourself to reveal to other people. That does not make your information invisible to us or to the service providers that help us run the app. This policy explains what we collect, how we use and share it, how long we keep it, and your choices and rights. Where the law requires your consent, we ask for it before processing.`,
  sections: [
    {
      h: '1. Information you give us',
      list: [
        'Account details: your email address and password. The password is stored only as a secure hash by our login provider. If you use Sign in with Apple, we get the email address Apple provides instead, which can be a private relay address if you choose "Hide My Email", and no password.',
        'Date of birth, used to confirm you are 18 or older and to show your age if you choose. Your date of birth itself is never shown.',
        'Profile details you choose to add: username, gender, sexual orientation, what you are looking for, height, whether you are a couple, bio, interests, prompt answers and photos.',
        'Your city and country, which you choose during sign-up.',
        'Messages, photos, videos and voice messages you send to your matches. Photos are re-saved on your phone before sending, which removes hidden details such as where they were taken.',
        'Voice and video calls: when a call happened, whether it was answered and how long it lasted. We never record calls, and the sound and video are not stored.',
        'Your likes, passes, matches, keep-chat choices, blocks and reports.',
        'Messages you send to our support team.',
      ],
    },
    {
      h: '2. Information collected when you use Velkiz',
      list: [
        'Approximate location: we look up the centre of the city you chose, to show approximate distances. We do not use your phone\'s GPS. Other people only see an approximate distance and, unless you hide it, your city.',
        'When you were last active.',
        'Technical information such as your IP address, device type, operating system and app version, kept in server logs to keep the service secure and stop spam, abuse and bulk sign-ups.',
        'If you turn on push notifications, a device token that lets us send notifications to your phone.',
        'Screenshot notices: when the app detects a screenshot in a chat, it records that one happened so the other person can be told.',
        'If you buy Super Likes, a record of the purchase (which pack, when, and a transaction reference). Payment is handled by Apple, and we never see your card details.',
      ],
    },
    {
      h: '3. Sensitive information',
      p: [
        'Some information you choose to share may be sensitive under privacy laws: your sexual orientation, gender or relationship details, details about your sex life, and the content of your messages, photos and videos.',
        'We use your orientation and what you are looking for only to decide who you see in Discover and who sees you. You do not have to fill in every detail, and you can change or remove optional details at any time in My Profile. Where the law requires consent for this, adding the detail to your profile is that consent, and removing it withdraws it.',
      ],
    },
    {
      h: '4. How we use your information',
      list: [
        'To create, run and secure your account.',
        'To show your profile to the people allowed to see it, and suggest people to you.',
        'To deliver messages, photos, videos, voice messages and calls.',
        'To make chats disappear on time, make one-time media disappear after viewing, and tell people about screenshot attempts.',
        'To confirm everyone is 18 or older.',
        'To review reports, enforce blocks and our rules, and find fake, spam or abusive accounts.',
        'To send service emails (such as verifying your email or resetting your password) and, if you allow it, notifications.',
        'To process Super Like purchases.',
        'To fix problems, keep the service reliable and meet our legal obligations.',
      ],
      after: [
        'We do not sell your personal information, share it for advertising, or use it to build advertising profiles.',
        `AI: ${APP} does not offer AI-generated profiles, photos, videos or messages. Users create their own profiles and content.`,
      ],
    },
    {
      h: '5. What other people can see',
      list: [
        'In Discover: your username, age (if you show it), bio, first photo, interests, what you are looking for, height, couple tag, country, your city (unless you hide it) and an approximate distance.',
        'People you match with can also see all your photos, your gender, orientation, prompt answers and when you were last active.',
        'Other people never see your email address, date of birth, exact location, or the reports you make.',
        'Your matches see the messages and media you send them. Phone numbers in chats are hidden until tapped.',
      ],
      after: ['Using a pseudonym or sharing little does not guarantee complete anonymity. Others may recognise you from photos, videos or messages you choose to share.'],
    },
    {
      h: '6. Disappearing chats and one-time media',
      p: [
        'Chats disappear: once both people have opened a chat, it is permanently deleted 36 hours later, with all its messages, photos, videos and voice messages, unless you both tap Keep chat. Unsent messages and deleted chats are removed for both people straight away.',
        'Photos and videos are one-time view by default. When the recipient opens one, the file is deleted from our storage. A one-time photo you haven\'t opened stays until you open it or the chat ends. The sender can turn one-time view off, in which case the media stays until the chat ends.',
        'Deleted content may remain in encrypted backups for up to 30 days before it is overwritten. Recipients can still remember what they saw, or photograph their screen with another device, so only share what you are comfortable with them keeping.',
      ],
    },
    {
      h: '7. Screenshot protection',
      p: ['Where iOS allows it, the app tries to block screenshots and screen recordings of chats, and hides the screen in the app switcher. When we detect a screenshot attempt, we tell the other person. These protections depend on Apple\'s iOS and your device, and we cannot guarantee that every capture is prevented.'],
    },
    {
      h: '8. Who we share it with',
      p: [`We share information only with service providers that help us run ${APP}:`],
      list: [
        'Supabase: database, login and photo and media storage.',
        'Resend: email delivery.',
        'LiveKit: carries voice and video calls between matches, so neither person sees the other\'s IP address. Calls are not recorded or stored.',
        'Render: server hosting. Netlify: website hosting.',
        'Apple: Sign in with Apple, push notifications and in-app purchases.',
        'RevenueCat: confirms in-app purchases with Apple. It receives your account ID (a random identifier, not your name or email) and your purchase history.',
      ],
      after: [`We may also share information when the law, a court order or a lawful government request requires it; to investigate fraud, security incidents, abuse or illegal activity; to protect the safety of our users or others; or if ${APP} is merged, sold or transferred, in which case this policy still applies to your information.`],
    },
    {
      h: '9. How long we keep it',
      p: [
        'We keep your information while your account is open, except for chats and media, which disappear as described above.',
        'When you delete your account in Settings, we permanently delete your profile, photos, matches, messages, likes, blocks and login straight away. Copies may remain in encrypted backups for up to 30 days. We may keep limited records longer where the law requires it, to deal with a safety report, to prevent fraud or abuse, or to resolve disputes.',
      ],
    },
    {
      h: '10. Your choices and rights',
      list: [
        'Edit or remove profile details at any time in My Profile.',
        'Hide your city or your age.',
        'Turn notifications on or off in Settings or your phone\'s settings.',
        'Choose whether each photo or video is one-time view.',
        'Block anyone, and report anyone who breaks our rules.',
        'Delete your account and your data in Settings.',
        `Ask for a copy of your data, or for it to be corrected, by emailing ${PRIVACY}. We may need to confirm it\'s really you first.`,
      ],
    },
    {
      h: '11. If you are in the EU, EEA or UK (GDPR)',
      p: [`Under the GDPR or UK GDPR, the Operator is the controller of your personal data. We rely on these legal bases:`],
      list: [
        'Contract: to create your account, show your profile, suggest matches, deliver messages and calls, and provide Super Likes you buy.',
        'Explicit consent: to use your sexual orientation and anything about your sex life you choose to share, only to decide who you see and who sees you. You can withdraw it at any time by removing it from your profile or deleting your account.',
        'Consent: for push notifications, which you can turn off at any time.',
        'Legitimate interests: to keep the service safe and secure, prevent fraud, spam and abuse, and enforce our rules, where your rights do not outweigh these interests.',
        'Legal obligation: where the law requires us to keep or share information.',
      ],
      after: [
        `You have the right to access, correct or delete your data, to restrict or object to how we use it, to receive a portable copy, and to withdraw consent at any time without affecting earlier processing. Email ${PRIVACY} and we will reply within one month.`,
        'You can also complain to your local data protection authority (in the UK, the Information Commissioner\'s Office).',
        'We do not make decisions about you based solely on automated processing that have legal or similarly significant effects. Who appears in Discover depends on the filters you set and the information on your profile.',
      ],
    },
    {
      h: '12. If you are in California or another US state',
      p: ['Depending on where you live, US state privacy laws (such as California\'s CCPA as amended by the CPRA) may give you specific rights. We collect these categories of personal information, for the purposes in this policy:'],
      list: [
        'Identifiers: email address, account ID, IP address and device token.',
        'Personal characteristics: age, gender and, if you add it, sexual orientation.',
        'Commercial information: Super Like purchases.',
        'App activity: likes, passes, matches and when you were last active.',
        'Approximate location: the city you choose.',
        'User content: photos, videos, voice messages, profile information and messages.',
        'Sensitive personal information: your login, sexual orientation and the content of your messages, used only to provide and protect the service.',
      ],
      after: [
        'We do not sell personal information or share it for cross-context behavioural advertising, and we do not knowingly sell or share information about anyone under 16.',
        `You can ask to know what we collect and how we use it, get a copy, have it corrected or deleted, and appeal a decision on your request, without being treated differently for doing so. Email ${PRIVACY} from the email address on your account, or delete your account in Settings. An authorised agent can make a request for you with your written permission. We respond within the time the law requires.`,
      ],
    },
    {
      h: '13. Security',
      p: ['Photos and media are stored privately and only load for people allowed to see them. Data is encrypted in transit, and access to our systems is restricted. No service is perfectly secure, so avoid sharing anything you would not want someone else to keep or disclose.'],
    },
    {
      h: '14. Age limit',
      p: [`${APP} is only for adults aged 18 and over. Everyone enters their date of birth when signing up. This is a declaration, not an identity or age verification. We do not knowingly allow anyone under 18 to use ${APP}. If you believe a minor is using it, report their profile or email ${SUPPORT}, and we will investigate and remove underage accounts.`],
    },
    {
      h: '15. International transfers',
      p: [`${APP} is run from India, and our service providers may store and process data in other countries, including the United States and the European Union. Where the law requires, we use safeguards such as standard contractual clauses.`],
    },
    {
      h: '16. Changes to this policy',
      p: ['If we make a material change, we will tell you in the app before it takes effect, and the "Last updated" date above will change.'],
    },
    {
      h: '17. Contact and Grievance Officer (India)',
      p: [
        `Privacy: ${PRIVACY}. Support: ${SUPPORT}.`,
        `${GRIEVANCE} We acknowledge grievances within 24 hours and aim to resolve them within 7 days, or sooner where the law requires. Nothing here stops you from approaching a consumer protection authority, court or data protection authority.`,
        `Operator: ${NAME}, ${LEGAL.operatingLocation}. ${NOT_A_COMPANY}`,
      ],
    },
  ],
}

export const GUIDELINES = {
  title: 'Community Guidelines',
  intro: `${APP} is a place to meet people and connect on your own terms. You decide how much of your identity you share, and you treat everyone else with respect. These guidelines apply to everything on ${APP}: profiles, photos, videos, voice messages, calls and chats. Break them and we may remove content, restrict features, or suspend or permanently ban your account. Serious violations may be reported to the authorities.`,
  sections: [
    {
      h: '1. Respect privacy and anonymity',
      list: [
        'Respect each person\'s choice about how much of their identity they reveal.',
        'Never pressure anyone into sharing their real name, phone number, address, workplace or social media.',
        'Never try to identify, track, locate or expose someone without their consent.',
        `Never share someone\'s private information, chats, photos, videos or calls outside ${APP}.`,
        'Never use something shared in private to threaten, embarrass, blackmail or harass someone.',
      ],
      after: ['Screenshot protection does not make it okay to try. The other person is told when we detect a screenshot.'],
    },
    {
      h: '2. Consent comes first',
      list: [
        'Don\'t send sexual or intimate content to anyone who hasn\'t clearly said they want it.',
        'Respect boundaries straight away. If someone says no, asks you to stop, stops replying or blocks you, stop.',
        'Never pressure, threaten or manipulate anyone into sending photos, videos, personal details or meeting up.',
        'Never share or threaten to share anyone\'s intimate images without their explicit consent.',
        'Consent to one thing is not consent to anything else.',
      ],
    },
    {
      h: '3. Be real',
      list: [
        'Use real photos of yourself. No stolen photos, celebrities, or AI images that impersonate a real person.',
        'Couples must tag their profile as a couple.',
        'One account per person. No new accounts to get around restrictions, bans or blocks.',
        'Don\'t lie about your age or other important details.',
      ],
    },
    {
      h: '4. Never allowed',
      list: [
        'Anyone under 18, or any sexual, exploitative or suggestive content involving minors, including grooming. We remove it, preserve evidence, and report it to the authorities.',
        'Harassment, bullying, stalking, threats or repeated unwanted contact.',
        'Hate speech, or attacks on anyone for their race, ethnicity, nationality, religion, gender, sexuality, disability or anything else about who they are.',
        'Doxxing, blackmail or extortion.',
        'Pornographic or sexually explicit photos or videos, non-consensual intimate imagery, sexual exploitation, prostitution or trafficking.',
        'Scams, phishing, asking for money or gifts, selling, advertising, spam, or sending people to suspicious sites or payment channels.',
        'Violence, encouraging self-harm, or anything illegal.',
      ],
    },
    {
      h: '5. Reporting and blocking',
      p: [
        `If someone makes you uncomfortable or breaks these rules, tap Report on their profile, in the chat or during a call, or block them at any time. You can also email ${SUPPORT}.`,
        'The person you report is never told who reported them. We review every report, usually within 24 hours, and act based on how serious it is: removing content, restricting or suspending the account, or banning it permanently.',
        'If you are in danger, contact local emergency services first. In-app reports are not an emergency service.',
      ],
    },
    {
      h: '6. How we enforce these guidelines',
      p: ['We consider how serious the behaviour is, whether it is repeated, and the harm it caused. Trying to get around enforcement, with a new account, someone else\'s account or another way of contacting people, leads to further restrictions.'],
    },
    {
      h: '7. Our commitment',
      p: [
        `${APP} is built around choice, privacy and respect. Anonymity never excuses harmful behaviour, and being open about what you want never removes the need for consent. By using ${APP}, you agree to follow these guidelines and our Terms of Service.`,
        `Support: ${SUPPORT}. Privacy: ${PRIVACY}. Operator: ${NAME}, ${LEGAL.operatingLocation}.`,
      ],
    },
  ],
}

export const LEGAL_DOCS = { privacy: PRIVACY_POLICY, terms: TERMS, guidelines: GUIDELINES }
