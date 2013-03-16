//Gruntfile.js
grunt.loadNpmTasks('grunt-crx');

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
