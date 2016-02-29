BerryTweaks.modules['backlog'] = (function(){
"use strict";

var self = {
	'backlog': [],
	'print': function(){
		$('#chatbuffer').empty();
		self.backlog.forEach(function(event){
			switch ( event.type ){
				case 'message':
					window.addChatMsg(event.data, '#chatbuffer');
					break;
				case 'connection':
					if ( BerryTweaks.modules.ircify )
						BerryTweaks.modules.ircify.act(event.data.nick, event.data.type, event.data.timestamp);
					break;
				case 'video':
					if ( BerryTweaks.modules.ircifyTitles )
						BerryTweaks.modules.ircifyTitles.onChange(event.data);
					break;
			}
		});
	},
	'load': function(){
		$.get('https://atte.fi/berrytweaks/api/backlog.py', function(resp){
			self.backlog = resp.events;
			self.print();
		});
	},
	'enable': function(){
		var waiting = 0;
		var checkWaiting = function(){
			if ( waiting == 0 )
				self.load();
		}
		var waitFor = function(container, property){
			if ( container[property] ){
				waiting -= 1;
				checkWaiting();
			}
			else{
				setTimeout(function(){
					waitFor(container, property);
				}, 100);
			}
		};

		var enabled = BerryTweaks.loadSettings().enabled;
		if ( enabled.ircify ){
			waiting += 1;
			waitFor(BerryTweaks.modules, 'ircify');
		}
		if ( enabled.ircifyTitles ){
			waiting += 1;
			waitFor(BerryTweaks.modules, 'ircifyTitles');
		}
		checkWaiting();
	},
	'disable': function(){
		
	}
};

return self;

})();
