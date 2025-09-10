
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

// Load images and create markers
async function loadImages(images) {
    for (const { path, coordinates, description, city, dateTime } of images) {
        const [lat, lon] = coordinates.split(',').map(Number);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(path);
        const thumbUrl = isVideo ? path.replace(/\.[^\/.]+/, ".jpg") : path;

        const distanceKm = getDistance(kžš_loc.lat, kžš_loc.lon, lat, lon).toFixed(1);

        const popupHtml = `
            <div class="popup-content">
                ${dateTime === "" ? 
                    `<div class="title-row">
                        <div class="distance">${distanceKm} km</div>
                    </div>` : 
                    `<div class="title-row">
                        <div class="datetime">${dateTime}</div>
                        <div class="distance">${distanceKm} km</div>
                    </div>`}

            <div class="city-name">${city}</div>
                <div class="popup-image">
                ${isVideo
                        ? `<video autoplay muted loop playsinline" src="${path}"></video>`
                        : `<img src="${thumbUrl}" alt="Preview"/>`
                    }
                </div>
                <div class="popup-text">
                ${description}
                </div>
            </div>`;

        const icon = L.divIcon({
            className: 'photo-marker',
            html: `<img src="${thumbUrl}" alt="Slika KŽŠ nalepke v ${city}">`,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
        });

        const marker = L.marker([lat, lon], { icon }).bindPopup(popupHtml, { closeButton: false});


        markers.addLayer(marker);
        markerBounds.extend([lat, lon]);

    }
    
    // Upon loading, map will zoom to all active markers
    if (markerBounds.isValid()) {
        map.fitBounds(markerBounds, { padding: [50, 50] });
    }
    
    return markerBounds;
}
