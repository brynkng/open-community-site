// shared.jsx — shared components: Photo, Reveal, RSVP, Board, Albums, Nav
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const BRANDS = {
  dinners: { key: 'dinners', name: 'Sidewalk Story', tag: 'Saturday dinners', font: 'var(--font-ss)', accent: 'var(--ss-red)', deep: 'var(--ss-red-deep)', bg: 'var(--ss-bg)', ink: 'var(--ss-ink)', logo: 'assets/sidewalk-story.png' },
  bikes:   { key: 'bikes', name: 'Nomad Bike Philly', tag: 'Sunday rides', font: 'var(--font-nb)', accent: 'var(--nb-navy)', deep: 'var(--nb-navy-deep)', bg: 'var(--nb-bg)', ink: 'var(--nb-ink)', fontWeight: 800, fontStretch: '125%', logo: 'assets/nomadic-bike.jpg' },
  trips:   { key: 'trips', name: 'Field Trip Philly', tag: 'Camping & hikes', font: 'var(--font-ft)', accent: 'var(--ft-green)', deep: 'var(--ft-green-deep)', bg: 'var(--ft-bg)', ink: 'var(--ft-ink)', fontWeight: 700 },
};

// Gradient recipes per brand for placeholder photos
const PH_GRADS = {
  ss: (h) => `linear-gradient(${135 + h}deg, oklch(0.72 0.13 ${40 + h * 0.8}), oklch(0.5 0.14 ${25 + h * 0.6}))`,
  nb: (h) => `linear-gradient(${135 + (h % 40)}deg, oklch(0.62 0.09 ${h + 30}), oklch(0.38 0.1 ${h}))`,
  ft: (h) => `linear-gradient(${150 + (h % 30)}deg, oklch(0.66 0.11 ${h + 20}), oklch(0.42 0.11 ${h - 10}))`,
};

function Photo({ photo, style, className, onClick }) {
  const bg = photo.src ? undefined : PH_GRADS[photo.brand || 'ss'](photo.hue || 10);
  return (
    <figure className={'ph ' + (className || '')} style={{ margin: 0, background: bg, cursor: onClick ? 'pointer' : undefined, ...style }} onClick={onClick}>
      {photo.src ? <img src={photo.src} alt={photo.cap || ''} /> : <figcaption className="ph-label" style={{ position: 'relative', zIndex: 1 }}>{photo.cap}</figcaption>}
    </figure>
  );
}

function Reveal({ children, as: Tag = 'div', delay = 0, className = '', ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const d = delay ? ' d' + delay : '';
  return <Tag ref={ref} className={'rv' + d + ' ' + className} {...rest}>{children}</Tag>;
}

/* ---------- RSVP widget: quick 👍 or name + guests ---------- */
function RsvpWidget({ eventId, brand, prompt }) {
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);
  const store = SPC.get();
  const rsvps = store.rsvps[eventId] || [];
  const thumbs = store.thumbs[eventId] || 0;
  const mine = !!store.myThumbs[eventId];
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(1);
  const [justRsvpd, setJustRsvpd] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const totalPeople = rsvps.reduce((s, r) => s + (r.guests || 1), 0) + thumbs;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    SPC.addRsvp(eventId, name.trim(), guests);
    setName(''); setGuests(1); setJustRsvpd(true); rerender();
  };

  return (
    <div className="card" style={{ padding: '20px 22px', borderTop: `4px solid ${brand.accent}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ fontFamily: brand.font, fontWeight: brand.fontWeight || 400, fontSize: 19, color: brand.ink }}>{prompt || 'Coming?'}</h3>
        <span className="chip" style={{ background: brand.bg, color: brand.accent }}>{totalPeople} in so far</span>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '14px 0 6px', flexWrap: 'wrap' }}>
        <button
          className="btn ghost"
          style={{ color: mine ? '#fff' : brand.accent, background: mine ? brand.accent : 'transparent', minWidth: 120 }}
          onClick={() => { SPC.toggleThumb(eventId); setPopKey(k => k + 1); rerender(); }}
          aria-pressed={mine}
        >
          <span key={popKey} className="pop" style={{ display: 'inline-block' }}>👍</span>
          {mine ? "I'm in!" : 'Quick yes'}
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>no name needed — or…</span>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input className="field" style={{ flex: '2 1 160px' }} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <select className="field" style={{ flex: '1 1 110px', maxWidth: 150 }} value={guests} onChange={e => setGuests(+e.target.value)}>
          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n === 1 ? 'Just me' : n + ' people'}</option>)}
        </select>
        <button className="btn" type="submit" style={{ background: brand.accent, flex: '1 1 100px' }}>RSVP</button>
      </form>
      {justRsvpd && <p className="pop" style={{ color: brand.accent, fontWeight: 700, margin: '10px 0 0' }}>See you there! 🎉</p>}

      {rsvps.length > 0 && (
        <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--muted)' }}>
          {rsvps.slice(-4).map(r => r.name).join(' · ')}{rsvps.length > 4 ? ` + ${rsvps.length - 4} more` : ''}{thumbs > 0 ? ` · ${thumbs} 👍` : ''}
        </p>
      )}
    </div>
  );
}

/* ---------- Community board (Reddit-lite) ---------- */
function Board({ section, brand }) {
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);
  const posts = SPC.get().posts[section];
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    SPC.addPost(section, title.trim(), body.trim(), author.trim());
    setTitle(''); setBody(''); setComposing(false); rerender();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h3 className="section-title" style={{ fontFamily: brand.font, fontWeight: brand.fontWeight || 400, color: brand.ink, fontSize: 'clamp(20px,2.6vw,26px)' }}>The board</h3>
        <button className="btn" style={{ background: brand.accent }} onClick={() => setComposing(c => !c)}>{composing ? 'Cancel' : '+ New post'}</button>
      </div>

      {composing && (
        <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 14, display: 'grid', gap: 10 }}>
          <input className="field" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="field" rows="3" placeholder="Say more (optional)" value={body} onChange={e => setBody(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" style={{ maxWidth: 200 }} placeholder="Name (optional)" value={author} onChange={e => setAuthor(e.target.value)} />
            <button className="btn" style={{ background: brand.accent }} type="submit">Post</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {posts.map(p => <Post key={p.id} post={p} section={section} brand={brand} onChange={rerender} />)}
      </div>
    </div>
  );
}

function Post({ post, section, brand, onChange }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [voted, setVoted] = useState(0);

  const vote = (d) => {
    if (voted === d) return;
    SPC.vote(section, post.id, d - voted);
    setVoted(d); onChange();
  };
  const comment = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    SPC.addComment(section, post.id, text.trim(), author.trim());
    setText(''); onChange();
  };

  return (
    <article className="card" style={{ padding: '14px 16px', display: 'flex', gap: 14 }}>
      <div className="post-vote" style={{ color: brand.accent }}>
        <button className={'vote-btn' + (voted === 1 ? ' on' : '')} onClick={() => vote(1)} aria-label="upvote">▲</button>
        <span>{post.votes}</span>
        <button className={'vote-btn' + (voted === -1 ? ' on' : '')} onClick={() => vote(-1)} aria-label="downvote">▼</button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 16.5, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>{post.title}</h4>
        <p style={{ margin: '2px 0 6px', fontSize: 13, color: 'var(--muted)' }}>{post.author} · {post.ts}</p>
        {post.body && <p style={{ margin: '0 0 8px', fontSize: 15 }}>{post.body}</p>}
        <button onClick={() => setOpen(o => !o)} style={{ border: 'none', background: 'none', color: brand.accent, fontWeight: 700, fontSize: 13.5, padding: 0 }}>
          💬 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'} {open ? '▾' : '▸'}
        </button>
        {open && (
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {post.comments.map((c, i) => (
              <div key={i} style={{ background: 'rgba(43,33,24,.045)', borderRadius: 10, padding: '8px 12px' }}>
                <p style={{ margin: 0, fontSize: 14.5 }}><strong>{c.author}</strong> <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{c.ts}</span></p>
                <p style={{ margin: '2px 0 0', fontSize: 14.5 }}>{c.text}</p>
              </div>
            ))}
            <form onSubmit={comment} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="field" style={{ flex: '1 1 120px' }} placeholder="Reply…" value={text} onChange={e => setText(e.target.value)} />
              <input className="field" style={{ flex: '0 1 130px' }} placeholder="Name" value={author} onChange={e => setAuthor(e.target.value)} />
              <button className="btn" style={{ background: brand.accent, padding: '10px 16px' }} type="submit">Reply</button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- Shared album section: grouped by date, named albums, no-account upload ---------- */
function AlbumSection({ section, brand }) {
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);
  const albums = SPC.get().albums.filter(a => a.section === section);
  const [activeId, setActiveId] = useState(albums.find(a => a.main)?.id || albums[0]?.id);
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const fileRef = useRef(null);
  const active = albums.find(a => a.id === activeId) || albums[0];

  const onFiles = (e) => {
    const files = [...e.target.files].slice(0, 6);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => { SPC.addPhoto(active.id, reader.result); rerender(); };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const createAlbum = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const id = SPC.addAlbum(section, newName.trim());
    setActiveId(id); setNewName(''); setNaming(false); rerender();
  };

  // group photos by date
  const groups = useMemo(() => {
    const g = {};
    (active?.photos || []).forEach(p => { (g[p.date] = g[p.date] || []).push(p); });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [active, active?.photos?.length]);

  const fmtDate = (d) => new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h3 className="section-title" style={{ fontFamily: brand.font, fontWeight: brand.fontWeight || 400, color: brand.ink, fontSize: 'clamp(20px,2.6vw,26px)', margin: 0 }}>Shared album</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" style={{ color: brand.accent, padding: '9px 16px' }} onClick={() => setNaming(n => !n)}>+ New album</button>
          <button className="btn" style={{ background: brand.accent, padding: '9px 16px' }} onClick={() => fileRef.current?.click()}>⬆ Add photos</button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        </div>
      </div>
      <p className="section-sub" style={{ marginBottom: 14 }}>No account needed — photos go straight in.</p>

      {naming && (
        <form onSubmit={createAlbum} style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input className="field" style={{ maxWidth: 300 }} placeholder='Album name, e.g. "Snow Night"' value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
          <button className="btn" style={{ background: brand.accent }} type="submit">Create</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {albums.map(a => (
          <button key={a.id} onClick={() => setActiveId(a.id)} className="chip"
            style={{
              border: 'none', cursor: 'pointer',
              background: a.id === active?.id ? brand.accent : 'rgba(43,33,24,.07)',
              color: a.id === active?.id ? '#fff' : 'inherit',
            }}>
            {a.name} · {a.photos.length}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p style={{ color: 'var(--muted)' }}>Nothing here yet — be the first to add a photo.</p>}
      {groups.map(([date, photos], gi) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 800, letterSpacing: '.03em', fontSize: 13.5, textTransform: 'uppercase', color: brand.accent, margin: '0 0 10px' }}>{fmtDate(date)}</p>
          <div className="album-grid">
            {photos.map((p, i) => <Reveal key={p.id} delay={Math.min(i, 3)}><Photo photo={p} /></Reveal>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Top navigation ---------- */
function TopNav({ route, brand }) {
  const links = [
    ['#/', 'Home'],
    ['#/dinners', 'Dinners'],
    ['#/bikes', 'Rides'],
    ['#/trips', 'Trips'],
  ];
  return (
    <nav className="topnav" style={{ background: 'color-mix(in oklab, ' + (brand ? 'var(--' + { dinners: 'ss', bikes: 'nb', trips: 'ft' }[brand.key] + '-bg)' : 'var(--paper)') + ' 82%, transparent)' }}>
      <a href="#/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none', fontWeight: 800 }}>
        {brand && brand.logo
          ? <img src={brand.logo} alt={brand.name + ' logo'} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ width: 30, height: 30, borderRadius: '50%', background: brand ? brand.accent : 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14 }}>SP</span>}
        <span className="brand-word" style={{ fontSize: 15 }}>{brand ? brand.name : 'South Philly Community'}</span>
      </a>
      <div className="nav-links">
        {links.map(([href, label]) => (
          <a key={href} className={'nav-link' + ((route === href || (href !== '#/' && route.startsWith(href))) ? ' active' : '')} href={href}>{label}</a>
        ))}
      </div>
    </nav>
  );
}

/* ---------- Section footer ---------- */
function SectionFooter({ brand }) {
  return (
    <footer style={{ padding: '36px 0 48px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
      <p style={{ margin: 0 }}>Made with love in South Philly. Everyone&rsquo;s invited — bring a friend.</p>
      <p style={{ margin: '6px 0 0' }}>
        <a href="#/dinners" style={{ color: 'var(--ss-red)' }}>Dinners</a> · <a href="#/bikes" style={{ color: 'var(--nb-navy)' }}>Rides</a> · <a href="#/trips" style={{ color: 'var(--ft-green)' }}>Trips</a>
      </p>
    </footer>
  );
}

Object.assign(window, { BRANDS, PH_GRADS, Photo, Reveal, RsvpWidget, Board, AlbumSection, TopNav, SectionFooter });
