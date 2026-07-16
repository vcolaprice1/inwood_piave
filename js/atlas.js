(function () {
  'use strict';

  const colors = {
    Molino: '#2563a6', Sega: '#2f8f55', Maglio: '#c05a2b', Fucina: '#b83232',
    Gualchiera: '#7851a9', Cartiera: '#16807a', Conceria: '#9a6a20', Altro: '#65736d'
  };
  const categories = ['Molino','Sega','Maglio','Fucina','Gualchiera','Cartiera','Conceria','Altro'];
  const historicalLayers = [
    layer_IMG_20260521_091509983_modificato_4, layer_IMG_20260521_091451300_modificato_5,
    layer_IMG_20260521_091432367_modificato_6, layer_CarteidrografichefiumePiave102_modificato1_7,
    layer_CarteidrografichefiumePiave104_modificato_8, layer_CarteidrografichefiumePiave105_modificato_9,
    layer_CarteidrografichefiumePiave106_modificato_10, layer_CarteidrografichefiumePiave107_modificato_11,
    layer_CarteidrografichefiumePiave108_modificato_12, layer_CarteidrografichefiumePiave110_modificato_13,
    layer_CarteidrografichefiumePiave111_modificato_14, layer_CarteidrografichefiumePiave112_modificato_15,
    layer_Carte_20idrografiche_20fiume_20Piave_2022_modificato_16,
    layer_Carte_20idrografiche_20fiume_20Piave_2023_modificato_17
  ];

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const has = v => v !== null && v !== undefined && v !== '';
  const fmt = (v, suffix='') => has(v) ? `${Number.isFinite(Number(v)) ? Number(v).toLocaleString('it-IT', {maximumFractionDigits: 2}) : esc(v)}${suffix}` : '';
  const category = use => {
    const u = String(use || '').toLowerCase();
    if (/molin[oi]|mulin[oi]|\bpila(?:\s+orzo)?\b/.test(u)) return 'Molino';
    if (/sega|seghe/.test(u)) return 'Sega';
    if (/maglio/.test(u)) return 'Maglio';
    if (/fucin[ae]|forni|fonderia/.test(u)) return 'Fucina';
    if (/gualchiera/.test(u)) return 'Gualchiera';
    if (/cartiera/.test(u)) return 'Cartiera';
    if (/conceria/.test(u)) return 'Conceria';
    return 'Altro';
  };

  function field(label, value, suffix='') {
    if (!has(value)) return '';
    return `<div class="atlas-field"><dt>${label}</dt><dd>${fmt(value, suffix)}</dd></div>`;
  }
  function section(title, html) { return html ? `<section class="atlas-popup-section"><h3>${title}</h3><dl>${html}</dl></section>` : ''; }
  function popup(p) {
    const identity = field('Uso', p.Uso) + field('Rif. carta', p.id) + field('N. d’ordine', p.NOrd);
    const derivation = field('Canale', p.Canale) + field('Lunghezza', p.CanLung, ' m') + field('Dislivello', p.Disliv, ' m') +
      field('Corso d’acqua', p.CorsoAcq) + field('Lunghezza corso', p.CorLung, ' km') + field('Derivazione', p.Derivaz);
    const hydraulic = field('Caduta', p.Caduta, ' m') + field('Portata massima', p.PortMax, ' l/s') +
      field('Portata minima', p.PortMin, ' l/s') + field('Portata ordinaria', p.PortOrd, ' l/s');
    const duration = field('Durata massima', p.DurMax, ' mesi') + field('Durata minima', p.DurMin, ' mesi') +
      field('Durata ordinaria', p.DurOrd, ' mesi') + field('Opifici sul canale', p.NumOpif);
    const note = has(p.Osserv) ? `<section class="atlas-popup-section"><h3>Osservazioni</h3><p class="atlas-note">${esc(p.Osserv)}</p></section>` : '';
    return `<div class="atlas-popup-head"><h2>${esc(p.Denom || 'Opificio senza nome')}</h2><span class="atlas-badge">${esc(p.Uso || 'Uso non indicato')}</span></div>` +
      `<div class="atlas-popup-body">${section('Identificazione', identity)}${section('Alimentazione', derivation)}${section('Dati idraulici', hydraulic)}${section('Durata', duration)}${note}</div>`;
  }

  const counts = Object.fromEntries(categories.map(c => [c, 0]));
  const markers = [];
  layer_Opifici_completo_19.eachLayer(layer => {
    const p = layer.feature.properties; const c = category(p.Uso); counts[c]++; markers.push({layer, category:c, p});
    layer.setStyle({radius: 5.3, color: '#fffdf6', weight: 1.2, fillColor: colors[c], fillOpacity: .92});
    layer.unbindPopup(); layer.bindPopup(popup(p), {maxWidth: 360, className: 'atlas-popup'});
    layer.bindTooltip(esc(p.Denom || ''), {direction:'top', opacity:.9, sticky:true});
  });

  layer_fiumi_Bacino_Piave_23.setStyle({color:'#2d83b7', weight:1.8, opacity:.82});
  const labelledRivers = new Set();
  layer_fiumi_Bacino_Piave_23.eachLayer(layer => {
    const name = layer.feature.properties.name || layer.feature.properties.Name;
    layer.unbindPopup();
    layer.options.interactive = false;
    layer.options.className = `${layer.options.className || ''} atlas-river`.trim();
    if (layer.getElement()) layer.getElement().classList.add('atlas-river');
    layer.unbindTooltip();
    const key = String(name || '').trim().toLocaleLowerCase('it');
    if (key && !/^torrente\b/i.test(String(name).trim()) && !labelledRivers.has(key)) {
      labelledRivers.add(key);
      layer.bindTooltip(esc(name), {permanent:true, direction:'center', className:'river-label', opacity:.88});
    }
  });
  layer_Bacino_Piave_full_26.setStyle({color:'#53685c', weight:3, opacity:.92, fillColor:'#d7e4dc', fillOpacity:.08});
  layer_Bacino_Piave_full_26.eachLayer(layer => {
    layer.options.interactive = false;
    layer.options.className = `${layer.options.className || ''} atlas-basin`.trim();
    if (layer.getElement()) layer.getElement().classList.add('atlas-basin');
    if (layer.bringToBack) layer.bringToBack();
  });
  layer_Circondari_1871_Piave_25.setStyle({color:'#9b4a2f', weight:1.2, dashArray:'5 5', fillOpacity:0});
  layer_Circondari_1871_Piave_25.eachLayer(layer => {
    layer.unbindPopup();
    layer.options.interactive = false;
    layer.options.className = `${layer.options.className || ''} atlas-district`.trim();
    if (layer.getElement()) layer.getElement().classList.add('atlas-district');
  });
  map.removeLayer(layer_Circondari_1871_Piave_25);

  layer_POIs_18.setStyle({radius:3.4, color:'#fffaf0', weight:1.1, fillColor:'#6d3727', fillOpacity:.95});
  layer_POIs_18.eachLayer(layer => {
    const name = layer.feature.properties.Nome;
    if (name === 'Miniere di Agordo') {
      layer_POIs_18.removeLayer(layer);
      return;
    }
    layer.unbindPopup();
    layer.unbindTooltip();
    layer.options.interactive = false;
    layer.options.className = `${layer.options.className || ''} atlas-poi`.trim();
    if (layer.getElement()) layer.getElement().classList.add('atlas-poi');
    if (name) layer.bindTooltip(esc(name), {permanent:true, direction:'top', offset:[0,-4], className:'poi-label', opacity:.94});
  });
  layer_POIs_18.bringToFront();
  [layer_EU_1900_rect_2, layer_Austro_Hungarian_Empire_Lands_3].forEach(group => {
    group.eachLayer(layer => {
      layer.options.interactive = false;
      layer.options.className = `${layer.options.className || ''} atlas-context`.trim();
      if (layer.getElement()) layer.getElement().classList.add('atlas-context');
    });
  });
  layer_EU_1900_rect_2.bringToBack();
  layer_Austro_Hungarian_Empire_Lands_3.bringToBack();
  layer_Bacino_Piave_full_26.bringToBack();
  [layer_Padola_Ajarnola_20, layer_Pettorina_21, layer_Fiorentina_22, layer_Biois_24]
    .forEach(layer => map.removeLayer(layer));
  historicalLayers.forEach(l => { map.removeLayer(l); l.setOpacity(.62); });

  const panel = document.createElement('aside'); panel.className = 'atlas-panel';
  panel.innerHTML = `<div class="atlas-kicker">Atlante storico digitale</div><h1>Le acque e gli opifici del Piave</h1>`+
    `<p class="atlas-subtitle">Carta idrografica d’Italia · Provincia di Belluno · 1891</p>`+
    `<div class="atlas-search"><input id="atlas-search" list="atlas-names" placeholder="Cerca un opificio…" aria-label="Cerca un opificio"><span>⌕</span><datalist id="atlas-names"></datalist></div>`+
    `<div class="atlas-rule"></div><h2 class="atlas-section-title">Tipi di opificio</h2><div id="atlas-types"></div>`+
    `<div class="atlas-rule"></div><h2 class="atlas-section-title">Livelli della carta</h2>`+
    `<label class="atlas-layer"><input id="layer-rivers" type="checkbox" checked><span class="atlas-line"></span>Fiumi e torrenti</label>`+
    `<label class="atlas-layer"><input id="layer-basin" type="checkbox" checked><span class="atlas-swatch" style="background:#d7e4dc"></span>Confine del bacino</label>`+
    `<label class="atlas-layer"><input id="layer-districts" type="checkbox"><span class="atlas-swatch" style="background:#9b4a2f"></span>Circondari (1871)</label>`+
    `<label class="atlas-layer"><input id="layer-context" type="checkbox" checked><span class="atlas-swatch" style="background:#8b7d61"></span>Stati d’Europa al 1900</label>`+
    `<label class="atlas-layer"><input id="layer-historical" type="checkbox"><span class="atlas-swatch" style="background:#d0b47d"></span>Carte originali georiferite</label>`+
    `<label class="atlas-layer" for="atlas-opacity">Opacità carte <small id="opacity-value">62%</small></label><input class="atlas-opacity" id="atlas-opacity" type="range" min="20" max="100" value="62">`+
    `<div class="atlas-help"><strong>Come leggere la mappa.</strong> Clicca un punto per consultare denominazione, uso e dati idraulici dell’opificio. I valori non presenti nella fonte del 1891 non vengono mostrati.</div>`;
  document.body.appendChild(panel);
  const mobile = document.createElement('button'); mobile.className='atlas-mobile-toggle'; mobile.textContent='☰ Atlante'; mobile.onclick=()=>document.body.classList.toggle('atlas-open'); document.body.appendChild(mobile);

  const typeBox = panel.querySelector('#atlas-types');
  categories.forEach(c => {
    const row=document.createElement('label'); row.className='atlas-legend-row';
    row.innerHTML=`<input type="checkbox" checked data-category="${c}"><span class="atlas-swatch" style="background:${colors[c]}"></span>${c}<small>${counts[c]}</small>`;
    typeBox.appendChild(row);
  });
  typeBox.addEventListener('change', () => {
    const active=new Set([...typeBox.querySelectorAll('input:checked')].map(x=>x.dataset.category));
    markers.forEach(m => active.has(m.category) ? m.layer.setStyle({fillOpacity:.92,opacity:1}) : m.layer.setStyle({fillOpacity:0,opacity:0}));
  });

  const toggle=(id,layer)=>panel.querySelector(id).addEventListener('change',e=>e.target.checked?map.addLayer(layer):map.removeLayer(layer));
  toggle('#layer-rivers',layer_fiumi_Bacino_Piave_23); toggle('#layer-basin',layer_Bacino_Piave_full_26); toggle('#layer-districts',layer_Circondari_1871_Piave_25);
  panel.querySelector('#layer-context').addEventListener('change',e=>[layer_EU_1900_rect_2,layer_Austro_Hungarian_Empire_Lands_3].forEach(l=>e.target.checked?map.addLayer(l):map.removeLayer(l)));
  panel.querySelector('#layer-historical').addEventListener('change',e=>historicalLayers.forEach(l=>e.target.checked?map.addLayer(l):map.removeLayer(l)));
  panel.querySelector('#atlas-opacity').addEventListener('input',e=>{ const v=e.target.value/100; historicalLayers.forEach(l=>l.setOpacity(v)); panel.querySelector('#opacity-value').textContent=`${e.target.value}%`; });

  map.on('overlayadd', e => {
    if (e.layer === layer_Bacino_Piave_full_26) {
      e.layer.bringToBack();
      e.layer.eachLayer(layer => {
        if (layer.getElement()) layer.getElement().classList.add('atlas-basin');
      });
    }
    if (e.layer === layer_EU_1900_rect_2 || e.layer === layer_Austro_Hungarian_Empire_Lands_3) {
      e.layer.bringToBack();
      layer_Bacino_Piave_full_26.bringToBack();
      e.layer.eachLayer(layer => {
        if (layer.getElement()) layer.getElement().classList.add('atlas-context');
      });
    }
    if (e.layer === layer_Circondari_1871_Piave_25) {
      e.layer.eachLayer(layer => {
        layer.unbindPopup();
        if (layer.getElement()) layer.getElement().classList.add('atlas-district');
      });
    }
  });

  const names=panel.querySelector('#atlas-names');
  [...new Set(markers.map(m=>m.p.Denom).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it')).forEach(n=>{ const o=document.createElement('option'); o.value=n; names.appendChild(o); });
  const search=panel.querySelector('#atlas-search');
  const go=()=>{ const q=search.value.trim().toLowerCase(); if(!q)return; const m=markers.find(x=>String(x.p.Denom).toLowerCase()===q)||markers.find(x=>String(x.p.Denom).toLowerCase().includes(q)); if(m){map.setView(m.layer.getLatLng(),15);m.layer.openPopup();document.body.classList.remove('atlas-open');} };
  search.addEventListener('change',go); search.addEventListener('keydown',e=>{if(e.key==='Enter')go();});

  const basinBounds = layer_Bacino_Piave_full_26.getBounds();
  map.fitBounds(basinBounds, {paddingTopLeft:[350,20], paddingBottomRight:[20,20], animate:false});
  const startingZoom = map.getZoom();
  map.setMinZoom(startingZoom);
  map.setMaxBounds(basinBounds.pad(.16));
  map.options.maxBoundsViscosity = 1;

  const overview = document.createElement('div');
  overview.id = 'atlas-overview';
  overview.innerHTML = '<span>Europa</span>';
  document.body.appendChild(overview);
  const overviewMap = L.map(overview, {
    zoomControl:false, attributionControl:false, dragging:false, touchZoom:false,
    doubleClickZoom:false, scrollWheelZoom:false, boxZoom:false, keyboard:false
  }).setView([49, 11], 3);
  const overviewEurope = L.geoJSON(json_EU_1900_rect_2, {
    interactive:false,
    style:{color:'#57524a', weight:.7, fillColor:'#eee9dd', fillOpacity:1}
  }).addTo(overviewMap);
  L.geoJSON(json_Austro_Hungarian_Empire_Lands_3, {
    interactive:false,
    style:{color:'#6d4e3d', weight:1, fillColor:'#c9b8a0', fillOpacity:1}
  }).addTo(overviewMap);
  overviewMap.setView([50, 12], 3, {animate:false});
  L.circleMarker(basinBounds.getCenter(), {
    radius:6, color:'#fffaf0', weight:2, fillColor:'#a3422d', fillOpacity:1,
    interactive:false
  }).addTo(overviewMap);
})();
