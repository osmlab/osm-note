var leafletOsmNotes = require('leaflet-osm-notes'),
    d3 = require('d3');

(function addHeightClasses() {
    var TOP = 50; // top margin
    var style = document.createElement('style');
    style.type = 'text/css';
    var txt = '';
    var fourth = (window.innerHeight - TOP) / 4;
    for (var i = 1; i <= 4; i++) {
        txt += '.height' + i + '{height:' + (fourth * i) + 'px;}';
        txt += '.topmargin' + i + '{margin-top:' + (fourth * i) + 'px;}';
    }
    style.innerHTML = txt;
    document.getElementsByTagName('head')[0].appendChild(style);
})();

var map = L.map('map', {
    attributionControl: false,
    zoomControl: false
}).setView([0, 0], 2);

// Once we've got a position, zoom and center the map
// on it, and add a single marker.
map.on('locationfound', function(e) {
    map.fitBounds(e.bounds);
});

map.locate();

// Add zoom controls for systems without touch zoom
if (!map.touchZoom) L.Control.zoom().addTo(map);

L.tileLayer('http://a.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png').addTo(map);

var notesLayer = new leafletOsmNotes();
notesLayer.addTo(map);

var sel_marker = L.marker([0, 0], {
    draggable: true,
    icon: mapboxIcon({ 'marker-color': '#2d54a6' })
}).addTo(map);

d3.select('.geolocate').on('click', function() {
    $('.hint.geolocate').remove();
});

d3.select('.accept').on('click', function(e) {
    e.preventDefault();
    chosen(sel_marker.getLatLng());
});

d3.select('.menu').on('click', function(e) {
    d3.select('.about').toggleClass('hide');
});

d3.select('.save').on('click', function(e) {
    e.preventDefault();
    save(sel_marker.getLatLng(), $('#note-comment').val());
});

function chosen(position) {
    window.scrollTo(0, 502);
    $('#note-comment').focus();
    return false;
}

function save(ll, comment) {
    var h = new window.XMLHttpRequest();
    h.open('POST', 'http://api.openstreetmap.org/api/0.6/notes.json', true);
    h.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    h.send('lat=' + ll.lat + '&lon=' + ll.lng + '&text=' + encodeURIComponent(comment));
    h.onload = function(resp) {
        var j = JSON.parse(h.responseText);
        window.scrollTo(0, 0);
        $('#note-comment').val('');
        $('.osm-link')
            .attr('href', 'http://www.openstreetmap.org/?note=' + j.properties.id)
            .removeClass('hide');
        window.setTimeout(function() {
            $('.osm-link').addClass('hide');
        }, 5000);
    };
}

function mapboxIcon(fp) {
    var API = 'http://api.openstreetmap.org/api/0.6/notes.json';
    fp = fp || {};

    var sizes = {
            small: [20, 50],
            medium: [30, 70],
            large: [35, 90]
        },
        size = fp['marker-size'] || 'medium',
        symbol = (fp['marker-symbol']) ? '-' + fp['marker-symbol'] : '',
        color = (fp['marker-color'] || '7e7e7e').replace('#', '');

    return L.icon({
        iconUrl: 'http://a.tiles.mapbox.com/v3/marker/' +
            'pin-' + size.charAt(0) + symbol + '+' + color +
            // detect and use retina markers, which are x2 resolution
            ((L.Browser.retina) ? '@2x' : '') + '.png',
        iconSize: sizes[size],
        iconAnchor: [sizes[size][0] / 2, sizes[size][1] / 2],
        popupAnchor: [0, -sizes[size][1] / 2]
    });
};
