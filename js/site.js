var map = L.map('map');
map.attributionControl.setPrefix('');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var map_small = L.map('map-small', {
    dragging: false,
    attributionControl: false,
    zoomControl: false
});
map.attributionControl.setPrefix('');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map_small);

d3.select('.geolocate').on('click', function() {
    d3.select(this).classed('pulse', true);
    navigator.geolocation.getCurrentPosition(geolocated);
});

d3.select(window).on('load.addheight', addHeightClasses);
d3.select('#map-small').on('click.back', unchosen);

function addHeightClasses() {
    var style = document.createElement('style');
    style.type = 'text/css';
    var txt = '';
    var fourth = window.innerHeight / 4;
    for (var i = 1; i <= 4; i++) {
        txt += '.height' + i + '{height:' + (fourth * i) + 'px;}';
        txt += '.topmargin' + i + '{margin-top:' + (fourth * i) + 'px;}';
    }
    style.innerHTML = txt;
    document.getElementsByTagName('head')[0].appendChild(style);
}

d3.select('.accept-note').on('click', function() {
    chosen(sel_marker.getLatLng());
});
var sel_marker = L.marker([0, 0], { draggable: true }).addTo(map);

function geolocated(position) {
    d3.select('.pane-1').style('display', 'none');
    d3.select('.pane-2').style('display', 'block');

    var meters = position.coords.accuracy;

    var dLat = meters / 111200,
        dLng = meters / 111200 / Math.abs(Math.cos(position.coords.latitude));

    var bounds = new L.LatLngBounds(
        new L.LatLng(position.coords.latitude - dLat, position.coords.longitude - dLng),
        new L.LatLng(position.coords.latitude + dLat, position.coords.longitude + dLng));

    sel_marker.setLatLng([position.coords.latitude,
        position.coords.longitude]);
    map.invalidateSize();
}

var marker_small = L.marker([0,0], { }).addTo(map_small);

d3.select('.save-note').on('click', function() {
    save(marker_small.getLatLng(), d3.select('#note-comment').property('value'));
});

function unchosen() {
    d3.select('.pane-2').style('display', 'block');
    d3.select('.pane-3').style('display', 'none');
    map.invalidateSize();
}

function chosen(position) {
    d3.select('.pane-2').style('display', 'none');
    d3.select('.pane-3').style('display', 'block');

    map_small.setView(position, 10);
    marker_small.setLatLng(position);
    map_small.invalidateSize();

    d3.select('#note-comment').node().focus();
}

function save(ll, comment) {
    var h = new window.XMLHttpRequest();
    h.open('POST', 'http://api.openstreetmap.org/api/0.6/notes.json', true);
    h.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    h.send('lat=' + ll.lat + '&lon=' + ll.lng + '&text=' + encodeURIComponent(comment));
    h.onload = function(resp) {
        var j = JSON.parse(h.responseText);
        d3.select('.pane-3').style('display', 'none');
        d3.select('.pane-4').style('display', 'block');
        d3.select('.osm-link')
            .text('note #' + j.properties.id + ' on osm')
            .attr('href', 'http://www.openstreetmap.org/?note=' + j.properties.id);
    };
}
