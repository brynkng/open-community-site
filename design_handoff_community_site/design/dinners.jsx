// dinners.jsx — Sidewalk Story: Saturday dinners at 6pm

// Responsive looping backdrop: vertical clip on mobile, wide clip on desktop.
function DinnerVideo({ style, mask }) {
  const [mobile, setMobile] = React.useState(() => window.matchMedia('(max-width: 700px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const src = mobile ? 'assets/dinner-bg-mobile.mp4' : 'assets/dinner-bg.mp4';
  return (
    <video key={src} autoPlay muted loop playsInline preload="auto" volume={0}
           ref={el => { if (el) { el.muted = true; el.defaultMuted = true; el.volume = 0; } }}
           onLoadedData={e => { e.target.muted = true; e.target.volume = 0; }}
           onPlay={e => { e.target.muted = true; e.target.volume = 0; }}
           style={style}>
      <source src={src} type="video/mp4" />
    </video>
  );
}

function nextSaturday() {
  const d = new Date();
  const day = d.getDay();
  let diff = (6 - day + 7) % 7;
  if (diff === 0 && d.getHours() >= 20) diff = 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() + diff);
  return sat;
}

function DinnersPage({ tweaks }) {
  const b = BRANDS.dinners;
  const sat = nextSaturday();
  const dateStr = sat.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const eventId = 'dinner-' + sat.toISOString().slice(0, 10);
  const headline = tweaks.copyVariant === 'direct'
    ? 'Free pizza. Every Saturday. 6 PM.'
    : 'Pull up a chair — dinner\u2019s on us.';

  return (
    <div className="page" style={{ background: 'var(--ss-bg)', color: 'var(--ss-ink)', position: 'relative' }} data-screen-label="Dinners — Sidewalk Story">
      {/* looping video backdrop */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <DinnerVideo style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'color-mix(in oklab, var(--ss-bg) 84%, transparent)' }}></div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <TopNav route="#/dinners" brand={b} />

      {/* hero */}
      <header style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(24px, 4vw, 56px)', alignItems: 'center', padding: 'clamp(36px, 7vw, 80px) clamp(16px,4vw,40px)' }}>
          <Reveal>
            <img src="assets/sidewalk-story.png" alt="Sidewalk Story Philly" style={{ width: 'min(230px, 52%)', marginBottom: 20, mixBlendMode: 'multiply' }} className="float-slow" />
            <h1 style={{ fontFamily: b.font, fontSize: 'clamp(30px, 4.6vw, 52px)', color: 'var(--ss-red-deep)' }}>{headline}</h1>
            <p style={{ fontSize: 'clamp(16px, 1.8vw, 18.5px)', maxWidth: 480, margin: '14px 0 0' }}>
              Every Saturday at 6, your host fires up the Ooni in his South Philly backyard and makes pizza until people stop eating.
              Completely free. You&rsquo;re not expected to bring anything. Seen us on social? That invite means you.
            </p>
            <div style={{ display: 'flex', gap: 10, margin: '20px 0 0', flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: '#fff', color: 'var(--ss-red)' }}>🍕 Wood-fired</span>
              <span className="chip" style={{ background: '#fff', color: 'var(--ss-red)' }}>🐶 Dog-friendly</span>
              <span className="chip" style={{ background: '#fff', color: 'var(--ss-red)' }}>💸 Always free</span>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="card" style={{ padding: '18px 22px', background: 'var(--ss-red)', color: '#fff', border: 'none' }}>
                <p style={{ margin: 0, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85 }}>Next dinner</p>
                <p style={{ margin: '4px 0 0', fontFamily: b.font, fontSize: 'clamp(20px, 2.4vw, 26px)' }}>{dateStr} · 6 PM</p>
                <p style={{ margin: '6px 0 0', fontSize: 14.5, opacity: .9 }}>South Philly — DM us on social for the address.</p>
              </div>
              <RsvpWidget eventId={eventId} brand={b} prompt="Coming this Saturday?" />
            </div>
          </Reveal>
        </div>
      </header>

      {/* how it works */}
      <section className="wrap" style={{ padding: '10px clamp(16px,4vw,40px) 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 14 }}>
          {[
            ['Show up hungry', 'Doors open around 5:45. First pies hit the table at 6.'],
            ['Bring nothing', 'Seriously. Not even a drink. Just come.'],
            ['Bring anyone', 'Friends, kids, dogs, that neighbor you keep meaning to talk to.'],
          ].map(([t, s], i) => (
            <Reveal key={t} delay={i} className="card" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontFamily: b.font, fontSize: 17, color: 'var(--ss-red-deep)' }}>{t}</h3>
              <p style={{ margin: '6px 0 0', fontSize: 14.5, color: 'var(--muted)' }}>{s}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ padding: '20px clamp(16px,4vw,40px) 50px' }}>
        <AlbumSection section="dinners" brand={b} />
      </section>

      <section className="wrap" style={{ padding: '0 clamp(16px,4vw,40px) 60px' }}>
        <Board section="dinners" brand={b} />
      </section>

      <SectionFooter brand={b} />
      </div>
    </div>
  );
}

Object.assign(window, { DinnersPage, nextSaturday, DinnerVideo });
