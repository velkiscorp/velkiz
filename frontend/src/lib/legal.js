// Velkiz Privacy Policy, Terms of Service and Community Guidelines.
//
// DRAFTS. These are a starting point written to match how the app actually
// works today. They are not legal advice: have a lawyer in your country read
// them before launch, especially the sections on sensitive data, governing
// law and liability.
//
// Velkiz is run by a small team of independent developers in India, not a
// registered company. If that changes (a company is registered), update
// `operator` and the governing law here. The one bracket left is the name of
// the Grievance Officer, which Indian law asks apps to publish.

export const LEGAL = {
  appName: 'Velkiz',
  // How the policies name who runs Velkiz
  operator: 'a small team of independent developers based in India',
  governingLaw: 'India',
  grievanceOfficer: '[GRIEVANCE OFFICER NAME]',
  grievanceEmail: 'grievance@velkiz.com',
  supportEmail: 'support@velkiz.com',
  privacyEmail: 'privacy@velkiz.com',
  website: 'https://velkiz.com',
  lastUpdated: 'November 26, 2026',
}

const { appName: APP, operator: OP, governingLaw: LAW, supportEmail: SUPPORT, privacyEmail: PRIVACY } = LEGAL

// Each document: a title, a short intro, and sections of paragraphs (p),
// then bullet lists (list), then paragraphs after the list (after).
export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  intro: `${APP} is an anonymous dating app run by ${OP} ("we", "us"), not a registered company. Anonymity is the point of ${APP}, so we collect as little as we can, never sell your data, and never show other people your email or exact location. This policy explains what we collect, why, and the choices you have.`,
  sections: [
    {
      h: 'What we collect',
      p: ['Information you give us:'],
      list: [
        'Account details: your email address and password (the password is stored only as a secure hash by our login provider).',
        'Date of birth, used to confirm you are 18 or older and to show your age if you choose. We never show your date of birth itself.',
        'Profile details you choose to add: username, gender, sexual orientation, what you are looking for, height, whether you are a couple, bio, interests, prompt answers and photos.',
        'Messages you send to your matches.',
        'Your likes, passes, matches, blocks and any reports you make.',
        'Messages you send to our support team.',
      ],
    },
    {
      p: ['Information collected when you use the app:'],
      list: [
        'Approximate location. If you allow it, we use your location to show you people nearby. We store it rounded to about 1 km, and other people only ever see an approximate distance and, unless you hide it, your city.',
        'When you were last active.',
        'Technical information such as your IP address, device type and app version, kept in server logs to keep the service secure and to stop abuse such as spam and bulk sign-ups.',
        'If you turn on push notifications, a device token that lets us send notifications to your phone.',
      ],
    },
    {
      h: 'Sensitive information',
      p: [`Your sexual orientation, and details about your sex life that you choose to share, are sensitive information. We use your orientation only to decide who you see in Discover and who sees you. By adding it to your profile you agree to us using it this way. You can change or remove it at any time by editing your profile or deleting your account.`],
    },
    {
      h: 'How we use your information',
      list: [
        'To run the app: create your account, show your profile to people who may see it, suggest people to you, and deliver messages.',
        'To keep people safe: confirm everyone is 18+, enforce blocks, review reports, and find and remove fake, abusive or illegal accounts.',
        'To keep the service secure, prevent spam and fix problems.',
        'To send you service emails, such as verifying your email or resetting your password, and, if you allow it, notifications about new matches and messages.',
        'To meet our legal obligations.',
      ],
      after: ['We do not sell your personal information, we do not share it for advertising, and we do not use it to build advertising profiles.'],
    },
    {
      h: 'What other people can see',
      list: [
        'Anyone who can see you in Discover sees your username, age (if you show it), bio, first photo, interests, what you are looking for, height, couple tag, country, your city (unless you hide it) and an approximate distance.',
        'People you match with can also see all your photos, your gender, orientation, prompt answers and when you were last active.',
        'Other people never see your email address, date of birth, exact location or any reports you made.',
        'Your matches can read the messages you send them. Phone numbers in messages are hidden until tapped.',
      ],
    },
    {
      h: 'Who we share it with',
      p: ['We share information only with companies that help us run the app, under contracts that limit what they can do with it:'],
      list: [
        'Supabase, which hosts our database, logins and photo storage.',
        'Resend, which sends our emails.',
        'Our cloud hosting provider, which runs our servers.',
        'Apple, to deliver push notifications if you turn them on.',
      ],
    },
    {
      p: ['We may also share information if the law requires it, to protect someone from serious harm, or if ${APP} is transferred to a new owner or becomes a company (in which case this policy will still apply to your information).'],
    },
    {
      h: 'How long we keep it',
      p: [`We keep your information while your account is open. When you delete your account in Settings, we permanently delete your profile, photos, matches, messages, likes, blocks and login straight away. Copies may remain in encrypted backups for up to 30 days before they are overwritten. We may keep limited records longer where the law requires it or to deal with a safety report about your account.`],
    },
    {
      h: 'Your choices and rights',
      list: [
        'Edit or remove profile details at any time from My Profile.',
        'Hide your city, hide your age, or turn location off.',
        'Turn notifications on or off in Settings or in your phone\'s settings.',
        'Block anyone, and report anyone who breaks our rules.',
        'Delete your account and all your data from Settings.',
        `Ask for a copy of your data, or ask us to correct it, by emailing ${PRIVACY}.`,
      ],
      after: [`Depending on where you live (for example India, the EU, the UK or California), you may have further rights, such as to object to how we use your data or to complain to your data protection authority. Contact us at ${PRIVACY} and we will respond within the time the law requires.`],
    },
    {
      h: 'Security',
      p: ['Photos are stored privately and only load for people allowed to see them. Data is encrypted in transit, and access to our systems is limited. No service is perfectly secure, so please do not share anything in a message you could not afford to have leaked.'],
    },
    {
      h: 'Age limit',
      p: [`${APP} is only for adults aged 18 and over. We do not knowingly collect information from anyone under 18. If you believe someone under 18 is using ${APP}, please report their profile or email ${SUPPORT}.`],
    },
    {
      h: 'International transfers',
      p: [`Our service providers may store and process data outside your country, including in the United States and the European Union. Where the law requires, we use safeguards such as standard contractual clauses.`],
    },
    {
      h: 'Changes',
      p: ['If we change this policy in a way that matters, we will tell you in the app before the change takes effect.'],
    },
    {
      h: 'Contact',
      p: [`Email ${PRIVACY} for anything about your privacy or your data.`],
    },
    {
      h: 'Grievance Officer (India)',
      p: [`Under India's Information Technology Rules and Digital Personal Data Protection Act, you can raise a complaint with our Grievance Officer, ${LEGAL.grievanceOfficer}, at ${LEGAL.grievanceEmail}. We acknowledge complaints within 24 hours and resolve them within 15 days.`],
    },
  ],
}

export const TERMS = {
  title: 'Terms of Service',
  intro: `These terms are an agreement between you and ${OP} ("we", "us"), not a registered company, about your use of ${APP}. By creating an account you agree to them, to our Privacy Policy and to our Community Guidelines. Please read them.`,
  sections: [
    {
      h: 'Who can use Velkiz',
      list: [
        'You must be at least 18 years old.',
        'You must be legally able to agree to these terms, and not be barred from using the service by law.',
        'You must not have been convicted of a sexual or violent crime, and must not be required to register as a sex offender anywhere.',
        'You may only have one account, and it must be yours.',
      ],
    },
    {
      h: 'Zero tolerance for abuse',
      p: [`There is no tolerance on ${APP} for objectionable content or abusive users. Harassment, threats, hate speech, sexual content involving minors, non-consensual intimate images, scams and illegal content are banned. We review reports, usually within 24 hours, remove content that breaks these rules, and ban the accounts responsible. Serious cases may be reported to the police.`],
    },
    {
      h: 'Your account',
      p: ['Keep your password private. You are responsible for what happens on your account. Tell us straight away if you think someone else has used it.'],
    },
    {
      h: 'Your content',
      p: [
        'You own the photos, text and messages you post. You give us a worldwide, non-exclusive, royalty-free licence to host, store, display and process that content only to run and improve the service. This licence ends when you delete the content or your account, except for copies kept as our Privacy Policy describes.',
        'You promise that you have the right to post your content, that photos of you are of you, and that you have consent from anyone else shown.',
      ],
    },
    {
      h: 'Rules of conduct',
      p: ['You agree to follow our Community Guidelines. In particular, you will not:'],
      list: [
        'Pretend to be someone else, or create a fake or misleading profile.',
        'Harass, threaten, stalk, bully or intimidate anyone.',
        'Post or send content that is hateful, violent, illegal, or sexual content of anyone without their consent.',
        'Try to uncover or reveal another user\'s real identity, location or other personal details without their permission.',
        'Record, screenshot or share other people\'s photos or messages outside the app without their permission.',
        'Ask for money, promote anything, or use Velkiz for sex work or any commercial purpose.',
        'Use bots, scrapers or other automated means, or try to get around blocks, limits or security.',
      ],
    },
    {
      h: 'Safety',
      p: [`We do not run criminal background checks or verify the identity of our users, and we are not responsible for how other users behave. Be careful when talking to or meeting anyone. Meet in public, tell a friend where you are going, and never send money. If you feel unsafe, contact local emergency services, then report the person in the app.`],
    },
    {
      h: 'Moderation and ending your account',
      p: [
        'We may remove content, limit features or suspend or close accounts that break these terms or put others at risk, with or without notice.',
        'You can delete your account at any time in Settings.',
      ],
    },
    {
      h: 'Paid features',
      p: [`${APP} is currently free. If we add paid features, they will be bought through the App Store and Apple's terms will apply to payment and refunds.`],
    },
    {
      h: 'Disclaimers',
      p: [`${APP} is provided "as is" and "as available". To the fullest extent the law allows, we make no promises that it will be uninterrupted, error-free or secure, or that you will find a match.`],
    },
    {
      h: 'Limitation of liability',
      p: [`To the fullest extent the law allows, we are not liable for indirect, incidental, special or consequential losses, or for anything another user does, on or off the app. Our total liability to you is limited to the greater of the amount you paid us in the last 12 months and ₹10,000. Nothing in these terms limits liability that cannot be limited by law.`],
    },
    {
      h: 'Apple App Store',
      p: ['If you downloaded Velkiz from the Apple App Store:'],
      list: [
        'These terms are between you and us, not Apple. Apple is not responsible for Velkiz or its content.',
        'Apple has no obligation to provide maintenance or support for Velkiz.',
        'If Velkiz fails to meet any applicable warranty, you may notify Apple, and Apple may refund the purchase price (if any). Apple has no other warranty obligation for Velkiz.',
        'Apple is not responsible for any claims relating to Velkiz, including product liability claims, claims that it fails to meet legal requirements, and consumer protection or privacy claims.',
        'Apple is not responsible for any claim that Velkiz infringes someone else\'s intellectual property.',
        'You confirm you are not in a country subject to a US government embargo or listed as a terrorist-supporting country, and are not on any US government list of prohibited or restricted parties.',
        'Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you.',
      ],
    },
    {
      h: 'Changes to these terms',
      p: ['We may update these terms. If a change matters, we will tell you in the app before it takes effect. If you keep using Velkiz after that, you accept the new terms.'],
    },
    {
      h: 'Governing law',
      p: [`These terms are governed by the laws of ${LAW}, and disputes will be handled by the courts there, unless the law where you live gives you the right to bring a claim locally.`],
    },
    {
      h: 'Contact',
      p: [`Email ${SUPPORT}. For complaints under Indian law, write to our Grievance Officer, ${LEGAL.grievanceOfficer}, at ${LEGAL.grievanceEmail}.`],
    },
  ],
}

export const GUIDELINES = {
  title: 'Community Guidelines',
  intro: `${APP} lets people be open about what they want without giving up who they are. That only works if everyone respects each other. Break these rules and we may remove your content or ban your account.`,
  sections: [
    {
      h: 'Respect anonymity',
      list: [
        'Never try to find out who someone really is, where they live or work, unless they choose to tell you.',
        'Never screenshot, record or share someone\'s photos or messages outside Velkiz.',
        'Never share another person\'s personal details.',
      ],
    },
    {
      h: 'Consent, always',
      list: [
        'Don\'t send explicit content to anyone who hasn\'t clearly said they want it.',
        'No means no. Stop when someone asks you to, or stops replying.',
        'Never share intimate images of anyone without their consent.',
      ],
    },
    {
      h: 'Be real',
      list: [
        'Use photos of yourself. No celebrities, stolen photos or AI fakes of real people.',
        'Couples must tag their profile as a couple.',
        'One account per person.',
      ],
    },
    {
      h: 'Never allowed',
      list: [
        'Anyone under 18, or any sexual content involving minors. We report this to the authorities.',
        'Harassment, threats, stalking or bullying.',
        'Hate speech, or attacks on anyone for their race, religion, gender, sexuality, disability or anything else about who they are.',
        'Violence, or encouraging self-harm.',
        'Scams, asking for money, selling, advertising or sex work.',
        'Anything illegal.',
      ],
    },
    {
      h: 'If something is wrong',
      p: [`Tap Report on their profile or in the chat. Reports are anonymous and we review every one, usually within 24 hours. You can also block anyone at any time. If you are in danger, contact local emergency services first. You can also email ${SUPPORT}.`],
    },
  ],
}

export const LEGAL_DOCS = { privacy: PRIVACY_POLICY, terms: TERMS, guidelines: GUIDELINES }
