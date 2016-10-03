define([
	'jquery',

	'templayed'
], function ($) {

	var Sounds;

	var context,
		globalVolume;

	return {
		init: function () {
			Sounds = this;

			Sounds._initMarkup();

			Sounds._initSoundFramework();

			Sounds._initEvents();
		},

		_initMarkup: function () {
			var $soundTemplate = $('#sound-template'),
				soundData, html;

			var request = new XMLHttpRequest();
			request.open('GET', '/content/data/sounds.json', true);
			request.responseType = 'json';

			request.onload = function () {
				var html = templayed($soundTemplate.html())(request.response);

				$('.js-sounds').html(html);
				Sounds._initSounds();
			};
			request.send();
		},

		_initSoundFramework: function () {
			context = new (window.AudioContext || window.webkitAudioContext)();
			globalVolume = context.createGain();

			globalVolume.connect(context.destination);
		},

		_initSounds: function () {
			var $sounds = $('.js-sound'),
				$soundsWrapper = $('.js-sounds');

			soundsToLoad = $sounds.length;
			$sounds.each(Sounds._initSound);
		},

		_initSound: function () {
			var $sound = $(this).closest('.js-sound'),
				$audio = $sound.find('.js-sound-audio'),

				soundSource = context.createMediaElementSource($audio[0]),
				volume = context.createGain(),

				audioObj = {};

			$sound.data('audio', audioObj);

			audioObj.source = soundSource;
			soundSource.mediaElement.loop = $sound.data('sound-loop');

			audioObj.volume = volume;
			soundSource.connect(volume);
			audioObj.output = volume;

			audioObj.output.connect(globalVolume);
		},

		_initEvents: function () {
			$(document).on('click', '.js-sound-toggle', Sounds._toggleSound);
			$(document).on('click', '.js-sound-loop', Sounds._toggleLoop);
			$(document).on('change', '.js-sound-volume', Sounds._changeVolume);
			$(document).on('change', '.js-sound-reverb', Sounds._changeReverb);
			$(document).on('click', '.js-global-mute', Sounds._toggleGlobalMute);
		},

		_toggleSound: function (e) {
			var $sound = $(e.target).closest('.js-sound'),
				audioData = $sound.data('audio'),
				soundSource = audioData.source.mediaElement;

			if (soundSource.paused) {
				$sound.find('.js-sound-toggle').addClass('is-playing');
				soundSource.play();
			} else {
				$sound.find('.js-sound-toggle').removeClass('is-playing');
				soundSource.pause();
			}
		},

		_toggleLoop: function (e) {
			var $sound = $(e.target).closest('.js-sound'),
				audioData = $sound.data('audio'),
				soundSource = audioData.source.mediaElement;

			if ($sound.attr('data-sound-loop')) {
				$sound.removeAttr('data-sound-loop');
				soundSource.loop = false;
			} else {
				$sound.attr('data-sound-loop', true);
				soundSource.loop = true;
			}
		},

		_changeReverb: function (e) {
			var $sound = $(e.target).closest('.js-sound'),
				audioData = $('.js-sound').first().data('audio'),

				$reverb = $sound.find('.js-sound-reverb'),
				reverbSrc = $reverb.val();

			if (audioData.reverb) {
				audioData.source.disconnect(audioData.reverb);
				audioData.reverb.disconnect(globalVolume);
				audioData.reverb = undefined;
			}

			if (reverbSrc) {
				audioData.reverb = context.createConvolver();

				audioData.source.connect(audioData.reverb);
				audioData.reverb.connect(globalVolume);

				var request = new XMLHttpRequest();
				request.open('GET', reverbSrc, true);
				request.responseType = 'arraybuffer';

				request.onload = function () {
					context.decodeAudioData(request.response, function (buffer) {
						audioData.reverb.buffer = buffer;
					});
				};
				request.send();
			}
		},

		_changeVolume: function (e) {
			var $sound = $(e.target).closest('.js-sound'),
				$volume = $sound.find('.js-sound-volume'),

				audioData = $sound.data('audio');

			audioData.volume.gain.value = $volume.val();
		},

		_toggleGlobalMute: function (e) {
			$globalMute = $('.js-global-mute');

			if (globalVolume.gain.value) {
				globalVolume.gain.value = 0;
				$globalMute.addClass('is-active');
			} else {
				globalVolume.gain.value = 1;
				$globalMute.removeClass('is-active');
			}
		}
	};

});