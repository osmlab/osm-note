var reqwest = require('reqwest'),
    moment = require('moment');

module.exports = window.L.LayerGroup.extend({

    API: 'http://api.openstreetmap.org/api/0.6/notes.json',

    _loadedIds: {},

    onAdd: function(map) {
        this._map = map;
        this._loadSuccess = L.bind(loadSuccess, this);
        this._pointToLayer = L.bind(pointToLayer, this);
        this.notesLayer = L.geoJson({
            type: 'FeatureCollection',
            features: []
        }, { pointToLayer: this._pointToLayer }).addTo(this);

        map
            .on('viewreset', this._load, this)
            .on('moveend', this._load, this);

        this._load();

        function pointToLayer(p) {
            return L.marker([
                p.geometry.coordinates[1],
                p.geometry.coordinates[0]
            ], {
                icon: this._icon(p.properties)
            }).bindPopup('<h1>' + p.properties.title + '</h1>' +
                '<div>' + p.properties.description + '</div>');
        }

        function loadSuccess(resp) {
            for (var i = 0; i < resp.features.length; i++) {
                if (!this._loadedIds[resp.features[i].properties.id]) {
                    resp.features[i].properties =
                        this._template(resp.features[i].properties);
                    this._loadedIds[resp.features[i].properties.id] = true;
                    this.notesLayer.addData(resp.features[i]);
                }
            }
        }
    },

    _icon: function(fp) {
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
    },

    _template: function(p) {
        p.title =
            '<a href="http://www.openstreetmap.org/browse/note/' + p.id + '">Note #' +
            p.id + '</a>';
        p.description = '';
        p['marker-color'] = { closed: '11f', open: 'f11' }[p.status];
        p['marker-symbol'] = { closed: 'circle-stroked', open: 'circle' }[p.status];

        for (var i = 0; i < p.comments.length; i++) {
            var user_link = p.comments[i].user ?
                ('<a target="_blank" href="' + p.comments[i].user_url + '">' +
                    p.comments[i].user + '</a>') : 'Anonymous';

            p.description +=
                '<div class="comment-meta">' +
                user_link + ' - ' +
                moment(p.comments[i].date).calendar() + ' ' +
                '</div> ' + '<div class="comment-text">' +
                p.comments[i].html + '</div>';
        }

        return p;
    },

    _load: function(map) {
        function boundsString(map) {
            var sw = map.getBounds().getSouthWest(),
                ne = map.getBounds().getNorthEast();
            return [sw.lng, sw.lat, ne.lng, ne.lat];
        }
        reqwest({
            url: this.API + '?bbox=' + boundsString(this._map),
            type: 'json',
            success: this._loadSuccess,
            error: function() { }
        });
    }
});
