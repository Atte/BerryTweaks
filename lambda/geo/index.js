const wc = require('which-country');
const iso = require('iso-3166-1');
const tzlookup = require('tz-lookup');
const moment = require('moment-timezone');

function lookupCountry(lat, lng) {
    const alpha3 = wc([lng, lat]);
    return alpha3 ? iso.whereAlpha3(alpha3) : { };
}

function lookupTimezone(lat, lng) {
    const now = moment().valueOf();
    const zone = moment.tz.zone(tzlookup(lat, lng));
    return {
        name: zone.name,
        abbr: zone.abbr(now),
        offset: -zone.utcOffset(now)
    };
}

exports.handler = async (event) => {
    const coords = event.httpMethod === 'POST' ? JSON.parse(event.body) : [event.queryStringParameters];

    const results = coords.map(coord => ({
        country: lookupCountry(coord.lat, coord.lng),
        tz: lookupTimezone(coord.lat, coord.lng)
    }));

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Max-Age': '600',
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=60'
        },
        body: JSON.stringify(event.httpMethod === 'POST' ? results : results[0])
    };
};