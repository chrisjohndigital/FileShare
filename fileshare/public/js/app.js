var ModelItem = Backbone.Model.extend({
    defaults: {
		supportsFileAPI: false,
		fileAddress: null,
        fileMimeType: '',
        fileExtension: '',
		fileLoad: false,
        connectedUsers: 0,
        storedBlob: null,
        receivedBlobArray: new Array(),
		receivedBlob: null,
        receivedExtension: '',
        socket: null,
        fileSlice: 1024,
        socketAddress: 'http://localhost:8080'
    },
	initialize: function(){
		_.bindAll(this, 'featureSupport');
		this.featureSupport();
	},
	featureSupport: function(){
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			this.set ('supportsFileAPI', true);
		}
	}
});
var SocketView = Backbone.View.extend({
	model: null,
    socket: null,
   	initialize: function(){
  		_.bindAll(this, 'render', 'fileshare');
        this.model.bind('change:storedBlob', this.fileshare, this);
		this.render();
   	},
	render: function(){
		console.log ('loadFile');
		this.socket=io.connect(this.model.get('socketAddress'));
        var viewReference=this;
        this.socket.on('welcome', function (data) {
            console.log('Client welcome callback: ' + data);
            viewReference.model.set('connectedUsers', data.clients);
        });
        this.socket.on('fileshare', function (data) {
            console.log('Client fileshare callback');
            var receivedBlobArray = viewReference.model.get('receivedBlobArray');
            receivedBlobArray[receivedBlobArray.length] = data;
            viewReference.model.set ('receivedBlobArray', receivedBlobArray);
        });
        this.socket.on('fileshare-complete', function (data) {
            console.log('Client fileshare complete callback');
            viewReference.model.set ('receivedExtension', data);
            viewReference.model.set ('receivedBlob', viewReference.model.get('receivedBlobArray').join(''));
            viewReference.model.set('receivedBlobArray', new Array());
        });
	},
    fileshare: function(){
        var fileParts = 0;
        if ((((this.model.get('storedBlob')).length)/this.model.get('fileSlice')) % 1 > 0) {
            fileParts = Math.round((((this.model.get('storedBlob')).length)/this.model.get('fileSlice')))+1;
        } else {
            fileParts = (((this.model.get('storedBlob')).length)/this.model.get('fileSlice'));
        }
        console.log ('Client: emit fileshare, number of parts: ' + fileParts);
        for (var i = 0; i < fileParts; i++) {            
            this.socket.emit('fileshare', this.model.get('storedBlob').slice(i*this.model.get('fileSlice'), ((i*this.model.get('fileSlice'))+this.model.get('fileSlice'))));
        }
        this.socket.emit('fileshare-complete', this.model.get('fileExtension'));
    }
});
var FileLoaderView = Backbone.View.extend({
	model: null,
   	initialize: function(){
  		_.bindAll(this, 'loadFile');
		this.model.bind('change:fileLoad', this.loadFile, this);
   	},
	loadFile: function(){
		console.log ('loadFile');
        var viewReference = this;
        var percent = null;
		var reader = new FileReader();
		reader.onloadstart = (function(event) {
		  console.log ("onloadstart");
		});
		reader.onprogress = (function(event) {
            var percentLoaded = Math.round((event.loaded / event.total) * 100);
                console.log ("onprogress: " + percentLoaded);
			});
			reader.onabort = (function(event) {
				console.log ("onabort");
            });
			reader.onerror = (function(event) {
				console.log ("onerror");
			});
			reader.onload = (function(event) {
				console.log ("onload");
			});
			reader.onloadend = (function(event) {
				console.log ('onloadend: ' + event.target.readyState);
				if (event.target.readyState == FileReader.DONE) {
                    var file = event.target.result;
                    //console.log (file.type);
                    viewReference.model.set ('storedBlob', file);
				}
				reader = null;
            });
			//onloadend
        reader.readAsDataURL(this.model.get('fileAddress'));		
	}
});
var FileReceivedView = Backbone.View.extend({
	el: null,
	model: null,
   	initialize: function(){
  		_.bindAll(this, 'render', 'validateDOM');
        this.model.bind('change:receivedBlob', this.render, this);
   	},
	render: function(){
        console.log ('FileReceivedView');
        var file = this.model.get('receivedBlob');
        var filen = (String((String((new Date()).getTime())) + (String(Math.floor((Math.random() * 100000) + 1))))) + this.model.get('receivedExtension');
        console.log (filen);
        $(this.el).append('<p class="file"><a download="'+filen+'" href="'+file+'">Download file</a></p>');
	},
	validateDOM: function () {
		if ($(this.el).length >=1) {
			return true;
		} else {
			return false;
		}
	},
});
var HeaderView = Backbone.View.extend({
	el: null,
	model: null,
   	initialize: function(){
  		_.bindAll(this, 'render', 'validateDOM');
        this.model.bind('change:connectedUsers', this.render, this);
   	},
	render: function(){
        $(this.el).html('Connected users: ' + this.model.get('connectedUsers'));
	},
	validateDOM: function () {
		if ($(this.el).length >=1) {
			return true;
		} else {
			return false;
		}
	},
});
var ControllerItem = Backbone.View.extend({   
	el: null,
	events: function() {
        return _.extend({'dragover .file-drop': 'fileDragOver'},{'drop .file-drop': 'fileDragDrop'});
	},	
    initialize: function(){
    	_.bindAll(this, 'fileDragOver', 'fileDragDrop', 'processFile');
	},
	processFile: function(file) {
        console.log (file.type);
        this.model.set('fileMimeType', file.type);
        this.model.set('fileExtension', '.' + String(((file.name).split('.'))[((file.name).split('.')).length-1]));
		this.model.set('fileAddress', file);
		this.model.set('fileLoad', !this.model.get('fileLoad'));	
	},
	fileDragOver: function (event) {
		console.log ('fileDragOver');
		event.stopPropagation();
    	event.preventDefault();
		if (event.dataTransfer!=undefined) {
			//console.log (event.dataTransfer.files);
			event.dataTransfer.dropEffect = 'copy';
		} else if (event.originalEvent.dataTransfer!=undefined) {
			//console.log (event.originalEvent.dataTransfer.files);
			event.originalEvent.dataTransfer.dropEffect = 'copy';
		}
	},
	fileDragDrop: function (event) {
		console.log ('fileDragDrop');
		event.stopPropagation();
    	event.preventDefault();
        if (event.dataTransfer!=undefined) {
            console.log (event.dataTransfer.files);
			var files = event.dataTransfer.files;
        } else if (event.originalEvent.dataTransfer!=undefined) {
            console.log (event.originalEvent.dataTransfer.files);
			var files = event.originalEvent.dataTransfer.files;
        }
		if (files.length > 0) {
            var file = files[0];
			this.processFile(file);
        }
	}
});
$(document).ready(function() {
	(function($){
		var modelItem = new ModelItem();
		var socketView = new SocketView({
	  		model: modelItem
  		});
		var fileLoaderView = new FileLoaderView({
	  		model: modelItem,
  		});
        var fileReceivedView = new FileReceivedView({
	  		model: modelItem,
	  		el: $('.file-received')
  		});
        var headerView = new HeaderView({
	  		model: modelItem,
	  		el: $('h1')
  		});
		var controllerItem = new ControllerItem({
	  		model: modelItem,
	  		el: $('body')
  		});
	})(jQuery);
});
