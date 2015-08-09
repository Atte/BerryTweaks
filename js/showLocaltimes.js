BerryTweaks.modules['showLocaltimes'] = (function(){
"use strict";

var self = {
	'css': true,
	'libs': ['nick', 'map'],
	'clockUpdateInterval': null,
	'update': function(){
		var now = Date.now();
		$('#chatlist > ul > li').each(function(){
			var el = $(this);
			var offset = el.data('berrytweaks-localtime_offset');
			if ( offset == null )
				return;

			var time = new Date(now + offset);
			var mins = time.getUTCMinutes();
			$('.berrytweaks-localtime', el).text(time.getUTCHours() + ':' + (mins<10 ? '0'+mins : mins));
		});
	},
	'handleUser': function(nick){
		if ( !nick )
			return;

		var el = $('#chatlist > ul > li.' + nick);
		BerryTweaks.lib.map.getUserData(nick, function(userdata){
			if ( !userdata )
				return;

			$.getJSON('https://atte.fi/berrytweaks/api/time.php', {
				'lat': userdata.lat,
				'lng': userdata.lng
			}, function(timedata){
				var offset = timedata && timedata.gmtOffset;
				if ( offset == null )
					return;

				if ( !$('.berrytweaks-localtime', el).length ){
					$('<div>', {
						'class': 'berrytweaks-localtime'
					}).appendTo(el);
				}

				el.data('berrytweaks-localtime_offset', (+offset)*1000);

				self.update();
			});
		});
	},
	'enable': function(){
		$('#chatlist > ul > li').each(function(){
			self.handleUser($(this).data('nick'));
		});
		self.clockUpdateInterval = setInterval(self.update, 1000*60);
	},
	'disable': function(){
		if ( self.clockUpdateInterval ){
			clearInterval(self.clockUpdateInterval);
			self.clockUpdateInterval = null;
		}

		$('#chatlist > ul > li .berrytweaks-localtime').remove();
	}
};

BerryTweaks.patch(window, 'addUser', function(data){
	if ( !self.enabled )
		return;

	self.handleUser(data && data.nick);
});

return self;

})();
