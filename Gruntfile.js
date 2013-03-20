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
	  manifest: grunt.file.readJSON('src/manifest.json'),
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
	  }
	});
}

