const slider = document.getElementById('slider');

function timestamp(str) {
    return new Date(str).getTime();
}

var range = {
    min: timestamp("2025-5-1"),
    max: timestamp("2026-6.18")
};

noUiSlider.create(slider, {
    range: range,
    start: (range.min + range.max ) / 2,
    steps: 1000 * 60 * 60 * 24 * 31, // 1 month steps,
    tooltips: true,
    orientation: 'vertical',
    pips: {
        mode: 'range',
        density: 2,
        format: {
            to: v => new Date(v).toLocaleDateString('sl-SI', { year: "2-digit", month: "short" }),
            from: v => v
        }
    }
});