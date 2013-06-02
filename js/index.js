var leafletOsmNotes = require('leaflet-osm-notes'),
    store = require('store'),
    osmAuth = require('osm-auth');

// Map Setup
// ----------------------------------------------------------------------------
var map = L.map('map', {
    attributionControl: false,
    zoomControl: false
}).setView([0, 0], 2);

map.on('locationfound', function(e) {
    map.fitBounds(e.bounds);
    sel_marker.setLatLng(e.latlng);
});

map.locate();

if (!map.touchZoom) L.Control.zoom().addTo(map);

if (window.devicePixelRatio > 1) {
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/tmcw.map-6s7ux6dj/{z}/{x}/{y}.png64', {
        subdomains: 'abcd',
        detectRetina: true
    }).addTo(map);
} else {
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/tmcw.map-7s15q36b/{z}/{x}/{y}.png64', {
        subdomains: 'abcd'
    }).addTo(map);
}

var sel_marker = L.marker([0, 0], {
    draggable: true,
    icon: mapboxIcon({ 'marker-color': '#2d54a6' })
}).addTo(map);

// Authentication
// ----------------------------------------------------------------------------
var auth = osmAuth({
    oauth_secret: 'ayvoniSvY6KaDMAsdBJBa99CZDLWRrMmuQxvNtuA',
    oauth_consumer_key: '963ilxYFlxJgmEV8471TnzL6yKiIukT0eO6bHwCU',
    singlepage: true,
    landing: 'land_single.html'
});

function login(e) {
    e.preventDefault();
    auth.logout();
    auth.authenticate(function() {
        showUser();
    });
}

function showUser() {
    if (!auth.authenticated()) return;
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, function(err, details) {
        if (err) return;
        $('.login')
            .text('logged in as ' + details.getElementsByTagName('user')[0].getAttribute('display_name'));
    });
}

$('.geolocate').on('click tap', function() {
    map.locate();
});

$('.login').on('click tap', login);

showUser();
updateList();

if (location.href.indexOf('oauth_token') !== -1) {
    var token = location.href.split('=')[1];
    auth.bootstrapToken(token, function() {
        showUser();
    });
}

// Saving Notes
// ----------------------------------------------------------------------------
$('.save').on('click tap', save);

function save(e) {
    e.preventDefault();

    var ll = sel_marker.getLatLng(),
        comment = $('#note-comment').val();

    if (!comment) return;

    var path = '/api/0.6/notes.json',
        API = 'http://api.openstreetmap.org/' + path,
        content = 'lat=' + ll.lat + '&lon=' +
            ll.lng + '&text=' + encodeURIComponent(comment);

    $('.save').addClass('saving');
    if (auth.authenticated()) {
        auth.xhr({
            method: 'POST',
            path: path,
            content: content
        }, success);
    } else {
        var h = new window.XMLHttpRequest();
        h.open('POST', API, true);
        h.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        h.send(content);
        h.onload = function(e) {
            success(null, h.responseText);
        };
    }

    function success(err, resp) {
        $('.save').removeClass('saving');
        if (err) return;
        store.set('savednotes', (store.get('savednotes') || [])
            .concat([JSON.parse(resp)]));
        updateList();
        $('#note-comment').val('');
        $('.save').addClass('saved');
        window.setTimeout(function() {
            $('.save').removeClass('saved');
        }, 1000);
    }
}

function updateList() {
    var container = $('ul#saved-notes').html('');
    var savedNotes = store.get('savednotes');
    if (savedNotes && savedNotes.length) {
        savedNotes.forEach(function(note) {
            $('<a></a>')
                .text(note.properties.comments[0].text)
                .attr('href', 'http://www.openstreetmap.org/browse/note/' + note.properties.id)
                .appendTo(container);
        });
    }
}

// Marker Icon Helper
// ----------------------------------------------------------------------------
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
}
