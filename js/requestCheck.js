BerryTweaks.modules['requestCheck'] = (function(){
'use strict';

const self = {
    accepted: [],
    // callback({allowed:[], blocked:[]})
    getRestrictions(id, callback) {
        let handled = false;
        $.getJSON('https://www.googleapis.com/youtube/v3/videos', {
            key: BerryTweaks.gapi.key,
            part: 'contentDetails',
            id,
            success(data) {
                if (handled) {
                    return;
                }
                handled = true;

                const res = data && data.items && data.items[0] && data.items[0].contentDetails && data.items[0].contentDetails.regionRestriction || {};
                callback({
                    allowed: res.allowed || null,
                    blocked: res.blocked || []
                });
            },
            error() {
                if (handled) {
                    return;
                }
                handled = true;

                callback({
                    allowed: null,
                    blocked: []
                });
            }
        });
    },
    formatCountries(lst) {
        return lst.sort().join(', ');
    },
    handleRequest(msg) {
        let m = msg.match(/\bhttps?:\/\/(?:www\.)?youtube\.com\/watch.*[?&]v=([^?&\s]+)/);
        if ( !m )
            m = msg.match(/\bhttps?:\/\/youtu\.be\/([^?\s]+)/);
        if ( !m )
            return false;

        const id = m[1];
        if ( self.accepted.indexOf(id) !== -1 )
            return false;

        const tis = this;
        const args = arguments;

        self.getRestrictions(id, res => {
            if ( !res.allowed && res.blocked.length === 0 ){
                self.accepted.push(id);
                sendChatMsg.apply(tis, args);
                return;
            }

            let msg = 'The requested video is ';
            if ( res.allowed )
                msg += 'only viewable in: ' + self.formatCountries(res.allowed);
            else
                msg += 'not viewable in: ' + self.formatCountries(res.blocked);

            BerryTweaks.confirm(msg, ok => {
                if ( !ok )
                    return;

                self.accepted.push(id);
                sendChatMsg.apply(tis, args);
            });
        });
        return true;
    },
    bind: {
        patchBefore: {
            sendChatMsg(msg) {
                if ( /^\s*\/r/.test(msg) )
                    return !self.handleRequest.apply(this, arguments);
                return true;
            }
        }
    }
};

return self;

})();
