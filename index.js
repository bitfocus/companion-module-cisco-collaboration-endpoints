const { options } = require('marked');
var instance_skel = require('../../instance_skel');
var xmlbuilder = require('xmlbuilder')
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;

	self.status(self.STATE_OK);
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module allows you to control a Cisco VTC Unit (CE-based) with Companion.'
		},
		{
			type: 'textinput',
			id: 'ip',
			label: 'IP',
			width: 12,
			regex: self.REGEX_IP,
			default: '192.168.1.1',
			required: true
		},
		{
			type: 'textinput',
			id: 'user',
			label: 'Username',
			width: 12,
			default: 'admin',
			required: true
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 12,
			default: '',
			required: true
		},
		{
			type: 'dropdown',
			id: 'fwversion',
			label: 'Firmware Version',
			default: 9,
			required: true,
			choices: [
				{ id: 0, label: 'TE4'},
				{ id: 5, label: 'TC5'},
				{ id: 6, label: 'TC6'},
				{ id: 7, label: 'TC7'},
				{ id: 8, label: 'CE8'},
				{ id: 9, label: 'CE9'}
				]
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destroy");
}

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'dial': {
			label: 'Call/Dial Number',
			options: [
				{
				type: 'textinput',
				label: 'Dial String',
				id: 'number',
				width: 30,
				default: ''
				},
				{
				type: 'dropdown',
				label: 'Protocol',
				id: 'protocol',
				default: 'Sip',
				choices: [
					{ id: 'H320', label: 'H320' },
					{ id: 'H323', label: 'H323' },
					{ id: 'Sip', label: 'Sip' },
					{ id: 'Spark', label: 'Spark' }
					]
				}
			]
		},
		'call-disconnect': {
			label: 'Disconnect/Hang up'
		},
		'call-dtmfsend': {
			label: 'Send DTMF',
			options: [
				{
				type: 'textinput',
				label: 'DTMF String',
				id: 'dtmfstring',
				width: 30,
				default: ''
				}
			]
		},
		'audio-mic-mute': {
			label: 'Mute Microphone Audio'
		},
		'audio-mic-unmute': {
			label: 'Unmute Microphone Audio'
		},
		'audio-volume-increase': {
			label: 'Increase Speaker Volume'
		},
		'audio-volume-decrease': {
			label: 'Decrease Speaker Volume'
		},
		'audio-volume-mute': {
			label: 'Mute Speaker Volume'
		},
		'audio-volume-unmute': {
			label: 'Unmute Speaker Volume'
		},
		'audio-volume-set': {
			label: 'Set Speaker Volume',
			options: [
				{
				type: 'number',
				id: 'level',
				label: 'Volume Level',
				default: 50,
				min: 0,
				max: 100,
				width: 8
				}
			]
		},
		'camera-positionactivatefrompreset': {
			label: 'Go To Camera Preset',
			options: [
				{
				type: 'number',
				id: 'cameraid',
				label: 'Camera Id',
				default: 1,
				min: 1,
				max: 10,
				width: 8
				},
				{
				type: 'number',
				id: 'presetid',
				label: 'Preset Id',
				default: 1,
				min: 1,
				max: 100,
				width: 8
				}
			]
		},
		'standby-activate': {
			label: 'Start Standby'
		},
		'standby-deactivate': {
			label: 'Stop Standby / Wake'
		},
		'standby-resettimer': {
			label: 'Reset Standby Timer',
			options: [
				{
				type: 'number',
				id: 'delay',
				label: 'Minutes',
				default: 30,
				min: 1,
				max: 480,
				width: 8
				}
			]
		},
		'presentation-start': {
			label: 'Start Presentation'
		},
		'presentation-stop': {
			label: 'Stop Presentation'
		},
	});
}

instance.prototype.createCiscoCommand = function(path, propdict) {
	var commandXML = {}
	var thisPtr = commandXML;
	for (const p of path)
	{
		thisPtr[p] = {};
		thisPtr = thisPtr[p];
	}
	Object.assign(thisPtr,propdict);
	thisPtr['@command'] = 'True';
	var command = {Command: commandXML};
	var strCommand = xmlbuilder.create(command).end({ pretty: true});
	return(strCommand);
}

instance.prototype.action = function(action) {
	var self = this;

	if (self.config.ip) {
		var url = "http://" + self.config.ip + "/putxml"

		switch (action.action) {
			case 'dial':
				var command = self.createCiscoCommand(['Dial'],{ 
					Number : action.options.number,
					Protocol  : action.options.protocol
				});
				break;
			case 'call-disconnect':
				if (parseInt(self.config.fwversion) >= 8 || typeof(self.config.fwversion) === 'undefined') {
					var command = self.createCiscoCommand(['Call','Disconnect'],{});
				}
				else {
					var command = self.createCiscoCommand(['Call','DisconnectAll'],{});
				}
				break;
			case 'call-dtmfsend':
				var command = self.createCiscoCommand(['Call','DTMFSend'],{
					DTMFString : action.options.dtmfstring
				});
				break;
			case 'audio-mic-mute':
				var command = self.createCiscoCommand(['Audio','Microphones','Mute'],{});
				break;
			case 'audio-mic-unmute':
				var command = self.createCiscoCommand(['Audio','Microphones','Unmute'],{});
				break;
			case 'audio-volume-increase':
				var command = self.createCiscoCommand(['Audio','Volume','Increase'],{});
				break;
			case 'audio-volume-decrease':
				var command = self.createCiscoCommand(['Audio','Volume','Decrease'],{});
				break;
			case 'audio-volume-mute':
				var command = self.createCiscoCommand(['Audio','Volume','Mute'],{});
				break;
			case 'audio-volume-unmute':
				var command = self.createCiscoCommand(['Audio','Volume','UnMute'],{});
				break;
			case 'audio-volume-set':
				var command = self.createCiscoCommand(['Audio','Volume','Set'],{
					Level : action.options.level
				});
				break;
			case 'camera-positionactivatefrompreset':
				var command = self.createCiscoCommand(['Camera','PositionActivateFromPreset'],{
					CameraId : action.options.cameraid,
					PresetId : action.options.presetid
				});
				break;
			case 'standby-activate':
				var command = self.createCiscoCommand(['Standby','Activate'],{});
				break;
			case 'standby-deactivate':
				var command = self.createCiscoCommand(['Standby','Deactivate'],{});
				break;
			case 'standby-resettimer':
				var command = self.createCiscoCommand(['Standby','ResetTimer'],{
					Delay: action.options.delay
				});
				break;
			case 'presentation-start':
				var command = self.createCiscoCommand(['Presentation','Start'],{});
				break;
			case 'presentation-stop':
				var command = self.createCiscoCommand(['Presentation','Stop'],{});
				break;
		};

		var headers = {};
		headers["Content-Type"] = "text/xml";

		var options_auth = { user: self.config.user, password: self.config.password };

		self.system.emit('rest', url, command, function (err, result) {
			if (err !== null) {
				self.status(self.STATUS_ERROR, 'Cisco VTC Request Failed. Type: ' + action.action);
				self.log('error', 'Cisco VTC Request Failed. Type: ' + action.action);
			}
			else {
				self.status(self.STATUS_OK);
			}
		}, headers, options_auth);
	}	
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
