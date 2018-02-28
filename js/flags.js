BerryTweaks.modules['flags'] = (function(){
'use strict';

const self = {
    css: true,
    libs: ['user'],
    todo: [],
    flushTodo() {
        BerryTweaks.lib.user.getTimes(self.todo, (nick, timedata) => {
            const el = $('#chatlist > ul > li.' + nick);
            if ( timedata.countryCode && !$('.berrytweaks-flag', el).length ){
                $('<div>', {
                    class: 'berrytweaks-flag',
                    css: {
                        'background-image': `url("https://cdn.atte.fi/famfamfam/flags/1/${timedata.countryCode.toLowerCase()}.png")`
                    }
                }).appendTo(el);
            }
        });
        self.todo = [];
    },
    handleUser(nick) {
        if ( !nick )
            return;

        self.todo.push(nick);
        if ( !self.todoFlusher ){
            self.todoFlusher = BerryTweaks.setTimeout(() => {
                self.todoFlusher = null;
                self.flushTodo();
            }, 1000);
        }
    },
    enable() {
        BerryTweaks.whenExists('#chatlist > ul > li', users => {
            users.each(function() {
                self.handleUser($(this).data('nick'));
            });
        });
    },
    disable() {
        $('#chatlist > ul > li .berrytweaks-flag').remove();
    },
    bind: {
        patchAfter: {
            addUser(data) {
                self.handleUser(data && data.nick);
            }
        }
    }
};

return self;

})();
