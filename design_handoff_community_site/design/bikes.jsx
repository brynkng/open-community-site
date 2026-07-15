// bikes.jsx — Nomad Bike Philly: Sunday rides to Manayunk
function nextSunday() {
  const d = new Date();
  let diff = (7 - d.getDay()) % 7;
  if (diff === 0 && d.getHours() >= 12) diff = 7;
  const sun = new Date(d);
  sun.setDate(d.getDate() + diff);
  return sun;
}

function BikesPage({ tweaks }) {
  const b = BRANDS.bikes;
  const sun = nextSunday();
  const dateStr = sun.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const eventId = 'ride-' + sun.toISOString().slice(0, 10);
  const headline = tweaks.copyVariant === 'direct'
    ? 'Sunday. 10 AM. Manayunk and back.'
    : 'Twenty easy miles, one great coffee.';

  const stops = [
    ['South Philly', 'Roll out at 10 AM sharp', '0 mi'],
    ['Schuylkill River Trail', 'Flat, car-free, river views', '3 mi'],
    ['Manayunk — Main St', 'Coffee, snacks, long sit', '10 mi'],
    ['Back home', 'Same trail, easy pace', '20 mi'],
  ];

  return (
    <div className="page" style={{ background: 'var(--nb-bg)', color: 'var(--nb-ink)' }} data-screen-label="Rides — Nomad Bike Philly">
      <TopNav route="#/bikes" brand={b} />

      <header>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(24px, 4vw, 56px)', alignItems: 'center', padding: 'clamp(36px, 7vw, 80px) clamp(16px,4vw,40px)' }}>
          <Reveal>
            <img src="assets/nomadic-bike.jpg" alt="Nomad Bike Philly" style={{ width: 'min(230px, 52%)', marginBottom: 20, borderRadius: '50%', boxShadow: 'var(--shadow)' }} className="float-slow" />
            <h1 style={{ fontFamily: b.font, fontWeight: 900, fontStretch: '125%', fontSize: 'clamp(30px, 4.6vw, 52px)', color: 'var(--nb-navy)', textTransform: 'uppercase', letterSpacing: '-.01em' }}>{headline}</h1>
            <p style={{ fontSize: 'clamp(16px, 1.8vw, 18.5px)', maxWidth: 480, margin: '14px 0 0' }}>
              Every Sunday at 10 AM we ride from South Philly up the Schuylkill to Manayunk, get coffee on Main Street,
              and roll home. No-drop, all bikes, all paces — if you can ride around the block, you can ride with us.
            </p>
            <div style={{ display: 'flex', gap: 10, margin: '20px 0 0', flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: '#fff', color: 'var(--nb-navy)' }}>☕ Coffee stop</span>
              <span className="chip" style={{ background: '#fff', color: 'var(--nb-navy)' }}>🚳 No-drop</span>
              <span className="chip" style={{ background: '#fff', color: 'var(--nb-navy)' }}>🛤 Mostly trail</span>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="card" style={{ padding: '18px 22px', background: 'var(--nb-navy)', color: '#fff', border: 'none' }}>
                <p style={{ margin: 0, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85 }}>Next ride</p>
                <p style={{ margin: '4px 0 0', fontFamily: b.font, fontWeight: 800, fontStretch: '115%', fontSize: 'clamp(20px, 2.4vw, 26px)' }}>{dateStr} · 10 AM</p>
                <p style={{ margin: '6px 0 0', fontSize: 14.5, opacity: .9 }}>20 miles round trip · ~2.5 hrs with coffee</p>
              </div>
              <RsvpWidget eventId={eventId} brand={b} prompt="Riding this Sunday?" />
            </div>
          </Reveal>
        </div>
      </header>

      {/* route strip */}
      <section className="wrap" style={{ padding: '10px clamp(16px,4vw,40px) 44px' }}>
        <Reveal>
          <div className="card" style={{ padding: 'clamp(18px, 3vw, 28px)', overflow: 'hidden' }}>
            <p style={{ margin: '0 0 18px', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 13, color: 'var(--nb-steel)' }}>The route</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 0, position: 'relative' }}>
              {stops.map(([name, sub, mi], i) => (
                <div key={name} style={{ position: 'relative', padding: '0 14px 0 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: i === 2 ? 'var(--nb-coffee)' : 'var(--nb-navy)', flex: 'none', boxShadow: '0 0 0 4px ' + (i === 2 ? 'rgba(111,74,43,.18)' : 'rgba(31,58,99,.15)') }}></span>
                    {i < stops.length - 1 && <span style={{ flex: 1, height: 3, background: 'repeating-linear-gradient(90deg, var(--nb-steel) 0 8px, transparent 8px 14px)', opacity: .6 }}></span>}
                  </div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15.5 }}>{name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>{sub}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 800, color: 'var(--nb-steel)' }}>{mi}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap" style={{ padding: '0 clamp(16px,4vw,40px) 50px' }}>
        <AlbumSection section="bikes" brand={b} />
      </section>

      <section className="wrap" style={{ padding: '0 clamp(16px,4vw,40px) 60px' }}>
        <Board section="bikes" brand={b} />
      </section>

      <SectionFooter brand={b} />
    </div>
  );
}

Object.assign(window, { BikesPage, nextSunday });
