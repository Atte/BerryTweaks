BerryTweaks.modules['sync'] = (function(){
"use strict";

var self = {
	'css': false,
	'libs': ['crypto'],
	'post': function(data, callback){
		var nick = localStorage.getItem('nick');
		var pass = localStorage.getItem('pass');
		if ( !nick || !pass )
			return;

		data['id'] = BerryTweaks.lib.crypto.sha1(nick+'|'+pass);

		$.post('https://atte.fi/berrytweaks/api/sync.php', data, callback, 'json');
	},
	'sync': function(){
		if ( !self.enabled )
			return;

		var settings = BerryTweaks.loadSettings();
		var browser = {
			'version': settings.sync && settings.sync.version || 0,
			'data': {
				'squee': localStorage.getItem('highlightList'),
				'PEP': localStorage.getItem('PEP')
				//'blacklist': localStorage.getItem('cades.videoblacklist')
			}
		};

		self.post({
			'action': 'sync',
			'payload': JSON.stringify(browser)
		}, function(server){
			var settings = BerryTweaks.loadSettings();
			if ( !settings.sync )
				settings.sync = {};
			settings.sync.version = server.version;
			BerryTweaks.saveSettings(settings);

			if ( server.data.squee ){
				localStorage.setItem('highlightList', server.data.squee);

				if ( server.data.squee.length > 0 )
					HIGHLIGHT_LIST = server.data.squee.split(';');
			}

			if ( server.data.PEP ){
				localStorage.setItem('PEP', server.data.PEP);

				if ( window.PEP ){
					PEP.alarms = PEP.getStorage();
					PEP.restarPlaylist();
				}
			}

			//if ( server.data.blacklist ){
			//	localStorage.setItem('cades.videoblacklist', server.data.blacklist);
			//}
		});
	},
	'delete': function(){
		$('#berrytweaks-module-toggle-sync').prop('checked', false);

		self.post({
			'action': 'delete'
		}, function(data){
			if ( !data.found ){
				BerryTweaks.dialog('No data found on server! Have you already deleted it?');
				return;
			}

			if ( data.deleted )
				BerryTweaks.dialog('Data found and deleted successfully');
			else
				BerryTweaks.dialog('Data found, but deletion failed! Please contact Atte');
		})
	},
	'enable': function(){
		self.sync();
	},
	'disable': function(){
		
	},
	'addSettings': function(container){
		$('<a>', {
			'href': 'javascript:void(0)',
			'click': self['delete'],
			'text': 'Delete synced data from server'
		}).appendTo(container);
	}
};

BerryTweaks.patch(window, 'showCustomSqueesWindow', function(){
	if ( !self.enabled )
		return;

	$('.controlWindow > div > .button:nth-child(2)').click(function(){
		self.sync();
	});
});

whenExists('#manageAlarms', function(){
	BerryTweaks.patch(PEP, 'setStorage', function(){
		self.sync();
	})
});

return self;

})();
