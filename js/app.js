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

// // KŽŠ marker with link to our website
// L.marker(kžš_loc, {
//   icon: L.divIcon({
//     html: `<a href="https://klub-kzs.si" target="_blank" alt="Odpri KŽŠ spletno stran">
//              <img src="js/media/kžš-simple.png" width="32" height="32">
//            </a>`,
//     className: '',
//     iconSize: [32, 32]
//   }),
//   zIndexOffset: -10
// }).addTo(map);

// Load all images to map
fetch('images.json')
  .then(res => res.json())
  .then(images => {
    (
      bounds = loadImages(images));
  })
  .catch(err => console.error('Failed to load image list:', err));


// LAYER CONTROLLER
const layerControl = L.Control.extend({
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

    L.DomEvent.disableClickPropagation(container);
    
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
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" xml:space="preserve">
                          <g> 
                              <path d="M10,16c1.105,0,2,0.895,2,2v8c0,1.105-0.895,2-2,2H8v4h16v-4h-1.992c-1.102,0-2-0.895-2-2L20,12H8 v4H10z" fill = "currentColor"></path>
                              <circle cx="16" cy="4" r="4" fill = "currentColor"></circle>
                          </g> 
                      </svg>`;
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
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 50 50">
                          <path d = "M 25 1.0507812 C 24.7825 1.0507812 24.565859 1.1197656 24.380859 1.2597656 L 1.3808594 19.210938 C 0.95085938 19.550938 0.8709375 20.179141 1.2109375 20.619141 C 1.5509375 21.049141 2.1791406 21.129062 2.6191406 20.789062 L 4 19.710938 L 4 46 C 4 46.55 4.45 47 5 47 L 19 47 L 19 29 L 31 29 L 31 47 L 45 47 C 45.55 47 46 46.55 46 46 L 46 19.710938 L 47.380859 20.789062 C 47.570859 20.929063 47.78 21 48 21 C 48.3 21 48.589063 20.869141 48.789062 20.619141 C 49.129063 20.179141 49.049141 19.550938 48.619141 19.210938 L 25.619141 1.2597656 C 25.434141 1.1197656 25.2175 1.0507812 25 1.0507812 z M 35 5 L 35 6.0507812 L 41 10.730469 L 41 5 L 35 5 z" 
                          fill = "currentColor"></path>
                        </svg>`;
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

const min_size = 30;
const max_size = 50;

// MARKER CLUSTERS
const markers = L.markerClusterGroup({
  maxClusterRadius: function(zoom){
    return min_size + zoom * (max_size - min_size) / 17
  },
  iconCreateFunction: function (cluster) {
    const count = cluster.getChildCount(); // Number on cluster
    const numOfMarkers = markers.getLayers().length;

    
    // Linear interpolation of marker size based on minimum and maksimum size
    const clusterSize = (min_size * (numOfMarkers - count) + max_size * count) / numOfMarkers;

    return L.divIcon({
      html: `<div class="custom-cluster" style="--cluster-size:${clusterSize}px" role="button" aria-label="${count} items">
                      ${count}
                  </div>`,
      className: 'custom-cluster-wrapper',
      iconSize: L.point(clusterSize, clusterSize),
      iconAnchor: L.point(Math.round(clusterSize / 2), Math.round(clusterSize / 2)),
    });
  },
  showCoverageOnHover: false,
});

map.addLayer(markers);
