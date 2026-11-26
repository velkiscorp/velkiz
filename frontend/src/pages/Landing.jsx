import { Link } from 'react-router-dom'
import { EyeOff, ShieldCheck, Lock, Download } from 'lucide-react'
import { CONTACT } from '@/lib/contact'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site'

const FEATURES = [
  { icon: EyeOff, title: 'Anonymous by design', text: 'No names, no socials. You decide when to reveal who you are.' },
  { icon: Lock, title: 'Screenshots blocked', text: 'Chats and photos come out blank in screenshots, and your match is told if someone tries.' },
  { icon: ShieldCheck, title: 'Private photos', text: 'Photos are only shown to people inside the app, never on a public link.' },
]

const StoreButton = ({ href, icon: Icon, small, big }) => {
  const body = (
    <>
      <Icon className="w-6 h-6 shrink-0" />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wider opacity-70">{href ? small : 'Coming soon'}</span>
        <span className="block text-base font-medium">{big}</span>
      </span>
    </>
  )
  const cls = 'w-56 flex items-center gap-3 h-14 px-5 rounded-xl border border-border bg-black/40 transition'
  return href
    ? <a href={href} className={`${cls} hover:border-gold/60 hover:bg-black/60`}>{body}</a>
    : <div className={`${cls} opacity-60`} aria-disabled="true">{body}</div>
}

// velkiz.com in a browser. Velkiz itself only runs in the phone app (so
// screenshots can be blocked); the website is for downloads and legal pages.
export default function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <div
        className="absolute left-1/2 top-[22rem] w-[40rem] max-w-[200vw] h-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(346 75% 36% / 0.35), transparent 65%)' }}
      />

      <main className="relative flex-1 w-full max-w-3xl mx-auto px-4 pt-24 pb-16 space-y-16">
        <section className="text-center space-y-5">
          <h1 className="text-6xl sm:text-7xl font-serif italic font-medium tracking-tight text-silk leading-none">Velkiz</h1>
          <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Dating without the exposure. Meet people anonymously, and share more only when you want to.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <StoreButton href={APP_STORE_URL} icon={Download} small="Download on the" big="App Store" />
            <StoreButton href={PLAY_STORE_URL} icon={Download} small="Get it on" big="Google Play" />
          </div>
          <p className="text-xs text-muted-foreground">For adults 18 and over.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card/40 p-5 space-y-2">
              <Icon className="w-5 h-5 text-gold" />
              <h2 className="font-medium">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        <section className="text-center space-y-2">
          <h2 className="font-serif italic text-2xl text-gold">Need help?</h2>
          <p className="text-sm text-muted-foreground">
            Write to <a href={CONTACT.support.href} className="text-gold underline underline-offset-2">{CONTACT.support.email}</a>.
            To report someone, use Report on their profile in the app, or email us.
          </p>
        </section>
      </main>

      <footer className="relative border-t border-border/50 px-4 py-6">
        <nav className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link to="/guidelines" className="hover:text-foreground">Community Guidelines</Link>
          <a href={CONTACT.support.href} className="hover:text-foreground">Contact</a>
          <a href={CONTACT.privacy.href} className="hover:text-foreground">Privacy requests</a>
          <a href={CONTACT.grievance.href} className="hover:text-foreground">Grievance Officer</a>
        </nav>
        <p className="text-center text-[11px] text-muted-foreground/70 mt-4">© {new Date().getFullYear()} Velkiz</p>
      </footer>
    </div>
  )
}
