const icon_size = 44;
let prev_zoom = 0;
let prev_latLong;
const targetZoom = 16; // Zoom level after clicking on marker


// Haversine distance bewtwwn 2 points on Earth in km
function getDistance(lat1, lon1, lat2, lon2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function gezZoomDuration(level1, level2, maxDuration = 2, minDuration = 0.05, maxlevel = 17){
    // computes zoom time using linear interpolation
    // Bigger difference between 2 levels take longer time to zoom in

    return minDuration + Math.abs(level1 - level2) * (maxDuration - minDuration) / maxlevel;
}


// Load images and create markers
async function loadImages(images) {
    let Nalepke = []
    for (const { path, coordinates, description, city, dateTime } of images) {
        const [lat, lon] = coordinates.split(',').map(Number);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(path);
        const thumbUrl = isVideo ? path.replace(/\.[^\/.]+/, ".jpg") : path;

        const distanceKm = getDistance(kžš_loc.lat, kžš_loc.lon, lat, lon).toFixed(1);

        const isFarthest = false;

        Nalepke.push({ path, lat, lon, isVideo, thumbUrl, distanceKm, isFarthest, description, city, dateTime });
    }

    // Find and tag the farthest sticker
    Nalepke.reduce((a, b) => Number(a.distanceKm) > Number(b.distanceKm) ? a : b)
        .isFarthest = true;

    for (const nalepka of Nalepke) {
        const popupHtml = `
            <div class="popup-content ${nalepka.isFarthest ? " farthest" : ""}">
                ${nalepka.dateTime === "" ?
                `<div class="title-row">
                        <div class="distance">${nalepka.distanceKm} km</div>
                    </div>` :
                `<div class="title-row">
                        <div class="datetime">${nalepka.dateTime}</div>
                        <div class="distance">${nalepka.distanceKm} km</div>
                    </div>`}

            <div class="city-name">${nalepka.city}</div>
                <div class="popup-image">
                ${nalepka.isVideo
                ? `<video autoplay muted loop playsinline" src="${nalepka.path}"></video>`
                : `<img src="${nalepka.thumbUrl}" alt="Preview"/>`}
                </div>
                <div class="popup-text">
                ${nalepka.description}
                </div>
            </div>`;

        const icon = L.divIcon({
            className: `photo-marker${nalepka.isFarthest ? " farthest" : ""}`,
            html: `
            <div class="photo-marker-wrapper">
                <img src="${nalepka.thumbUrl}" alt="Slika KŽŠ nalepke v ${nalepka.city}">
            </div>
            ${nalepka.isFarthest ? `<svg width="100%" height="100%" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
                <path d="M238.72754,73.53516a15.90424,15.90424,0,0,0-16.70508-2.29981l-50.584,22.48242L141.98633,40.70312a15.999,15.999,0,0,0-27.97266,0L84.56055,93.7168,33.96875,71.23145A16.00031,16.00031,0,0,0,11.89551,89.51172l25.44531,108.333a15.83567,15.83567,0,0,0,7.4082,10.09179,16.15491,16.15491,0,0,0,12.49317,1.65137,265.89708,265.89708,0,0,1,141.46875-.01367,16.15265,16.15265,0,0,0,12.4873-1.65137,15.83531,15.83531,0,0,0,7.40821-10.084L244.0957,89.52051A15.90513,15.90513,0,0,0,238.72754,73.53516Z"
                fill = "currentColor"/>
            </svg>` : ""}
                    `,
            iconSize: [icon_size, icon_size],
            iconAnchor: [icon_size / 2, icon_size / 2],
            popupAnchor: [3, -icon_size / 2],
        });

        const marker = L.marker([nalepka.lat, nalepka.lon], { icon })
            .bindPopup(popupHtml, { closeButton: false, className: nalepka.isFarthest ? " farthest" : ""});

        marker.on("popupopen", (e) => {
            prev_zoom = map.getZoom();
            const DynamicZoomTarget = map.getZoom() > targetZoom ? map.getZoom() : targetZoom;
            const popup = e.popup;
            const popupEl = popup.getElement();
            const popupHeight = popupEl.offsetHeight;
            const padding = 15;

            // Project the latLng to pixel coordinates at the target zoom
            const projected = map.project(popup.getLatLng(), DynamicZoomTarget);

            // Shift up by half popup height + padding
            const shifted = L.point(projected.x, projected.y - (popupHeight / 2 + padding));

            // Convert back to latLng at target zoom
            const shiftedLatLng = map.unproject(shifted, DynamicZoomTarget);

            map.flyTo(shiftedLatLng, DynamicZoomTarget, {
                animate: true, 
                duration: gezZoomDuration(prev_zoom, DynamicZoomTarget) }); // Zoom map to computed coordinate
            prev_latLong = shiftedLatLng;
        });

        
        marker.getPopup().on("remove", (e) => {
            const mapZoom = map.getZoom();
            const popupLatLng = e.target.getLatLng(); // e.target is the popup
            const currentCenter = map.getCenter()
            // console.log(currentCenter.distanceTo(prev_latLong))
            console.log(prev_zoom - mapZoom)

            if (currentCenter.distanceTo(prev_latLong) < 200 && mapZoom <= targetZoom) {
                map.flyTo(popupLatLng, prev_zoom, { 
                animate: true, 
                duration: gezZoomDuration(prev_zoom, mapZoom, 1) // duration in seconds
             }); 
            }
        });

        markers.addLayer(marker);
        markerBounds.extend([nalepka.lat, nalepka.lon]);

    }


    // Upon loading, map will zoom to all active markers
    if (markerBounds.isValid()) {
        map.fitBounds(markerBounds, { padding: [50, 50] });
    }

    return markerBounds;
}
