// data.js — seed data + localStorage persistence for the community prototype
(function () {
  const KEY = 'spc_store_v1';

  // Deterministic "photo" placeholders: each is a gradient recipe + caption.
  // Swap for real photos later by replacing `src` with an image path.
  const P = (brand, hue, cap) => ({ brand, hue, cap });

  const seed = {
    rsvps: {
      // eventId -> [{name, guests, ts}]
      'dinner-2026-07-18': [
        { name: 'Marisol', guests: 2, ts: 1 },
        { name: 'Dev', guests: 1, ts: 2 },
        { name: 'Katie + roommates', guests: 3, ts: 3 },
      ],
      'ride-2026-07-19': [
        { name: 'Tom', guests: 1, ts: 1 },
        { name: 'Priya', guests: 1, ts: 2 },
      ],
      'trip-wharton': [
        { name: 'Marisol', guests: 2, ts: 1 },
        { name: 'Jesse', guests: 1, ts: 2 },
        { name: 'Anna & Theo', guests: 2, ts: 3 },
        { name: 'Sam', guests: 1, ts: 4 },
      ],
    },
    thumbs: {
      'dinner-2026-07-18': 9,
      'ride-2026-07-19': 5,
      'trip-wharton': 3,
    },
    myThumbs: {},

    albums: [
      // Dinners: main album grouped by date + special named albums
      { id: 'din-main', section: 'dinners', name: 'Saturday Dinners', main: true,
        photos: [
          { id: 'p1', date: '2026-07-11', src: 'assets/photos/dinner-couch.jpg', cap: 'Pizza on the couch' },
          { id: 'p2', date: '2026-07-11', src: 'assets/photos/dinner-selfie.jpg', cap: 'Your host, full house' },
          { id: 'p3', date: '2026-07-11', ...P('ss', 34, 'Dough stretching') },
          { id: 'p4', date: '2026-07-04', ...P('ss', 4, 'Fourth of July slices') },
          { id: 'p5', date: '2026-07-04', ...P('ss', 16, 'Backyard string lights') },
          { id: 'p6', date: '2026-06-27', src: 'assets/photos/dinner-group.jpg', cap: 'New faces, good night' },
          { id: 'p7', date: '2026-06-27', ...P('ss', 40, 'Oven at 900°') },
          { id: 'p8', date: '2026-06-20', ...P('ss', 12, 'First basil harvest') },
        ] },
      { id: 'din-100', section: 'dinners', name: 'The 100th Dinner', main: false,
        photos: [
          { id: 'p9', date: '2026-05-30', ...P('ss', 6, 'Cake instead of pizza') },
          { id: 'p10', date: '2026-05-30', ...P('ss', 18, 'Everyone who came') },
          { id: 'p11', date: '2026-05-30', ...P('ss', 30, 'Toast to 100') },
        ] },
      // Rides: one album per ride
      { id: 'ride-0712', section: 'bikes', name: 'Ride · Jul 12 — Manayunk', main: true,
        photos: [
          { id: 'p11b', date: '2026-07-12', src: 'assets/photos/ride-staging.jpg', cap: 'Staging up on Mifflin St' },
          { id: 'p12', date: '2026-07-12', src: 'assets/photos/ride-coffee.jpg', cap: 'Coffee & sandwiches, The Landing' },
          { id: 'p13', date: '2026-07-12', src: 'assets/photos/ride-fallen-tree.jpg', cap: 'Storm blocked the trail' },
          { id: 'p14', date: '2026-07-12', src: 'assets/photos/ride-uprooted.jpg', cap: 'Whole tree came down' },
        ] },
      { id: 'ride-0705', section: 'bikes', name: 'Ride · Jul 5 — Manayunk', main: false,
        photos: [
          { id: 'p15', date: '2026-07-05', ...P('nb', 215, 'Sunrise over the river') },
          { id: 'p16', date: '2026-07-05', ...P('nb', 228, 'Flat fix, mile 6') },
        ] },
      // Trips: one album per trip
      { id: 'trip-wharton-album', section: 'trips', name: 'Wharton State Forest', main: true,
        photos: [
          { id: 'p17', date: '2026-06-14', ...P('ft', 110, 'Scouting the campsite') },
          { id: 'p18', date: '2026-06-14', ...P('ft', 130, 'Batona Trail walk') },
          { id: 'p19', date: '2026-06-14', ...P('ft', 95, 'Campfire planning') },
        ] },
    ],

    posts: {
      dinners: [
        { id: 'd1', title: 'Anyone want to carpool from Fishtown this week?', author: 'Dev', ts: '2 days ago', votes: 6,
          body: 'I have room for 3. Leaving around 5:20.',
          comments: [
            { author: 'Katie', text: 'Yes please! Me + 1.', ts: '2 days ago' },
            { author: 'Dev', text: 'You got it. See you Saturday.', ts: '1 day ago' },
          ] },
        { id: 'd2', title: 'Gluten-free dough experiment: verdict?', author: 'Marisol', ts: '5 days ago', votes: 11,
          body: 'Last week\u2019s GF pie was honestly great. Should we make it a regular thing?',
          comments: [ { author: 'Tom', text: 'Best GF crust I\u2019ve had in Philly, no joke.', ts: '4 days ago' } ] },
      ],
      bikes: [
        { id: 'b1', title: 'Rate check: is 10mph chill enough for a hybrid?', author: 'Priya', ts: '3 days ago', votes: 4,
          body: 'Thinking of joining Sunday but I\u2019m on an old hybrid with a basket.',
          comments: [ { author: 'Tom', text: 'Totally fine. No-drop ride, we regroup constantly.', ts: '3 days ago' } ] },
        { id: 'b2', title: 'Route idea: Bartram\u2019s Garden loop for August?', author: 'Jesse', ts: '1 week ago', votes: 8,
          body: 'Change of scenery — trail the whole way, ends at the river garden.',
          comments: [] },
      ],
      trips: [
        { id: 't1', title: 'Wharton trip: who has extra tents?', author: 'Anna', ts: '1 day ago', votes: 7,
          body: 'We have a 2-person. Need roughly two more tents for the group.',
          comments: [
            { author: 'Sam', text: 'I\u2019ve got a 4-person I never use. It\u2019s yours.', ts: '1 day ago' },
            { author: 'Jesse', text: 'REI rents them cheap if we\u2019re still short.', ts: '20 hours ago' },
          ] },
      ],
    },

    trips: [
      { id: 'trip-wharton', name: 'Wharton State Forest Camping', dates: 'Aug 15–16, 2026', status: 'open',
        blurb: 'One night under the pines in the Jersey Pine Barrens. Campfire dinner, short Batona Trail hike Sunday morning. About an hour from South Philly.',
        cost: 'Free — we may split a group campsite fee (~$5 each) if we outgrow the free sites.',
        meet: 'Carpool from the usual dinner block, Sat 9am' },
      { id: 'trip-ricketts', name: 'Ricketts Glen Waterfall Hike', dates: 'Sept — date TBD', status: 'planning',
        blurb: 'Day trip to the falls loop — 21 waterfalls in 7 miles. We\u2019ll vote on a date once summer settles down.',
        cost: 'Free. Gas split for drivers.',
        meet: 'TBD' },
    ],
  };

  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { store = null; }
  if (!store || store.__v !== 5) { store = JSON.parse(JSON.stringify(seed)); store.__v = 5; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  window.SPC = {
    get: () => store,
    save,
    addRsvp(eventId, name, guests) {
      (store.rsvps[eventId] = store.rsvps[eventId] || []).push({ name, guests, ts: Date.now() });
      save();
    },
    toggleThumb(eventId) {
      const on = !!store.myThumbs[eventId];
      store.thumbs[eventId] = (store.thumbs[eventId] || 0) + (on ? -1 : 1);
      store.myThumbs[eventId] = !on;
      save();
      return !on;
    },
    addPhoto(albumId, dataUrl, cap) {
      const a = store.albums.find(x => x.id === albumId);
      if (!a) return;
      a.photos.unshift({ id: 'u' + Date.now(), date: new Date().toISOString().slice(0, 10), src: dataUrl, cap: cap || 'Community photo' });
      save();
    },
    addAlbum(section, name) {
      const id = 'al' + Date.now();
      store.albums.push({ id, section, name, main: false, photos: [] });
      save();
      return id;
    },
    addPost(section, title, body, author) {
      store.posts[section].unshift({ id: 'np' + Date.now(), title, body, author: author || 'Neighbor', ts: 'just now', votes: 1, comments: [] });
      save();
    },
    addComment(section, postId, text, author) {
      const p = store.posts[section].find(x => x.id === postId);
      if (p) { p.comments.push({ author: author || 'Neighbor', text, ts: 'just now' }); save(); }
    },
    vote(section, postId, delta) {
      const p = store.posts[section].find(x => x.id === postId);
      if (p) { p.votes += delta; save(); }
    },
  };
})();
