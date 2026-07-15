// app.jsx — hash router + tweaks panel
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "animIntensity": 1,
  "landingLayout": "stack",
  "dinnerLayout": "split-band",
  "copyVariant": "warm",
  "ssAccent": "#A8332A",
  "nbAccent": "#1F3A63",
  "ftAccent": "#2E5339"
}/*EDITMODE-END*/;

function useRoute() {
  const [route, setRoute] = React.useState(location.hash || '#/');
  React.useEffect(() => {
    const on = () => { setRoute(location.hash || '#/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useRoute();

  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--anim-mult', String(t.animIntensity === 0 ? 0.0001 : 2 - t.animIntensity));
    r.setProperty('--ss-red', t.ssAccent);
    r.setProperty('--ss-red-deep', 'oklch(from ' + t.ssAccent + ' calc(l - 0.09) c h)');
    r.setProperty('--nb-navy', t.nbAccent);
    r.setProperty('--nb-navy-deep', 'oklch(from ' + t.nbAccent + ' calc(l - 0.08) c h)');
    r.setProperty('--ft-green', t.ftAccent);
    r.setProperty('--ft-green-deep', 'oklch(from ' + t.ftAccent + ' calc(l - 0.08) c h)');
  }, [t]);

  let page;
  if (route.startsWith('#/dinners')) page = <DinnersPage tweaks={t} />;
  else if (route.startsWith('#/bikes')) page = <BikesPage tweaks={t} />;
  else if (route.startsWith('#/trips')) page = <TripsPage tweaks={t} />;
  else page = <Landing tweaks={t} />;

  return (
    <React.Fragment>
      {page}
      <TweaksPanel>
        <TweakSection label="Motion" />
        <TweakSlider label="Animation intensity" value={t.animIntensity} min={0} max={1.8} step={0.1}
                     onChange={(v) => setTweak('animIntensity', v)} />
        <TweakSection label="Landing" />
        <TweakRadio label="Panel layout" value={t.landingLayout} options={['stack', 'grid']}
                    onChange={(v) => setTweak('landingLayout', v)} />
        <TweakRadio label="Dinner panel text" value={t.dinnerLayout} options={['lower-band', 'split-band', 'split', 'stacked']}
                    onChange={(v) => setTweak('dinnerLayout', v)} />
        <TweakSection label="Copy" />
        <TweakRadio label="Voice" value={t.copyVariant} options={['warm', 'direct']}
                    onChange={(v) => setTweak('copyVariant', v)} />
        <TweakSection label="Accents" />
        <TweakColor label="Dinners" value={t.ssAccent} options={['#A8332A', '#8E4A1F', '#B54235']}
                    onChange={(v) => setTweak('ssAccent', v)} />
        <TweakColor label="Rides" value={t.nbAccent} options={['#1F3A63', '#27567F', '#2F4A38']}
                    onChange={(v) => setTweak('nbAccent', v)} />
        <TweakColor label="Trips" value={t.ftAccent} options={['#2E5339', '#3E6844', '#4A5D23']}
                    onChange={(v) => setTweak('ftAccent', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
