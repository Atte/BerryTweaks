window.BerryTweaks = (function(){
'use strict';

const self = {
    'categories': [
        {
            'title': 'Chat view',
            'configs': ['convertUnits', 'smoothenWut', 'ircifyTitles', 'ircify']
        },
        {
            'title': 'User list',
            'configs': ['userMaps', 'showLocaltimes', 'globalFlairs', 'flags']
        },
        {
            'title': 'Video',
            'configs': ['autoshowVideo', 'videoTitle']
        },
        {
            'title': 'Other',
            'configs': ['requestCheck', 'sync', 'linkOpener', 'rawSquees', 'squeeSound']
        },
        {
            'title': 'Nitpicking',
            'configs': ['stripes', 'hideLoggedin', 'squeeVolume', 'resetFlair']
        },
        {
            'title': 'Always enabled',
            'configs': ['escClose', 'settingsFix', 'noReferrer'],
            'hidden': true
        }
    ],
    'configTitles': {
        'convertUnits': "Convert measurements",
        'smoothenWut': "Smoothen wutColors",
        'ircifyTitles': "Show video changes",
        'ircify': "Show joins/parts",

        'userMaps': "Show map in user dialog",
        'showLocaltimes': "Show users' local times",
        'globalFlairs': "Show flairs",
        'flags': "Show flags",

        'autoshowVideo': "Expand MalTweaks video during volatiles",
        'videoTitle': "Show video title in chat toolbar",

        'requestCheck': "Check requests for country restrictions",
        'sync': "Sync squees and PEP stars",
        'linkOpener': "Open links automatically",
        'rawSquees': "Unlimited squee editor",
        'squeeSound': "Custom squee sound",

        'stripes': "Stripe messages (requires theme support)",
        'hideLoggedin': 'Hide extra "Logged in as" label',
        'squeeVolume': "Customize notification volumes",
        'resetFlair': "Reset flair on page load",

        'escClose': "Close dialogs with esc",
        'settingsFix': "Make settings dialog scrollable",
        'noReferrer': "Circumvent hotlink protection on links"
    },
    'deprecatedModules': ['escClose', 'settingsFix', 'noReferrer', 'esc'],
    'modules': {},
    'lib': {},
    'libWaiters': {},
    'timeDiff': 0,
    'getServerTime': function(){
        return Date.now() + self.timeDiff;
    },
    'dialogDOM': null,
    'dialog': function(text){
        self.dialogDOM.text(text).dialog({
            'modal': true,
            'buttons': {
                'Ok': function(){
                    $(this).dialog('close');
                }
            }
        });
    },
    'confirm': function(text, callback){
        self.dialogDOM.text(text).dialog({
            'modal': true,
            'buttons': {
                'Ok': function(){
                    $(this).dialog('close');
                    callback(true);
                },
                'Cancel': function(){
                    $(this).dialog('close');
                    callback(false);
                }
            }
        });
    },
    'patch': function(container, name, callback, before){
        const original = container[name] || function(){/* noop */};

        if ( before ){
            container[name] = function(){
                if ( callback.apply(this, arguments) !== false )
                    return original.apply(this, arguments);
                return undefined;
            };
        }
        else{
            container[name] = function(){
                const retu = original.apply(this, arguments);
                callback.apply(this, arguments);
                return retu;
            };
        }
    },
    'loadCSS': function(name){
        $('<link>', {
            'data-berrytweaks_module': name,
            'rel': 'stylesheet',
            'href': /^https?:/.test(name) ? name : `https://atte.fi/berrytweaks/css/${name}.css`
        }).appendTo(document.head);
    },
    'unloadCSS': function(name){
        $(`link[data-berrytweaks_module=${name}]`).remove();
    },
    'loadSettings': function(){
        return $.extend(true, {
            'enabled': {}
        }, JSON.parse(localStorage['BerryTweaks'] || '{}'));
    },
    'saveSettings': function(settings){
        localStorage['BerryTweaks'] = JSON.stringify(settings);
        self.applySettings();
        self.updateSettingsGUI();
    },
    'getSetting': function(key, defaultValue){
        const val = self.loadSettings()[key];
        return val === undefined ? defaultValue : val;
    },
    'setSetting': function(key, val){
        const settings = self.loadSettings();
        settings[key] = val;
        self.saveSettings(settings);
    },
    'applySettings': function(){
        $.each(self.loadSettings().enabled, function(key, val){
            if ( val )
                self.enableModule(key);
            else
                self.disableModule(key);
        });
    },
    'loadLibs': function(names, callback){
        names = names.filter(function(name){
            return !self.lib[name];
        });

        let left = names.length;
        if ( left === 0 ){
            callback();
            return;
        }

        const after = function(){
            if ( --left == 0 )
                callback();
        };

        names.forEach(function(name){
            if ( !self.libWaiters[name] ){
                self.libWaiters[name] = [after];

                const isAbsolute = name.indexOf('://') !== -1;
                $.getScript(isAbsolute ? name : `https://atte.fi/berrytweaks/js/lib/${name}.js`, function(){
                    if ( isAbsolute )
                        self.lib[name] = true;

                    self.libWaiters[name].forEach(function(fn){
                        fn();
                    });
                    delete self.libWaiters[name];
                });
            }
            else
                self.libWaiters[name].push(after);
        });
    },
    'enableModule': function(name){
        if ( !self.configTitles.hasOwnProperty(name) || self.deprecatedModules.indexOf(name) !== -1 )
            return;

        const mod = self.modules[name];
        if ( mod ){
            if ( mod.enabled )
                return;

            if ( mod.css )
                self.loadCSS(name);

            mod.enabled = true;

            if ( mod.enable )
                mod.enable();

            if ( mod.addSettings )
                self.updateSettingsGUI();

            return;
        }

        $.getScript(`https://atte.fi/berrytweaks/js/${name}.js`, function(){
            const mod = self.modules[name];
            if ( !mod )
                return;

            if ( mod.libs ){
                self.loadLibs(mod.libs, function(){
                    self.enableModule(name);
                });
            }
            else
                self.enableModule(name);
        });
    },
    'disableModule': function(name){
        if ( !self.configTitles.hasOwnProperty(name) )
            return;

        const mod = self.modules[name];
        if ( mod ){
            if ( !mod.enabled )
                return;

            mod.enabled = false;

            if ( mod.disable )
                mod.disable();

            if ( mod.css )
                self.unloadCSS(name);
        }
    },
    'fixWindowHeight': function(win){
        if ( !win || win.data('berrytweaked') )
            return;

        const height = Math.min(
            win.height() + 20,
            $(window).height() - (win.offset().top - $(window).scrollTop()) - 20
        );

        win.css({
            'overflow-y': 'scroll',
            'max-height': height
        });

        win.data('berrytweaked', true);
    },
    'settingsContainer': null,
    'updateSettingsGUI': function(){
        if ( !self.settingsContainer )
            return;

        const win = self.settingsContainer.parents('.dialogContent');
        if ( !win )
            return;

        self.fixWindowHeight(win);

        const settings = self.loadSettings();
        const scroll = win.scrollTop();
        self.settingsContainer.empty();

        // title
        self.settingsContainer.append(
            $('<legend>', {
                'text': 'BerryTweaks'
            })
        );

        // basic toggles
        self.settingsContainer.append.apply(self.settingsContainer,
            self.categories.map(function(cat){
                if ( cat.hidden )
                    return null;
                return [$('<label>', {
                    'class': 'berrytweaks-module-category',
                    'text': cat.title
                })].concat(cat.configs.map(function(key){
                    const label = self.configTitles[key];
                    if ( !label )
                        return null;

                    return $('<div>', {
                        'class': 'berrytweaks-module-toggle-wrapper',
                        'data-key': key
                    }).append(
                        $('<label>', {
                            'for': 'berrytweaks-module-toggle-' + key,
                            'text': label + ': '
                        })
                    ).append(
                        $('<input>', {
                            'id': 'berrytweaks-module-toggle-' + key,
                            'type': 'checkbox',
                            'checked': !!settings.enabled[key]
                        }).change(function(){
                            const settings = self.loadSettings();
                            settings.enabled[key] = !!$(this).prop('checked');
                            self.saveSettings(settings);
                        })
                    );
                }));
            })
        );

        // mod specific
        $.each(self.modules, function(key, mod){
            if ( !mod.addSettings )
                return;

            mod.addSettings(
                $('<div>', {
                    'class': 'berrytweaks-module-settings',
                    'data-key': key
                }).insertAfter(
                    $(`.berrytweaks-module-toggle-wrapper[data-key=${key}]`, self.settingsContainer)
                )
            );
        });

        win.scrollTop(scroll);
    },
    'onEsc': function(e){
        if ( e.which !== 27 )
            return;

        // async in case the dialog is doing stuff on keydown
        setTimeout(function(){
            const wins = $(document.body).data('windows');
            if ( !wins || wins.length === 0 ){
                // MalTweaks header/motd/footer
                $('.floatinner:visible').last().next('.mtclose').click();
                return;
            }

            wins[wins.length-1].close();
        }, 0);
    },
    'noreferrer': function(_to){
        $('a[rel!="noopener noreferrer"]', _to).attr("rel", "noopener noreferrer");
    },
    'init': function(){
        self.dialogDOM = $('<div>', {
            'title': 'BerryTweaks',
            'class': 'berrytweaks-dialog'
        }).hide().appendTo(document.body);

        self.patch(window, 'showConfigMenu', function(){
            self.settingsContainer = $('<fieldset>');
            $('#settingsGui > ul').append(
                $('<li>').append(
                    self.settingsContainer
                )
            );

            self.updateSettingsGUI();
        });

        self.patch(window, 'showPluginWindow', function(){
            self.fixWindowHeight($('.pluginNode').parents('.dialogContent'));
        });

        self.patch(window, 'addChatMsg', function(data, _to){
            if ( data && data.msg && data.msg.timestamp )
                self.timeDiff = new Date(data.msg.timestamp) - new Date();
            self.noreferrer(_to);
        });

        whenExists('#chatbuffer', function(el){
            self.noreferrer(el);
        });

        $(document).on('keydown', self.onEsc);

        self.loadCSS('init');
        self.applySettings();
    }
};

return self;

})();

$(BerryTweaks.init);
