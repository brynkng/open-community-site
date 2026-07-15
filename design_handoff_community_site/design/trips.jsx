// trips.jsx — Field Trip Philly: camping & hiking trips with RSVP + comments per trip
function TripsPage({ tweaks }) {
  const b = BRANDS.trips;
  const trips = SPC.get().trips;
  const headline = tweaks.copyVariant === 'direct'
    ? 'Group trips. Open to everyone. Usually free.'
    : 'Sometimes the neighborhood goes camping.';

  return (
    <div className="page" style={{ background: 'var(--ft-bg)', color: 'var(--ft-ink)' }} data-screen-label="Trips — Field Trip Philly">
      <TopNav route="#/trips" brand={b} />

      <header className="wrap" style={{ padding: 'clamp(36px, 7vw, 80px) clamp(16px,4vw,40px) clamp(20px,3vw,36px)' }}>
        <Reveal style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="float-slow" style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--ft-ember)', display: 'grid', placeItems: 'center', fontSize: 26, boxShadow: 'var(--shadow)' }}>⛺</span>
            <p style={{ margin: 0, fontFamily: b.font, fontWeight: 700, fontSize: 19, color: 'var(--ft-green)' }}>Field Trip Philly</p>
          </div>
          <h1 style={{ fontFamily: b.font, fontWeight: 800, fontSize: 'clamp(30px, 4.6vw, 52px)', color: 'var(--ft-green-deep)', letterSpacing: '-.015em' }}>{headline}</h1>
          <p style={{ fontSize: 'clamp(16px, 1.8vw, 18.5px)', margin: '14px 0 0' }}>
            Camping, hikes, and day trips planned together in the open. Anyone from the community is invited.
            Free unless there&rsquo;s real costs to split — and we&rsquo;ll always say so up front.
          </p>
        </Reveal>
      </header>

      <section className="wrap" style={{ padding: '10px clamp(16px,4vw,40px) 50px', display: 'grid', gap: 22 }}>
        {trips.map((t, i) => <TripCard key={t.id} trip={t} brand={b} delay={i} />)}
        <Reveal className="card" style={{ padding: '22px 24px', borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--ft-moss)', background: 'transparent', boxShadow: 'none', textAlign: 'center' }}>
          <h3 style={{ fontFamily: b.font, fontWeight: 700, fontSize: 18, color: 'var(--ft-green)' }}>Got a trip idea?</h3>
          <p style={{ margin: '6px auto 0', maxWidth: 420, fontSize: 14.5, color: 'var(--muted)' }}>Pitch it on the board below — if a few people bite, we&rsquo;ll plan it together.</p>
        </Reveal>
      </section>

      <section className="wrap" style={{ padding: '0 clamp(16px,4vw,40px) 50px' }}>
        <AlbumSection section="trips" brand={b} />
      </section>

      <section className="wrap" style={{ padding: '0 clamp(16px,4vw,40px) 60px' }}>
        <Board section="trips" brand={b} />
      </section>

      <SectionFooter brand={b} />
    </div>
  );
}

function TripCard({ trip, brand, delay }) {
  const [open, setOpen] = React.useState(trip.status === 'open');
  const going = (SPC.get().rsvps[trip.id] || []);
  const totalGoing = going.reduce((s, r) => s + (r.guests || 1), 0) + (SPC.get().thumbs[trip.id] || 0);

  return (
    <Reveal delay={Math.min(delay, 3)} className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: 'clamp(18px, 3vw, 28px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span className="chip" style={{ background: trip.status === 'open' ? 'var(--ft-green)' : 'var(--ft-moss)', color: '#fff', marginBottom: 10 }}>
              {trip.status === 'open' ? 'RSVPs open' : 'Still planning'}
            </span>
            <h2 style={{ fontFamily: brand.font, fontWeight: 800, fontSize: 'clamp(21px, 2.8vw, 28px)', color: 'var(--ft-green-deep)' }}>{trip.name}</h2>
            <p style={{ margin: '4px 0 0', fontWeight: 800, color: 'var(--ft-ember)', fontSize: 15 }}>{trip.dates}</p>
          </div>
          <span className="chip" style={{ background: 'var(--ft-bg)', color: 'var(--ft-green)' }}>{totalGoing} going</span>
        </div>
        <p style={{ margin: '12px 0 0', maxWidth: 660, fontSize: 15.5 }}>{trip.blurb}</p>
        <div style={{ display: 'flex', gap: 16, margin: '14px 0 0', flexWrap: 'wrap', fontSize: 14, color: 'var(--muted)' }}>
          <span>💸 {trip.cost}</span>
          <span>📍 {trip.meet}</span>
        </div>
        <button className="btn ghost" style={{ color: 'var(--ft-green)', marginTop: 16, padding: '9px 18px' }} onClick={() => setOpen(o => !o)}>
          {open ? 'Hide details ▴' : 'RSVP & discussion ▾'}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid rgba(43,33,24,.08)', padding: 'clamp(18px, 3vw, 28px)', display: 'grid', gap: 20, background: 'rgba(46,83,57,.035)' }}>
          <RsvpWidget eventId={trip.id} brand={brand} prompt={trip.status === 'open' ? 'In for this one?' : 'Interested? (helps us pick a date)'} />
          <TripComments trip={trip} brand={brand} />
        </div>
      )}
    </Reveal>
  );
}

function TripComments({ trip, brand }) {
  const [, force] = React.useState(0);
  const rerender = () => force(n => n + 1);
  const key = 'tripc-' + trip.id;
  const store = SPC.get();
  if (!store.tripComments) store.tripComments = {};
  if (!store.tripComments[key]) {
    store.tripComments[key] = trip.id === 'trip-wharton'
      ? [
          { author: 'Jesse', text: 'I can drive — fits 4 with gear.', ts: '3 days ago' },
          { author: 'Anna', text: 'Planning a big pot of chili for the fire. Vegetarian!', ts: '2 days ago' },
        ]
      : [];
  }
  const comments = store.tripComments[key];
  const [text, setText] = React.useState('');
  const [author, setAuthor] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    comments.push({ author: author.trim() || 'Neighbor', text: text.trim(), ts: 'just now' });
    SPC.save();
    setText(''); rerender();
  };

  return (
    <div>
      <h4 style={{ fontFamily: brand.font, fontWeight: 700, fontSize: 16, color: 'var(--ft-green-deep)', marginBottom: 10 }}>Trip talk</h4>
      <div style={{ display: 'grid', gap: 8 }}>
        {comments.length === 0 && <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14.5 }}>No comments yet — questions and offers to help go here.</p>}
        {comments.map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 1px 3px rgba(43,33,24,.07)' }}>
            <p style={{ margin: 0, fontSize: 14.5 }}><strong>{c.author}</strong> <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{c.ts}</span></p>
            <p style={{ margin: '2px 0 0', fontSize: 14.5 }}>{c.text}</p>
          </div>
        ))}
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <input className="field" style={{ flex: '2 1 140px' }} placeholder="Ask or offer something…" value={text} onChange={e => setText(e.target.value)} />
          <input className="field" style={{ flex: '1 1 110px', maxWidth: 160 }} placeholder="Name" value={author} onChange={e => setAuthor(e.target.value)} />
          <button className="btn" style={{ background: 'var(--ft-green)' }} type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { TripsPage, TripCard });
