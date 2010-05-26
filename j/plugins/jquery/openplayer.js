(function($) {

	$.fn.openPlayer = function(settings) {
		var config = {'foo': 'bar'};
		$.fn.openPlayer.config = config;
		var op = $.fn.openPlayer;
		if (settings) $.extend(config, settings);
		this.each(function() {
			$.fn.openPlayer.skin(this);
		});
		return this;
	}
	$.fn.openPlayer.skin = function(media){
		var tag = media.tagName.toLowerCase();
		//`console.log(tag);
		// Убрираем гадость
		media.controls = false;
		// Создаем обертки
		media.js = {};
		// Tag
		media.js.tag = tag;
		// Сохраняем пропорции
		media.js.width = $(media).width();
		media.js.height = $(media).height();
		
		var o_player = $('<div class="o-player o-player-'+media.js.tag+'"/>').width(media.js.width);
	
		var o_player_frame = $('<div class="o-player-frame"/>').appendTo(o_player);
		
		// Добавляем класс
		$(media).addClass('o-player-media o-player-media-horizontal');
		
		// Вставляем картинку, для браузеров без поддержки <media/>
		if($(media).attr('poster')) $('<img src="'+ $(media).attr('poster') +'"/>').width($(media).width()).appendTo(media);
		
	
		// Переводим их в проценты
		media.js.volume = 1;
		media.js.checkSeeker = false;
		media.js.seek = false;
		media.js.controls={};
		media.js.player = o_player_frame;
		// Оборачиваем
		$(media).wrap(o_player);
		
		// Spinner
		media.js.spinner = this.spinner(media);
		
		// Big Play
		media.js.bigplay = this.bigplay(media);
		
		// Контролы
		media.js.controls = this.controls(media);
		
		// Биндим события
		this.bind('load',this.updateMetaData, media);
		this.bind('timeupdate',this.updateTime, media);
		this.bind('progress',this.updateProgress, media);
		this.bind('durationchange',this.updateMetaData, media);
		this.bind('play',this.updatePlayPause, media);
		this.bind('pause',this.updatePlayPause, media);
		this.bind('volumechange',this.updateVolume, media);
		this.bind('error',this.updateError, media);
		this.bind('ended',this.reset, media);
	}
	$.fn.openPlayer.controls = function(media){
		// Controls
		var controls = $('<div class="o-player-controls"/>');
		// Play
		var play = $('<div class="o-player-button o-player-play" title="Запустить"/>').appendTo(controls);
		// Play/Pause
		play.toggle = function(){
			media.paused ? media.play() : media.pause();
			return false;
		};
		play.click(play.toggle);
		controls.play = play;
		
		// Seeker
		var seeker = $('<div class="o-player-gutter o-player-seeker-short"/>').appendTo(controls);
		controls.seeker = seeker;
		seeker.go=function(w){
			var play = !media.paused;
			if(play)  {
				media.pause();
				media.js.spinner.start();
			}
			
			var p = Math.round(100*w/$(this).width());
			var duration =  media.duration;
			if( duration === Infinity) duration = 1000;
			var time = (p*duration)/100;
			if(time > 0) {
				media.currentTime = time;
				if(play) media.play();
			}
		}
		seeker.click(function(e){
			if(e.target == remain[0] || e.target == current[0] ) return false; // Клики только по сикеру
				var w = (e.pageX-$(this).offset().left)-(knob.width()-5)/2;
				if(w > loader.width() && media.js.checkSeeker) { // Нельзя кликать туда, где не подгрузилось
					var w = loader.width();
				}
				seeker.go(w);
		});
		seeker.mousedown(function(e){
			if(e.button == 2) return true; // Right click
			if(e.target == remain[0] || e.target == current[0] ) return false; // Клики только по сикеру
				media.js.seek = true;
				$(controls).mousemove(function(e){
					var w = (e.pageX-loader.offset().left)-(knob.width()-5)/2;
					if(w > loader.width() && media.js.checkSeeker) { // Нельзя кликать туда, где не подгрузилось
						var w = loader.width();
					}
					if(w > seeker.width()) w = seeker.width();
					if(w < 0) w = 0;
				
					var p = Math.round(100*w/$(seeker).width());
					var duration =  media.duration;
					if( duration === Infinity) duration = 1000;
					var time = (p*duration)/100;
					var currentTime = $.fn.openPlayer.secondsToTime(time).join(':');
					seeker.current.html(currentTime);
					player.width(w);
					return false;
				});
				$(controls).bind('mouseleave',function(){
					seeker.go(player.width());
					media.js.seek = false;
					controls.unbind('mouseleave');
					controls.unbind('mousemove');
					return false;
				});
				return false;
		});
		controls.mouseleave = function(){
			controls.show();
			controls.unbind('mouseleave');
			$(media).unbind('mousemove');
			controls.unbind('mouseenter');
		};
		//controls.mouseleave();
		seeker.mouseup(function(e){
			if(e.target == remain[0] || e.target == current[0] ) return false; // Клики только по сикеру
				controls.unbind('mouseleave');
				controls.unbind('mousemove');
				media.js.seek = false;
				// Fix Opera 10.50
				seeker.go(player.width());
				return false;
		});
		// Current
		var current = $('<div class="o-player-label o-player-label-current" title="Прошло">00:00</div>').appendTo(seeker);
		controls.seeker.current = current;
		// Loader
		var loader = $('<div class="o-player-bar o-player-loader"/>').appendTo(seeker);
		controls.seeker.loader = loader;
		
		// Player
		var player = $('<div class="o-player-bar o-player-player"/>').appendTo(seeker);
		controls.seeker.player = player;
		
		// Knob
		var knob = $('<div class="o-player-button o-player-knob"/>').appendTo(player);
		controls.seeker.player.knob = knob;
	
		// Remain
		var remain = $('<div class="o-player-label o-player-label-remain" title="Осталось">00:00</div>').appendTo(seeker);
		controls.seeker.remain = remain;
		
		// Volume
		var volume = $('<div class="o-player-button o-player-volume o-player-volume-100" title="Отключить звук"/>').appendTo(controls);
		volume.click(function(){
			if(media.volume > 0) {
				media.js.volume = media.volume;
				media.volume = 0;
			} else{
				media.volume = media.js.volume;
			}
		});
		controls.volume = volume;
		
		// Gutter
		var gutter = $('<div class="o-player-gutter o-player-level"/>').appendTo(controls);
		controls.gutter = gutter;
		
		// Gutter Loader
		var gutter_loader = $('<div class="o-player-bar o-player-loader" style="width:100%"/>').appendTo(gutter);
		controls.gutter.loader = gutter_loader;
		
		// Gutter Knob
		var gutter_knob = $('<div class="o-player-button o-player-knob"/>').appendTo(gutter_loader);
		controls.gutter.loader.kob = gutter_knob;
		
		gutter.go=function(w){
			var p = Math.round(100*w/$(this).width());
			var volume = p/100;
			media.volume = volume;
		}
		gutter.click(function(e){
			var w = (e.pageX-gutter_loader.offset().left)-(gutter_knob.width()-5)/2;
			if(w > gutter.width()) w = gutter.width();
			if(w < 0) w = 0;
			gutter.go(w);
		});
		gutter.mousedown(function(e){
			if(e.button == 2) return true; // Right click
			$(controls).mousemove(function(e){
				var w = (e.pageX-gutter_loader.offset().left)-(gutter_knob.width()-5)/2;
				if(w > gutter.width()) w = gutter.width();
				if(w < 0) w = 0;
				gutter_loader.width(w);
				gutter.go(w);
				return false;
			});
			$(controls).bind('mouseleave',function(){
				gutter.go(gutter_loader.width());
				controls.unbind('mouseleave');
				controls.unbind('mousemove');
				return false;
			});
			return false;
		});
		gutter.mouseup(function(e){
			controls.unbind('mouseleave');
			controls.unbind('mousemove');
			return false;
		});
		// Full Screen
		var fullscreen = $('<div class="o-player-button o-player-screen o-player-screen-on" title="Во весь экран"/>').appendTo(controls);
		if(media.js.tag =='audio') fullscreen.hide();
		fullscreen.toggle = (function(e){
			var closefull = e.keyCode;
			if(media.webkitSupportsFullscreen && media.webkitSupportsFullscreen != undefined) {
				media.webkitEnterFullScreen();
				return;
			}
			if(!$(media).parents('div.o-player-video').hasClass('o-player-full') && closefull) {
				return;
			}
			if(($(media).parents('div.o-player-video').hasClass('o-player-full') || closefull)) {
				$(document.body).removeClass('o-player-body');
				$(this).toggleClass('o-player-screen-off').attr('title','Во весь экран');
				$(media).
					removeClass('o-player-media-vertical').
					parents('div.o-player-video').
						width(media.js.width).
						height(media.js.height).
						removeClass('o-player-full');
				$(window).unbind('resize');
				controls.mouseleave();
			} else{
				$(document.body).addClass('o-player-body');
				$(media).parents('div.o-player-video').addClass('o-player-full')
				$(this).toggleClass('o-player-screen-off').attr('title','Свернуть обратно');
				$.fn.openPlayer.resizeFrame(media);
				
				$(window).resize(function() {
					$.fn.openPlayer.resizeFrame(media);
				});
			}
		});
		$(media).dblclick(fullscreen.toggle);
		fullscreen.click(fullscreen.toggle);
		controls.fullscreen = fullscreen;
		
		// HotKeys "space = play/pause"
		$(media).parents('div.o-player-video').mouseenter(function(e){
			$(document).keydown(function (e) {
				switch(e.keyCode)
				{
				case 32:
					media.js.controls.play.toggle();
					return false;
					break;
				case 27:
					media.js.controls.fullscreen.toggle(e);
					return false;
					break;
				}
			});
		}).mouseleave(function(){
			$(window).unbind('keydown');
		});
		// Вcтавляем после media
		controls.insertAfter(media);
		return controls;
	}
	$.fn.openPlayer.spinner = function(media){
		var timer = {};
		var parent = this;
		var spinner = $('<div class="o-player-spinner">');
		// Вcтавляем после media
		spinner.insertAfter(media);
		
		// Анимация спиннера
		spinner.start = function(){
			if(media.js.tag =='audio') return;
			var i=0;
			var element = this;
			$(element).css('display','block');
			timer = setInterval(function(){
				var px = 0-(54*i);
				$(element).css('background-position','0 ' + px + 'px');
				if(i >= 7) i = 0;
				else i++;
			},70);
		}
		spinner.stop = function(){
			if(media.js.tag =='audio') return;
			var element = this;
			$(element).css('display','none');
			clearInterval(timer);
		}
		// Прячем
		spinner.css('display','none');
		return spinner;
	}
	$.fn.openPlayer.bigplay = function(media){
		var timer = {};
		var parent = this;
		var bigplay = $('<div class="o-player-button o-player-start" title="Запустить"/>');
		bigplay.click(function(){
			media.js.controls.play.toggle();
		});
		// Вcтавляем после media
		bigplay.insertAfter(media);
		
		return bigplay;
	}
	$.fn.openPlayer.bind = function(e,f,media) {
		media.addEventListener(e,f,false);
	}
	$.fn.openPlayer.updateMetaData = function (e){
		$.fn.openPlayer.updateTime(e);
		if(e.target.duration >= 3600) {
			e.target.js.controls.seeker.addClass('o-player-seeker-wide');
		}
	}
	$.fn.openPlayer.updateTime = function (e){
		if(e == undefined) return false;
		if(e.target.js.seek) return true;
		var currentTime = $.fn.openPlayer.secondsToTime(e.target.currentTime);
		var time_line = currentTime.join(':');
		e.target.js.controls.seeker.current.html(time_line);
		var duration =  e.target.duration;
		if( duration === Infinity) duration = 1000;
		var p = Math.round(100*e.target.currentTime/duration);
		e.target.js.controls.seeker.player.width(p+'%');
		
		var remainTime = $.fn.openPlayer.secondsToTime(duration-e.target.currentTime);
		var remain_line = remainTime.join(':');
		e.target.js.controls.seeker.remain.html(remain_line);
		
	}
	$.fn.openPlayer.updateProgress = function (e){
		if(e.total != undefined) {
			var p = Math.round(100*e.loaded/e.total);
			e.target.js.controls.seeker.loader.width(p+'%');
			e.target.js.checkSeeker = true;
		}
	}
	$.fn.openPlayer.updatePlayPause = function(e) {
		if(e.target.paused) {
			$(e.target.js.controls.play).toggleClass('o-player-pause').attr('title','Запустить');
		} else{
			$(e.target.js.bigplay).hide();
			e.target.js.spinner.stop();
			$(e.target.js.controls.play).toggleClass('o-player-pause').attr('title','Остановить');
		}
	}
	$.fn.openPlayer.updateVolume = function(e){
		var p = e.target.volume*100;
		if(!p) {
			$(e.target.js.controls.volume).addClass('o-player-volume-0').removeClass('o-player-volume-50').attr('title','Включить звук');
			$(e.target.js.controls.gutter.loader).width(0);
		} else if(p <= 50) {
			$(e.target.js.controls.volume).addClass('o-player-volume-50').removeClass('o-player-volume-0 o-player-volume-100').attr('title','Отключить звук');
			$(e.target.js.controls.gutter.loader).width((e.target.volume*100)+'%');
		} else if(p > 50){
			$(e.target.js.controls.volume).addClass('o-player-volume-100').removeClass('o-player-volume-50 o-player-volume-0').attr('title','Отключить звук');
			$(e.target.js.controls.gutter.loader).width((e.target.volume*100)+'%');
		}
	},
	$.fn.openPlayer.reset = function(e){
		e.target.currentTime = 0;
		e.target.pause();
		e.target.js.bigplay.show();
		$.fn.openPlayer.updateTime();
		e.target.js.controls.seeker.go(0);
	},
	$.fn.openPlayer.hideControls = function(media) {
        //console.log(media);
		var timer2;
		var timer = setTimeout(function(){
			media.js.controls.fadeOut("slow");
		},20*100);
		$(media).bind('mousemove',function(){
			if(timer2) clearTimeout(timer2);
			media.js.controls.fadeIn("slow");
			media.js.controls.bind('mouseleave',function(){
				timer2 = setTimeout(function(){
					media.js.controls.fadeOut("slow");
				},10*100);
			});
			media.js.controls.bind('mouseenter',function(){
				if(timer2) clearTimeout(timer2);
				if(timer) clearTimeout(timer);
			});
		});
	}
	$.fn.openPlayer.resizeFrame = function(media) {
	$.fn.openPlayer.hideControls(media);
		var window_width = $(window).width(),
			window_height = $(window).height(),
			media_width = $(media).width(),
			media_height = $(media).height();
		$(media).css('top',(window_height-media_height)/2);
		if( window_width >= media_width && window_height <= media_height ) {
			$(media).
				addClass('o-player-media-vertical').
				css({
					'top':0,
					'left':(window_width-media_width)/2
				});
		}
		if( window_height == media_height && window_width <= media_width ) {
			$(media).
				removeClass('o-player-media-vertical').
				css({
					'top':(window_height-media_height)/2,
					'left':0
				});
		}
	},
	$.fn.openPlayer.updateError = function (e) {
		//console.log(e);
	},
	$.fn.openPlayer.secondsToTime = function(secs)
	{
		var hours = Math.floor(secs / (60 * 60));
		var divisor_for_minutes = secs % (60 * 60);
		var minutes = Math.floor(divisor_for_minutes / 60);
		var divisor_for_seconds = divisor_for_minutes % 60;
		var seconds = Math.ceil(divisor_for_seconds);
		if(secs >= 3600) {
			 var arr = [
					hours > 9 ? parseInt(hours) : '0'+parseInt(hours),
					minutes > 9 ? parseInt(minutes) : '0'+parseInt(minutes),
					seconds > 9 ? parseInt(seconds) : '0'+parseInt(seconds)
			 ];
		} else{
			 var arr = [
					minutes > 9 ? parseInt(minutes) : '0'+parseInt(minutes),
					seconds > 9 ? parseInt(seconds) : '0'+parseInt(seconds)
			 ];
		}
 
		return arr;
	}
})(jQuery);
