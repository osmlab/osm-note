var map = L.map('map');
map.attributionControl.setPrefix('');
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var map_small = L.map('map-small', {
    draggable: false,
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

function geolocated(position) {
    d3.select('.pane-1').style('display', 'none');
    d3.select('.pane-2').style('display', 'block');

    map.setView([position.coords.latitude,
        position.coords.longitude], 10);

    var marker = L.marker([position.coords.latitude,
        position.coords.longitude], {
            draggable: true
        }).addTo(map);

    map.invalidateSize();

    d3.select('.accept-note').on('click', function() {
        chosen(marker.getLatLng());
    });
}

function chosen(position) {
    d3.select('.pane-2').style('display', 'none');
    d3.select('.pane-3').style('display', 'block');

    map_small.setView(position, 10);
    var marker = L.marker(position, { }).addTo(map_small);
    map_small.invalidateSize();
    d3.select('#note-comment').node().focus();
    d3.select('.save-note').on('click', function() {
        save(marker.getLatLng(), d3.select('#note-comment').property('value'));
    });
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
            .attr('href', 'http://www.openstreetmap.org/?note=' + j.properties.id);
    };
}
