// Create map
const map = L.map('map', {
  zoomControl: false,
  maxBoundsViscosity: 0.9,
  maxBounds: [[-95, -185], [95, 185]] // Paning map outside boundary is not possible
});

// Basemap sources
const source = ` Izvorna koda: <a href = \"https://github.com/CTJoriginal/KZS-je-biu-tle\">GitHub</a> | `
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: `${source}© OpenStreetMap contributors`,

});

const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  maxZoom: 17,
  attribution: `${source}© OpenTopoMap contributors`
});

const esriSat = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: `${source}Tiles © Esri — Viri: Esri, Maxar, Earthstar Geographics, in drugi`,
    maxZoom: 19,
    ndWrap: true,
    
});

let basemaps = [
  { name: 'Satelit', layer: esriSat, thumbnail: 'map-previews/ortofoto.jpg' },
  { name: 'OSM', layer: osm, thumbnail: 'map-previews/OSM.jpg' },
  { name: 'Topo', layer: topo, thumbnail: 'map-previews/topo.jpg' }
];

const markerBounds = L.latLngBounds();
const kžš_loc = { lat: 46.049698, lon: 14.109393 }; // KŽŠ coordinates for computing distance of stickers

// KŽŠ marker with link to our website
L.marker(kžš_loc, {
  icon: L.divIcon({
    html: `<a href="https://klub-kzs.si" target="_blank">
             <img src="images/kžš-simple.png" width="32" height="32">
           </a>`,
    className: '',
    iconSize: [32, 32]
  }),
  zIndexOffset: -10
}).addTo(map);

// Load all images to map
fetch('images.json')
  .then(res => res.json())
  .then(images => {
    (
      bounds = loadImages(images));
  })
  .catch(err => console.error('Failed to load image list:', err));


// LAYER CONTROLLER
var layerControl = L.Control.extend({
  options: {position: "topright"},
  initialize: function(mapLayers){
    this.layers = mapLayers;
  },
  onAdd: function(map){

    const container = L.DomUtil.create("div", "layer-switcher-wrapper"); 
    const button = L.DomUtil.create("div", "control-button layer-switch", container); // layer switching button
    const panel = L.DomUtil.create("div", "layer-switcher-panel", container); // Hidden panel
    
    button.title = "Izbira zemljevida"
    button.innerHTML = "☰";

    L.DomEvent.disableClickPropagation(button);
    
    this.layers.forEach((layer, i) => {
      const item = L.DomUtil.create("div", "layer-switcher-item", panel);
      item.innerHTML = `<img src=\"${layer.thumbnail}\"></img> ${layer.name}`;
      
      // Swap map layer
      item.addEventListener("click", () => {
        this.layers.forEach(l => map.removeLayer(l.layer));
        map.addLayer(layer.layer);
        
        document.querySelectorAll(".layer-switcher-item")
          .forEach(i => i.classList.remove("selected"));
      
        item.classList.toggle("selected");
      });

      if (i === 0){
        map.addLayer(layer.layer) // Activate default layer
        item.classList.add('selected'); // mark default layer as selected in menu
      }
        
    });
    
    // Toggle panel visibility on button click
    button.addEventListener("click", () => {
      panel.classList.toggle("visible");
    });
    
    // Close panel if you click outside of it
    L.DomEvent.on(document, "click", (e) => {
      if (!container.contains(e.target)){
        panel.classList.remove("visible");
    }});

    return container;
  }
});

map.addControl(new layerControl(basemaps));

// HELP BUTTON
const HelpControl = L.Control.extend({
  options: { position: 'topright' },

  onAdd: function (map) {
    const button = L.DomUtil.create('div', 'control-button');
    button.innerHTML = '?';
    button.title = "Več o akciji \"KŽŠ je biu tle\"";

    L.DomEvent.disableClickPropagation(button);

    // Display modal
    button.addEventListener('click', () => {
      document.querySelector('#mapHelpModal').classList.add('show');
    });
    
    // Close help modal if you click on × or outside of modal
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
        document.querySelector('#mapHelpModal').classList.remove('show');
      }
    });

    return button;
  }
});

map.addControl(new HelpControl());

// DEFAULT VIEW BUTTON
const DefaultView = L.Control.extend({
  options: { position: 'topright' },

  initialize: function (bounds) {
    this.bounds = bounds;
  },

  onAdd: function (map) {
    const button = L.DomUtil.create('div', 'control-button');
    button.innerHTML = 'H';
    button.title = "Ponastavi pogled";

    L.DomEvent.disableClickPropagation(button);

    button.addEventListener('click', () => {
      if (this.bounds.isValid()) {
        map.fitBounds(this.bounds, { padding: [50, 50] });
      }
    });

    return button;
  }
});

map.addControl(new DefaultView(markerBounds));

// MARKER CLUSTERS
const markers = L.markerClusterGroup({
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount();
    
    // Size of cluster depends from number of markers in cluster
    const bucket =
    count < 3 ? { cls: 'small', size: 10 } :
    count < 10 ? { cls: 'medium', size: 30 } :
    { cls: 'large', size: 54 };
    
    const html = `
    <div class="custom-cluster ${bucket.cls}" role="button" aria-label="${count} items">
    <div class="cluster-inner">
    <span class="cluster-count">${count}</span>
    </div>
    </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-cluster-wrapper',
      iconSize: L.point(bucket.size, bucket.size),
      iconAnchor: L.point(Math.round(bucket.size / 2), Math.round(bucket.size / 2)),
    });
  },
  showCoverageOnHover: false,
});

map.addLayer(markers);


