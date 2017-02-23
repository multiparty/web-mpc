/**
 * This file is used to build Handsontable Pro from `src/*`
 *
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where Gruntfile.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 * To execute build followed by the test run, execute `grunt test`
 *
 * Result:
 * building Handsontable Pro will create files:
 *  - dist/handsontable.js
 *  - dist/handsontable.css
 *  - dist/handsontable.full.js
 *  - dist/handsontable.full.css
 *  - dist/handsontable.full.min.js
 *  - dist/handsontable.full.min.css
 */

var fs = require('fs');

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkg,

    meta: {
      handsontablePath: '',
      src: [
        'src/*.js',
        'src/editors/*.js',
        'src/plugins/**/!(*.spec).js',
        'src/renderers/*.js',
        'src/validators/*.js',
        'src/3rdparty/**/*.js',
      ]
    },

    jshint: {
      options: {
        jshintrc: true
      },
      handsontablePro: '<%= meta.src %>'
    },

    jscs: {
      handsontablePro: {
        files: {
          src: ['<%= meta.src %>']
        }
      },
      options: {
        config: '.jscsrc'
      }
    },

    jasmine: {
      options: {
        page: {
          viewportSize: {
            width: 1200,
            height: 1000
          }
        },
        outfile: 'test/SpecRunner.html',
        display: 'short',
        summary: true,
        keepRunner: true,
      },
      free: {
        src: [
          'dist/handsontable.min.js',
        ],
        options: {
          specs: [
            '<%= meta.handsontablePath %>/test/spec/**/*.spec.js',
            '<%= meta.handsontablePath %>/test/spec/!(mobile)*/*.spec.js',
            '<%= meta.handsontablePath %>/src/plugins/*/test/*.spec.js',
            '<%= meta.handsontablePath %>/test/spec/MemoryLeakTest.js',
          ],
          styles: [
            '<%= meta.handsontablePath %>/test/lib/normalize.css',
            'dist/pikaday/pikaday.css',
            'dist/handsontable.min.css',
          ],
          vendor: [
            '<%= meta.handsontablePath %>/test/lib/jquery.min.js',
            '<%= meta.handsontablePath %>/test/lib/jquery.simulate.js',
            'dist/hot-formula-parser/formula-parser.js',
            'dist/numbro/numbro.js',
            'dist/numbro/languages.js',
            'dist/moment/moment.js',
            'dist/pikaday/pikaday.js',
            'dist/zeroclipboard/ZeroClipboard.js',
            '<%= meta.handsontablePath %>/demo/js/backbone/lodash.underscore.js',
            '<%= meta.handsontablePath %>/demo/js/backbone/backbone.js',
          ],
          helpers: [
            '<%= meta.handsontablePath %>/test/SpecHelper.js',
          ],
        }
      },
      proStandalone: {
        src: [
          'dist/handsontable.js',
        ],
        options: {
          specs: [
            'test/**/*.spec.js',
            'src/plugins/*/test/**/*.spec.js',
            'src/3rdparty/walkontable/test/jasmine/spec/**/*.spec.js'
          ],
          styles: [
            '<%= meta.handsontablePath %>/test/lib/normalize.css',
            'dist/pikaday/pikaday.css',
            'dist/handsontable.css',
          ],
          vendor: [
            '<%= meta.handsontablePath %>/test/lib/jquery.min.js',
            '<%= meta.handsontablePath %>/test/lib/jquery.simulate.js',
            'dist/hot-formula-parser/formula-parser.js',
            'dist/numbro/numbro.js',
            'dist/numbro/languages.js',
            'dist/moment/moment.js',
            'dist/pikaday/pikaday.js',
            'dist/zeroclipboard/ZeroClipboard.js',
          ],
          helpers: [
            '<%= meta.handsontablePath %>/test/SpecHelper.js',
            'src/plugins/*/test/helpers/*.js'
          ],
        }
      },
      proFull: {
        src: [
          'dist/handsontable.full.min.js',
          'dist/numbro/languages.js',
        ],
        options: {
          specs: [
            'test/**/*.spec.js',
            'src/plugins/*/test/**/*.spec.js',
            'src/3rdparty/walkontable/test/jasmine/spec/**/*.spec.js'
          ],
          styles: [
            '<%= meta.handsontablePath %>/test/lib/normalize.css',
            'dist/pikaday/pikaday.css',
            'dist/handsontable.full.min.css',
          ],
          vendor: [
            '<%= meta.handsontablePath %>/test/lib/jquery.min.js',
            '<%= meta.handsontablePath %>/test/lib/jquery.simulate.js',
            'dist/moment/moment.js',
          ],
          helpers: [
            '<%= meta.handsontablePath %>/test/SpecHelper.js',
            'src/plugins/*/test/helpers/*.js'
          ],
        }
      }
    },

    hotBuilder: {
      handsontablePro: {
        files: {
          'dist': 'package.json'
        }
      },
      handsontableProDev: {
        files: {
          'dist': 'package.json'
        },
        options: {
          devMode: true
        }
      },
      handsontableProCustom: {
        files: {
          dist: 'package.json'
        },
        options: {
          disableUI: false
        }
      },
      options: {
        minify: true,
        hotBranch: pkg.compatibleHotVersion
      }
    },
  });

  // Default task.
  grunt.registerTask('default', ['jscs', 'jshint', 'build']);
  grunt.registerTask('build', ['hotBuilder:handsontablePro']);
  grunt.registerTask('build-dev', ['hotBuilder:handsontableProDev']);
  grunt.registerTask('build-custom', ['hotBuilder:handsontableProCustom']);
  grunt.registerTask('test-free', ['_prepareHandsontablePath', 'jasmine:free']);
  grunt.registerTask('test-pro', ['_prepareHandsontablePath', 'jasmine:proStandalone']);
  grunt.registerTask('test-pro-full', ['_prepareHandsontablePath', 'jasmine:proFull']);
  grunt.registerTask('test', ['default', '_prepareHandsontablePath', 'jasmine:free', 'jasmine:proStandalone', 'jasmine:proFull']);

  grunt.registerTask('_prepareHandsontablePath', '', function() {
    // handsontable path for npm 2.*
    var nodeHandsontablePath = 'node_modules/hot-builder/node_modules/handsontable/';

    try {
      fs.statSync(nodeHandsontablePath);
    } catch(ex) {
      // handsontable path for npm >=3.10.*
      nodeHandsontablePath = 'node_modules/handsontable/';
    }
    grunt.log.ok('Using Handsontable from \033[32m' + nodeHandsontablePath + '\033[0m');
    grunt.config.set('meta.handsontablePath', nodeHandsontablePath);
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('hot-builder');
};
