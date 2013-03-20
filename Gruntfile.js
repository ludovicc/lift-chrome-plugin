/*jshint debug:true, node:true */

//Gruntfile.js

module.exports = function(grunt) {
	
    // -- LOAD GRUNT PLUGINS -- //
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-crx');

    // --- HELPERS --- //
    var glg = grunt.log.write;
    glg('Starting');
    debugger;

    // --- CREATE CONFIGURATION --- //
    var config = {
       pkg: grunt.file.readJSON('package.json'),
       manifest: grunt.file.readJSON('extension/manifest.json')
    };

	grunt.initConfig({
		
      // specify an alternate install location for Bower
      bower: {
        dir: 'src/vendor'
      },
		
	  manifest: grunt.file.readJSON('src/manifest.json'),
	  
      jshint: {
		options: {
			jshintrc: '.jshintrc'
		},
        build : ['Gruntfile.js'],
		app: [
			'src/{,*/}*.js',
			'!src/vendor/*',
			'test/spec/{,*/}*.js'
		]
	  },
	  
	  crx: {
	    staging: {
	      "src": "src/",
	      "dest": "dist/staging/src",
	      "baseURL": "http://my.app.intranet/files/",
	      "filename": "<%= pkg.name %>-<%= manifest.version %>-dev.crx",
	      "exclude": [ ".git", ".svn", "*.pem" ],
	      "options": {
	        "maxBuffer": 3000 * 1024 //build extension with a weight up to 3MB
	      }
	    },
	    production: {
	      "src": "src/",
	      "dest": "dist/production/src",
	      "baseURL": "http://my.app.net/files/",
	      "exclude": [ ".git", ".svn", "dev/**", "*.pem" ],
	      "privateKey": "/.ssh/chrome-apps.pem",
	      "options": {
	        "maxBuffer": 3000 * 1024 //build extension with a weight up to 3MB
	      }
	    }
	  },
	  
      /** WATCH:
       *  provide a fast development watch and a slower full everything watch.
       */
      watch = {
		full : {
			files : ['Gruntfile.js', 'src/*.json',
					'src/*.js'],
			tasks : ['build']
	    }
	  }
	  
	});
}

