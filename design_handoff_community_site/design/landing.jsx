// landing.jsx — one front door, three brands. Scroll journey on mobile, stacked panels on desktop too (variant tweak).
function usePhotosFor(section) {
  return React.useMemo(() => {
    const albums = SPC.get().albums.filter(a => a.section === section);
    return albums.flatMap(a => a.photos).slice(0, 6);
  }, [section]);
}

const LANDING_META = {
  dinners: {
    brand: BRANDS.dinners,
    logo: 'assets/sidewalk-story.png',
    when: 'Every Saturday · 6 PM',
    headline: { warm: 'Pizza night. Every Saturday. You\u2019re invited.', direct: 'Free pizza dinners, every Saturday at 6.' },
    sub: 'Wood-fired pies from the Ooni, a long table, and whoever shows up. Free, always. Bring nothing but yourself.',
    cta: 'See this Saturday',
    href: '#/dinners',
    panelBg: 'linear-gradient(160deg, var(--ss-red) 0%, var(--ss-red-deep) 100%)',
  },
  bikes: {
    brand: BRANDS.bikes,
    logo: 'assets/nomadic-bike.jpg',
    when: 'Every Sunday · 10 AM',
    headline: { warm: 'Slow miles, good coffee, Sunday mornings.', direct: 'No-drop rides to Manayunk, every Sunday.' },
    sub: 'An easy 10 miles up the Schuylkill to Manayunk, coffee on Main Street, and 10 miles home. All bikes, all paces.',
    cta: 'Join Sunday\u2019s ride',
    href: '#/bikes',
    panelBg: 'linear-gradient(160deg, var(--nb-navy) 0%, var(--nb-navy-deep) 100%)',
  },
  trips: {
    brand: BRANDS.trips,
    logo: null,
    when: 'A few times a season',
    headline: { warm: 'Sometimes we leave the sidewalk behind.', direct: 'Group camping & hiking trips, open to all.' },
    sub: 'Camping in the Pine Barrens, waterfall hikes, day trips. Planned together, open to everyone, free unless we say otherwise.',
    cta: 'See upcoming trips',
    href: '#/trips',
    panelBg: 'linear-gradient(160deg, var(--ft-green) 0%, var(--ft-green-deep) 100%)',
  },
};

// drifting photo positions per panel
const DRIFT_SPOTS = [
  { top: '6%', right: '4%', width: 'min(26vw, 300px)', tilt: '-3deg', amp: 1 },
  { top: '30%', right: '22%', width: 'min(19vw, 210px)', tilt: '2.5deg', amp: 1.6 },
  { top: '10%', right: '34%', width: 'min(14vw, 150px)', tilt: '-1.5deg', amp: 2.2 },
];

function LandingPanel({ id, copyVariant, index, dinnerLayout = 'lower-band' }) {
  const meta = LANDING_META[id];
  const photos = usePhotosFor(id);
  const b = meta.brand;

  // Dinner panel: video-forward layouts that never sit text over the logo.
  if (id === 'dinners') return <DinnerPanel meta={meta} b={b} copyVariant={copyVariant} layout={dinnerLayout} />;

  return (
    <a href={meta.href} className="land-panel" data-screen-label={'Landing — ' + b.name} style={{ background: meta.panelBg }}>
      {/* drifting photos */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {DRIFT_SPOTS.map((s, i) => photos[i] ? (
          <div key={i} className="drift" style={{ top: s.top, right: s.right, width: s.width, '--tilt': s.tilt, '--drift-amp': s.amp, animationDelay: (i * -4) + 's', opacity: 0.9 }}>
            <Photo photo={photos[i]} style={{ borderRadius: 0 }} />
          </div>
        ) : null)}
        {/* soft vignette so text reads */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.42) 100%)' }}></div>
      </div>

      <Reveal style={{ position: 'relative', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {meta.logo
            ? <img src={meta.logo} alt={b.name + ' logo'} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,.3)' }} className="float-slow" />
            : <span className="float-slow" style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--ft-ember)', display: 'grid', placeItems: 'center', fontSize: 24, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}>⛺</span>}
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, letterSpacing: '.02em' }}>{b.name}</p>
            <p style={{ margin: 0, fontSize: 13, opacity: .85, letterSpacing: '.08em', textTransform: 'uppercase' }}>{meta.when}</p>
          </div>
        </div>
        <h2 style={{ fontFamily: b.font, fontWeight: b.fontWeight || 400, fontSize: 'clamp(28px, 5vw, 52px)', textShadow: '0 2px 18px rgba(0,0,0,.3)', fontStretch: b.fontStretch }}>
          {meta.headline[copyVariant] || meta.headline.warm}
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', opacity: .92, maxWidth: 520, margin: '12px 0 20px' }}>{meta.sub}</p>
        <span className="btn" style={{ background: 'rgba(255,255,255,.95)', color: b.deep === 'var(--ss-red-deep)' ? 'var(--ss-red-deep)' : b.deep }}>
          {meta.cta} →
        </span>
      </Reveal>
    </a>
  );
}

function DinnerVideoBg({ style }) {
  return (
    <video src="assets/dinner-bg.mp4" autoPlay muted loop playsInline preload="auto"
           ref={el => { if (el) { el.muted = true; el.defaultMuted = true; el.volume = 0; } }}
           onLoadedData={e => { e.target.muted = true; e.target.volume = 0; }}
           onPlay={e => { e.target.muted = true; e.target.volume = 0; }}
           style={style} />
  );
}

function DinnerBadge({ meta, b, light }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <img src={meta.logo} alt={b.name + ' logo'} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,.3)' }} className="float-slow" />
      <div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 15, letterSpacing: '.02em', color: light ? '#fff' : 'inherit' }}>{b.name}</p>
        <p style={{ margin: 0, fontSize: 13, opacity: .85, letterSpacing: '.08em', textTransform: 'uppercase', color: light ? '#fff' : 'inherit' }}>{meta.when}</p>
      </div>
    </div>
  );
}

function DinnerCopy({ meta, b, copyVariant, light = true }) {
  return (
    <React.Fragment>
      <DinnerBadge meta={meta} b={b} light={light} />
      <h2 style={{ fontFamily: b.font, fontWeight: b.fontWeight || 400, fontSize: 'clamp(26px, 4vw, 46px)', color: light ? '#fff' : 'var(--ss-red-deep)', textShadow: light ? '0 2px 18px rgba(0,0,0,.35)' : 'none' }}>
        {meta.headline[copyVariant] || meta.headline.warm}
      </h2>
      <p style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', opacity: .95, maxWidth: 520, margin: '12px 0 20px', color: light ? '#fff' : 'var(--ss-ink)' }}>{meta.sub}</p>
      <span className="btn" style={{ background: light ? 'rgba(255,255,255,.96)' : 'var(--ss-red)', color: light ? 'var(--ss-red-deep)' : '#fff' }}>{meta.cta} →</span>
    </React.Fragment>
  );
}

// Three ways to show dinner text without covering the video's logo.
function DinnerPanel({ meta, b, copyVariant, layout }) {
  const base = { display: 'block', textDecoration: 'none' };

  // A) Lower band — video fills the panel, copy sits in a frosted bar pinned to the bottom.
  if (layout === 'lower-band') {
    return (
      <a href={meta.href} className="land-panel" data-screen-label="Landing — Sidewalk Story" style={{ background: '#1a0f0c', padding: 0, justifyContent: 'flex-end' }}>
        <DinnerVideoBg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <Reveal style={{ position: 'relative', width: '100%', padding: 'clamp(22px, 4vw, 40px)', background: 'linear-gradient(180deg, transparent, rgba(20,12,9,.5) 30%, rgba(20,12,9,.82))', backdropFilter: 'blur(2px)' }}>
          <div style={{ maxWidth: 640 }}><DinnerCopy meta={meta} b={b} copyVariant={copyVariant} /></div>
        </Reveal>
      </a>
    );
  }

  // A2) Split band — video (contained so the logo reads smaller), copy split across a frosted bar.
  if (layout === 'split-band') {
    return (
      <a href={meta.href} className="land-panel" data-screen-label="Landing — Sidewalk Story" style={{ background: '#000', padding: 0, justifyContent: 'flex-end' }}>
        <DinnerVideoBg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', maskImage: 'linear-gradient(180deg, transparent, #000 16%, #000 74%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 16%, #000 74%, transparent)' }} />
        <Reveal style={{ position: 'relative', width: '100%', padding: 'clamp(26px, 4vw, 46px)' }}>
          <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 56px)', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 240, background: 'rgba(0,0,0,.68)', borderRadius: 16, padding: 'clamp(16px,2vw,22px) clamp(18px,2.4vw,26px)', backdropFilter: 'blur(4px)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#fff', opacity: .9, letterSpacing: '.08em', textTransform: 'uppercase', textShadow: '0 2px 12px #000, 0 0 4px #000' }}>{b.name} · {meta.when}</p>
              <h2 style={{ fontFamily: b.font, fontWeight: b.fontWeight || 400, fontSize: 'clamp(26px, 4vw, 46px)', color: '#fff', textShadow: '0 2px 16px #000, 0 1px 4px #000, 0 0 30px rgba(0,0,0,.8)', margin: 0 }}>
                {meta.headline[copyVariant] || meta.headline.warm}
              </h2>
            </div>
            <div style={{ flex: '1 1 280px', minWidth: 240, textAlign: 'right', background: 'rgba(0,0,0,.68)', borderRadius: 16, padding: 'clamp(16px,2vw,22px) clamp(18px,2.4vw,26px)', backdropFilter: 'blur(4px)' }}>
              <p style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', color: '#fff', opacity: .96, margin: '0 0 16px', marginLeft: 'auto', maxWidth: 460, textShadow: '0 2px 12px #000, 0 0 4px #000' }}>{meta.sub}</p>
              <span className="btn" style={{ background: 'rgba(255,255,255,.96)', color: 'var(--ss-red-deep)' }}>{meta.cta} →</span>
            </div>
          </div>
        </Reveal>
      </a>
    );
  }

  // B) Split — copy on a solid brand card beside a clean video pane.
  if (layout === 'split') {
    return (
      <a href={meta.href} data-screen-label="Landing — Sidewalk Story" style={{ ...base, minHeight: '78vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
        <div style={{ background: meta.panelBg, padding: 'clamp(28px, 4vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Reveal style={{ maxWidth: 520 }}><DinnerCopy meta={meta} b={b} copyVariant={copyVariant} /></Reveal>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 300 }}>
          <DinnerVideoBg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </a>
    );
  }

  // C) Stacked — video as a clean top stage, copy on brand color beneath it.
  return (
    <a href={meta.href} data-screen-label="Landing — Sidewalk Story" style={{ ...base }}>
      <div style={{ position: 'relative', height: '46vh', minHeight: 260, overflow: 'hidden', background: '#1a0f0c' }}>
        <DinnerVideoBg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', maskImage: 'linear-gradient(180deg, #000 78%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 78%, transparent)' }} />
      </div>
      <div style={{ background: meta.panelBg, padding: 'clamp(26px, 4vw, 48px)' }}>
        <Reveal style={{ maxWidth: 640 }}><DinnerCopy meta={meta} b={b} copyVariant={copyVariant} /></Reveal>
      </div>
    </a>
  );
}

function LandingMarquee() {
  const all = SPC.get().albums.flatMap(a => a.photos).slice(0, 10);
  const row = all.concat(all); // loop
  return (
    <div style={{ overflow: 'hidden', padding: '26px 0', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
      <div className="marquee">
        {row.map((p, i) => (
          <Photo key={i} photo={p} style={{ width: 170, flex: '0 0 auto' }} />
        ))}
      </div>
    </div>
  );
}

function Landing({ tweaks }) {
  const layout = tweaks.landingLayout; // 'stack' | 'grid'
  const panels = ['dinners', 'bikes', 'trips'];
  return (
    <div className="page" style={{ background: 'var(--paper)' }} data-screen-label="Landing">
      <TopNav route="#/" />
      <header className="wrap" style={{ padding: 'clamp(40px, 8vw, 90px) clamp(16px,4vw,40px) clamp(20px, 4vw, 44px)', textAlign: 'center' }}>
        <Reveal>
          <p className="chip" style={{ background: 'rgba(43,33,24,.07)', marginBottom: 16 }}>South Philly · est. on a stoop</p>
          <h1 style={{ fontFamily: 'var(--font-ft)', fontWeight: 800, fontSize: 'clamp(34px, 6.4vw, 68px)', letterSpacing: '-.015em' }}>
            One neighborhood.<br />Three ways to show up.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 'clamp(16px, 1.9vw, 19px)', maxWidth: 560, margin: '16px auto 0' }}>
            Saturday dinners, Sunday rides, and the occasional trip out of town. No memberships, no fees, no experience needed.
          </p>
        </Reveal>
      </header>

      <main style={layout === 'grid'
        ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 0 }
        : undefined}>
        {panels.map((id, i) => <LandingPanel key={id} id={id} index={i} copyVariant={tweaks.copyVariant} dinnerLayout={tweaks.dinnerLayout} />)}
      </main>

      <SectionFooter />
    </div>
  );
}

Object.assign(window, { Landing, LANDING_META });
