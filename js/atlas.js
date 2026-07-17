(function () {
  'use strict';

  const colors = {
    Molino: '#2563a6', Sega: '#2f8f55', Maglio: '#c05a2b', Fucina: '#b83232',
    Gualchiera: '#7851a9', Cartiera: '#16807a', Conceria: '#9a6a20',
    Lanificio: '#8f5273', Altro: '#65736d'
  };
  const categories = ['Molino','Sega','Maglio','Fucina','Gualchiera','Cartiera','Conceria','Lanificio','Altro'];
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
  const normalizeGeoName = value => {
    const connectors = new Set(['di','del','dello','della','dei','degli','delle','de','da','dal','dallo','dalla','e','o']);
    return String(value || '').toLocaleLowerCase('it').split(/\s+/).map((word,index) => {
      if (index > 0 && connectors.has(word)) return word;
      return word.split('-').map(part => part ? part.charAt(0).toLocaleUpperCase('it') + part.slice(1) : part).join('-');
    }).join(' ');
  };
  const administrativeName = (prefix,value) => {
    const name=String(value || '').trim().replace(new RegExp(`^${prefix}\\s+(?:di\\s+)?`,'i'),'');
    return `${prefix} di ${normalizeGeoName(name)}`;
  };
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
    if (/lanificio/.test(u)) return 'Lanificio';
    return 'Altro';
  };

  const layerProvince1881 = L.geoJSON(json_Province_Veneto_1881, {
    interactive:true,
    style:{color:'#8b4a36',weight:2,fill:false,dashArray:'8 5',className:'province-boundary-1881'},
    onEachFeature:(f,l)=>l.bindPopup(`<strong>${esc(administrativeName('Provincia',f.properties.DEN_PROV))}</strong>`,{className:'historical-boundary-popup',maxWidth:220})
  });
  const layerCircondari1881 = L.geoJSON(json_Circondari_Bacino_1881, {
    interactive:true,
    style:{color:'#b2763b',weight:1.5,fill:false,dashArray:'5 4',className:'district-boundary-1881'},
    onEachFeature:(f,l)=>l.bindPopup(`<strong>${esc(administrativeName('Circondario',f.properties.DEN_CIRC))}</strong>`,{className:'historical-boundary-popup',maxWidth:220})
  });
  const layerComuni1881 = L.geoJSON(json_Comuni_Belluno_1881, {
    interactive:false,
    style:f=>f.properties.AUSTRO_UNGARICO
      ? {color:'#8d2f2f',weight:1.5,fillColor:'#c65c52',fillOpacity:.24,dashArray:'4 3'}
      : {color:'#65776d',weight:.8,fillColor:'#dce7df',fillOpacity:.08},
    onEachFeature:(f,l)=>{
      const label=esc(f.properties.ETICHETTA_1891);
      l.bindTooltip(label,{permanent:true,direction:'center',className:f.properties.AUSTRO_UNGARICO?'comune-label austro':'comune-label'});
      l.once('add',()=>l.openTooltip(typeof l.getCenter==='function' ? l.getCenter() : l.getBounds().getCenter()));
    }
  });
  const layerLaghi = L.geoJSON(json_Laghi_Piave, {
    style:{color:'#176b9b',weight:1.2,fillColor:'#55a9d6',fillOpacity:.72},
    onEachFeature:(f,l)=>l.bindTooltip(esc(normalizeGeoName(f.properties.nome || 'Lago')),{sticky:true,className:'lake-label'})
  }).addTo(map);
  const primaryLocalities = new Set(['Belluno','Feltre','Agordo','Longarone','Pieve di Cadore','Auronzo',"Cortina d'Ampezzo"]);
  const layerLocalita = L.geoJSON(json_Localita_rilevanti, {
    pointToLayer:(f,latlng)=>L.circleMarker(latlng,{radius:4.2,color:'#fffaf0',weight:1.3,fillColor:'#5a2f24',fillOpacity:.96}),
    onEachFeature:(f,l)=>l.bindTooltip(esc(f.properties.Nome),{permanent:true,direction:'top',offset:[0,-5],className:`localita-label ${primaryLocalities.has(f.properties.Nome)?'localita-primary':'localita-secondary'}`})
  }).addTo(map);
  const updateScaleLabels = () => {
    map.getContainer().classList.toggle('hide-commune-labels', map.getZoom() < 11);
    map.getContainer().classList.toggle('hide-secondary-labels', map.getZoom() < 11);
  };
  map.on('zoomend', updateScaleLabels);
  updateScaleLabels();

  function pointInRing(point, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > point[1]) !== (yj > point[1])) &&
          (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function pointInPolygon(point, polygon) {
    return pointInRing(point, polygon[0]) && !polygon.slice(1).some(ring => pointInRing(point, ring));
  }
  function pointInGeometry(point, geometry) {
    if (!geometry) return false;
    if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(polygon => pointInPolygon(point, polygon));
    return false;
  }
  const basinGeometries = json_Bacino_Piave_full_26.features.map(feature => feature.geometry);
  const insideBasin = point => basinGeometries.some(geometry => pointInGeometry(point, geometry));

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
  const allRecords = [];
  const outsideBasin = [];
  layer_Opifici_completo_19.eachLayer(layer => {
    const coordinates = layer.feature.geometry.coordinates;
    const p = layer.feature.properties; const c = category(p.Uso); const record = {layer, category:c, p};
    allRecords.push(record);
    layer.setStyle({radius: 5.3, color: '#fffdf6', weight: 1.2, fillColor: colors[c], fillOpacity: .92});
    layer.unbindPopup(); layer.bindPopup(popup(p), {
      maxWidth:360,
      className:'atlas-popup',
      autoPan:true,
      keepInView:true,
      autoPanPaddingTopLeft:[370,90],
      autoPanPaddingBottomRight:[70,90]
    });
    if (!insideBasin(coordinates)) {
      outsideBasin.push(layer);
      return;
    }
    counts[c]++; markers.push(record);
  });
  outsideBasin.forEach(layer => layer_Opifici_completo_19.removeLayer(layer));
  map.getPane('pane_Opifici_completo_19').style.zIndex=650;

  layer_fiumi_Bacino_Piave_23.setStyle({color:'#2d83b7', weight:1.8, opacity:.82});
  const majorRiverNames = new Map([
    ['FIUME PIAVE','Fiume Piave'], ['FIUME PIAVE VECCHIA','Fiume Piave Vecchia'],
    ['TORRENTE BOITE','Torrente Boite'], ['TORRENTE CORDEVOLE','Torrente Cordevole'],
    ['TORRENTE ANSIEI','Torrente Ansiei'], ['TORRENTE MA�','Torrente Maè'],
    ['TORRENTE BIOIS','Torrente Biois'], ['TORRENTE PADOLA','Torrente Padola'],
    ['TORRENTE MIS','Torrente Mis'], ['TORRENTE CAORAME','Torrente Caorame'],
    ['TORRENTE SONNA','Torrente Sonna'], ['TORRENTE FIORENTINA','Torrente Fiorentina'],
    ['TORRENTE OMBRETTA - PETTORINA','Torrente Pettorina'], ['TORRENTE ARDO','Torrente Ardo'],
    ['TORRENTE VAJONT','Torrente Vajont']
  ]);
  const riverLabelCandidates = new Map();
  layer_fiumi_Bacino_Piave_23.eachLayer(layer => {
    const name = layer.feature.properties.NOME_CI || layer.feature.properties.name || layer.feature.properties.Name;
    layer.unbindPopup();
    layer.options.interactive = false;
    layer.options.className = `${layer.options.className || ''} atlas-river`.trim();
    if (layer.getElement()) layer.getElement().classList.add('atlas-river');
    layer.unbindTooltip();
    const sourceName = String(name || '').trim().toUpperCase();
    const displayName = majorRiverNames.get(sourceName);
    if (displayName) {
      const score = JSON.stringify(layer.feature.geometry.coordinates).length;
      const current = riverLabelCandidates.get(sourceName);
      if (!current || score > current.score) riverLabelCandidates.set(sourceName,{layer,displayName,score});
    }
  });
  riverLabelCandidates.forEach(({layer,displayName})=>layer.bindTooltip(esc(displayName), {permanent:true, direction:'center', className:'river-label', opacity:.88}));
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

  map.removeLayer(layer_POIs_18);
  [layer_EU_1900_rect_2, layer_Austro_Hungarian_Empire_Lands_3].forEach(group => {
    group.eachLayer(layer => {
      layer.options.interactive = false;
      layer.options.className = `${layer.options.className || ''} atlas-context`.trim();
      if (layer.getElement()) layer.getElement().classList.add('atlas-context');
    });
  });
  layer_EU_1900_rect_2.setStyle({color:'#57524a',weight:.8,fillColor:'#eee9dd',fillOpacity:1,opacity:1});
  layer_Austro_Hungarian_Empire_Lands_3.setStyle({color:'#6d4e3d',weight:1.2,fillColor:'#c9b8a0',fillOpacity:1,opacity:1});
  layer_EU_1900_rect_2.bringToBack();
  layer_Austro_Hungarian_Empire_Lands_3.bringToBack();
  layer_Bacino_Piave_full_26.bringToBack();
  [layer_Padola_Ajarnola_20, layer_Pettorina_21, layer_Fiorentina_22, layer_Biois_24]
    .forEach(layer => map.removeLayer(layer));
  historicalLayers.forEach(l => { map.removeLayer(l); l.setOpacity(.62); });

  const panel = document.createElement('aside'); panel.className = 'atlas-panel';
  panel.innerHTML = `<div class="atlas-kicker">Atlante storico digitale</div><h1>Le acque e gli opifici del Piave</h1>`+
    `<p class="atlas-subtitle">Carta idrografica d’Italia · Provincia di Belluno · 1891</p>`+
    `<div class="atlas-help"><strong>Come leggere la mappa.</strong> Cerca un opificio o clicca un punto per consultarne denominazione, uso e dati idraulici. Attiva i livelli storici per confrontare province, circondari e comuni del 1881; i territori allora austro-ungarici sono evidenziati in rosso.</div>`+
    `<div class="atlas-search"><input id="atlas-search" list="atlas-names" placeholder="Cerca un opificio…" aria-label="Cerca un opificio"><span>⌕</span><datalist id="atlas-names"></datalist></div>`+
    `<div class="atlas-rule"></div><h2 class="atlas-section-title">Tipi di opificio</h2><div id="atlas-types"></div>`+
    `<div class="atlas-rule"></div><h2 class="atlas-section-title">Livelli della carta</h2>`+
    `<label class="atlas-layer"><input id="layer-rivers" type="checkbox" checked><span class="atlas-line"></span>Fiumi e torrenti</label>`+
    `<label class="atlas-layer"><input id="layer-lakes" type="checkbox" checked><span class="atlas-swatch" style="background:#55a9d6"></span>Laghi</label>`+
    `<label class="atlas-layer"><input id="layer-localities" type="checkbox" checked><span class="atlas-swatch" style="background:#5a2f24"></span>Località rilevanti</label>`+
    `<label class="atlas-layer"><input id="layer-basin" type="checkbox" checked><span class="atlas-swatch" style="background:#d7e4dc"></span>Confine del bacino</label>`+
    `<label class="atlas-layer"><input id="layer-provinces-1881" type="checkbox"><span class="atlas-line historical-province"></span>Province del Veneto (1881)</label>`+
    `<label class="atlas-layer"><input id="layer-districts-1881" type="checkbox"><span class="atlas-line historical-district"></span>Circondari attigui (1881)</label>`+
    `<label class="atlas-layer"><input id="layer-municipalities-1881" type="checkbox"><span class="atlas-swatch" style="background:#dce7df"></span>Comuni bellunesi (1881)</label>`+
    `<div class="atlas-austro-key"><span class="atlas-swatch" style="background:#c65c52"></span>Territori austro-ungarici</div>`+
    `<label class="atlas-layer"><input id="layer-context" type="checkbox" checked><span class="atlas-swatch" style="background:#8b7d61"></span>Confini europei storici (1900)</label>`+
    `<label class="atlas-layer"><input id="layer-historical" type="checkbox"><span class="atlas-swatch" style="background:#d0b47d"></span>Carte originali georiferite</label>`+
    `<label class="atlas-layer" for="atlas-opacity">Opacità carte <small id="opacity-value">62%</small></label><input class="atlas-opacity" id="atlas-opacity" type="range" min="20" max="100" value="62">`;
  document.body.appendChild(panel);
  const mobile = document.createElement('button'); mobile.className='atlas-mobile-toggle'; mobile.textContent='☰ Atlante'; mobile.onclick=()=>document.body.classList.toggle('atlas-open'); document.body.appendChild(mobile);
  const dataButton = document.createElement('button'); dataButton.id='atlas-data-open'; dataButton.className='atlas-data-fab'; dataButton.type='button'; dataButton.textContent=`Dataset (${allRecords.length})`; document.body.appendChild(dataButton);

  const typeBox = panel.querySelector('#atlas-types');
  categories.forEach(c => {
    if (!counts[c]) return;
    const row=document.createElement('label'); row.className='atlas-legend-row';
    row.innerHTML=`<input type="checkbox" checked data-category="${c}"><span class="atlas-swatch" style="background:${colors[c]}"></span>${c}<small>${counts[c]}</small>`;
    typeBox.appendChild(row);
  });
  typeBox.addEventListener('change', () => {
    const active=new Set([...typeBox.querySelectorAll('input:checked')].map(x=>x.dataset.category));
    markers.forEach(m => active.has(m.category) ? m.layer.setStyle({fillOpacity:.92,opacity:1}) : m.layer.setStyle({fillOpacity:0,opacity:0}));
  });

  const bringPointsToFront=()=>{
    if(map.hasLayer(layer_Opifici_completo_19)) layer_Opifici_completo_19.bringToFront();
    if(map.hasLayer(layerLocalita)) layerLocalita.bringToFront();
  };
  const toggle=(id,layer)=>panel.querySelector(id).addEventListener('change',e=>{
    e.target.checked ? map.addLayer(layer) : map.removeLayer(layer);
    bringPointsToFront();
  });
  toggle('#layer-rivers',layer_fiumi_Bacino_Piave_23);
  toggle('#layer-lakes',layerLaghi);
  toggle('#layer-localities',layerLocalita);
  toggle('#layer-basin',layer_Bacino_Piave_full_26);
  toggle('#layer-provinces-1881',layerProvince1881);
  toggle('#layer-districts-1881',layerCircondari1881);
  panel.querySelector('#layer-municipalities-1881').addEventListener('change',e=>{
    const localitiesToggle=panel.querySelector('#layer-localities');
    if(e.target.checked){
      map.addLayer(layerComuni1881);
      localitiesToggle.checked=false;
      map.removeLayer(layerLocalita);
    }else{
      map.removeLayer(layerComuni1881);
      localitiesToggle.checked=true;
      map.addLayer(layerLocalita);
    }
    bringPointsToFront();
  });
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

  const dataFields = [
    ['Denom','Denominazione'], ['Uso','Uso'], ['NOrd','N. ordine'], ['Canale','Canale'],
    ['CanLung','Lunghezza canale (m)'], ['Disliv','Dislivello (m)'], ['CorsoAcq','Corso d’acqua'],
    ['CorLung','Lunghezza corso (km)'], ['Derivaz','Derivazione'], ['Caduta','Caduta (m)'],
    ['PortMax','Portata max (l/s)'], ['PortMin','Portata min (l/s)'], ['PortOrd','Portata ordinaria (l/s)'],
    ['DurMax','Durata max (mesi)'], ['DurMin','Durata min (mesi)'], ['DurOrd','Durata ordinaria (mesi)'],
    ['NumOpif','N. opifici'], ['Osserv','Osservazioni'], ['PdfPage','Pagina fonte']
  ];
  const dataPanel = document.createElement('section');
  dataPanel.className = 'atlas-data-panel';
  dataPanel.setAttribute('aria-hidden','true');
  dataPanel.innerHTML = `<div class="atlas-data-head"><h2>Dataset degli opifici</h2>`+
    `<input id="atlas-data-search" class="atlas-data-search" type="search" placeholder="Cerca in tutti i campi&hellip;" aria-label="Cerca nella tabella">`+
    `<span id="atlas-data-count" class="atlas-data-count"></span><button class="atlas-data-close" type="button" aria-label="Chiudi">&times;</button></div>`+
    `<div class="atlas-table-wrap"><table class="atlas-data-table"><thead><tr>${dataFields.map(f=>`<th>${f[1]}</th>`).join('')}</tr></thead><tbody></tbody></table></div>`;
  document.body.appendChild(dataPanel);
  const dataBody = dataPanel.querySelector('tbody');
  const dataSearch = dataPanel.querySelector('#atlas-data-search');
  const dataCount = dataPanel.querySelector('#atlas-data-count');
  let visibleRows = allRecords;
  function renderDataRows() {
    dataBody.innerHTML = visibleRows.map((m,index)=>`<tr data-index="${index}">${dataFields.map(([key])=>`<td title="${esc(m.p[key])}">${esc(m.p[key] ?? '')}</td>`).join('')}</tr>`).join('');
    dataCount.textContent = `${visibleRows.length} di ${allRecords.length}`;
  }
  function filterData() {
    const query = dataSearch.value.trim().toLocaleLowerCase('it');
    visibleRows = query ? allRecords.filter(m=>dataFields.some(([key])=>String(m.p[key] ?? '').toLocaleLowerCase('it').includes(query))) : allRecords;
    renderDataRows();
  }
  renderDataRows();
  dataSearch.addEventListener('input',filterData);
  dataBody.addEventListener('click',event=>{
    const row=event.target.closest('tr'); if(!row)return;
    const marker=visibleRows[Number(row.dataset.index)];
    if (!layer_Opifici_completo_19.hasLayer(marker.layer)) layer_Opifici_completo_19.addLayer(marker.layer);
    if (!map.hasLayer(layer_Opifici_completo_19)) map.addLayer(layer_Opifici_completo_19);
    map.setView(marker.layer.getLatLng(),15); marker.layer.openPopup();
    dataPanel.classList.remove('is-open'); dataPanel.setAttribute('aria-hidden','true');
  });
  dataButton.addEventListener('click',()=>{
    dataPanel.classList.add('is-open'); dataPanel.setAttribute('aria-hidden','false');
    setTimeout(()=>dataSearch.focus(),260);
  });
  dataPanel.querySelector('.atlas-data-close').addEventListener('click',()=>{
    dataPanel.classList.remove('is-open'); dataPanel.setAttribute('aria-hidden','true');
  });

  const basinBounds = layer_Bacino_Piave_full_26.getBounds();
  map.fitBounds(basinBounds, {paddingTopLeft:[350,20], paddingBottomRight:[20,20], animate:false});
  const startingZoom = map.getZoom();
  map.setMinZoom(Math.max(1,startingZoom-1));
  map.setMaxBounds(basinBounds.pad(.65));
  map.options.maxBoundsViscosity=.55;

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
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('atlas-loading');
    const loading = document.getElementById('atlas-loading-screen');
    if (loading) loading.remove();
    map.invalidateSize(false);
  }));
})();
