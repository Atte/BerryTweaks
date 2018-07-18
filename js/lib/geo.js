BerryTweaks.lib['geo'] = (function(){
'use strict';

const makeCaching = function(loader){
    let cache = undefined;
    let waiters = null;
    return function(callback){
        if (cache !== undefined) {
            callback(cache);
            return;
        }

        if (waiters == null) {
            waiters = [callback];
        } else {
            waiters.push(callback);
            return;
        }

        loader(data => {
            cache = data;
            for (const waiter of waiters) {
                waiter(cache);
            }
            waiters = null;
        });
    };
};

const self = {
    loadNicks: makeCaching(callback => {
        BerryTweaks.ajax({
            url: 'https://atte.fi/berrytweaks/api/nicks.py',
            dataType: 'json',
            success: callback
        });
    }),
    loadMap: makeCaching(callback => {
        BerryTweaks.ajax({
            url: 'https://aws.atte.fi/btmap',
            dataType: 'json',
            headers: {
                'X-Api-Key': 'OHG90mF69n88PpkO8fQns94gmfBgKnpa78ojkSX6'
            },
            success: callback
        });
    }),
    getAliases(nick, callback) {
        self.loadNicks(nicks => {
            if (nicks.hasOwnProperty(nick)) {
                callback([nick].concat(nicks[nick]));
                return;
            }

            for (const key of Object.keys(nicks)) {
                if (nicks[key].includes(nick)) {
                    callback([key].concat(nicks[key]));
                    return;
                }
            }

            callback([nick]);
        });
    },
    getCoords(nick, callback) {
        self.loadMap(map => {
            self.getAliases(nick, nicks => {
                for (const nick of nicks) {
                    const data = map[nick.toLowerCase()];
                    if (data) {
                        callback(data);
                        return;
                    }
                }
                callback(null);
            });
        });
    },
    getCountry(coords, callback) {
        BerryTweaks.ajax({
            url: 'https://aws.atte.fi/geo2',
            data: {
                lat: coords.lat,
                lng: coords.lng
            },
            headers: {
                'X-Api-Key': 'OHG90mF69n88PpkO8fQns94gmfBgKnpa78ojkSX6'
            },
            dataType: 'json',
            success: callback
        });
    }
};

return self;

})();
