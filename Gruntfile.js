'use strict';

const jsBanner = `/*!
 * Font Awesome Icon Picker
 * https://github.com/DikaArdnt/fontawesome-iconpicker
 * Copyright (c) 2026 DikaArdnt
 * @license MIT
 */\n`;

module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            dist: {
                options: { compress: false },
                files: {
                    'dist/css/fontawesome-iconpicker.css': ['src/less/iconpicker.less']
                }
            },
            distMin: {
                options: { compress: true },
                files: {
                    'dist/css/fontawesome-iconpicker.min.css': ['src/less/iconpicker.less']
                }
            }
        },
        uglify: {
            production: {
                options: {
                    compress: { passes: 2 },
                    mangle: true,
                    beautify: false,
                    comments: 'some',
                    banner: jsBanner
                },
                files: {
                    'dist/js/fontawesome-iconpicker.min.js': [
                        'src/js/position-lite.js',
                        'src/js/iconpicker.js'
                    ]
                }
            },
            productionReadable: {
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true,
                    comments: 'some',
                    banner: jsBanner
                },
                files: {
                    'dist/js/fontawesome-iconpicker.js': [
                        'src/js/position-lite.js',
                        'src/js/iconpicker.js'
                    ]
                }
            },
            compat: {
                options: {
                    compress: { passes: 2 },
                    mangle: true,
                    beautify: false,
                    comments: 'some',
                    banner: jsBanner
                },
                files: {
                    'dist/js/fontawesome-iconpicker.compat.min.js': [
                        'src/js/jquery.ui.pos.js',
                        'src/js/iconpicker.js'
                    ]
                }
            }
        },
        watch: {
            less: {
                files: ['src/less/*.less'],
                tasks: ['less']
            },
            js: {
                files: ['src/js/iconpicker.js', 'src/js/position-lite.js'],
                tasks: ['uglify:production', 'uglify:productionReadable']
            }
        },
        clean: {
            dist: ['dist/css', 'dist/js/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('default', ['clean:dist', 'less', 'uglify:production', 'uglify:productionReadable']);
    grunt.registerTask('compat', ['less', 'uglify:compat']);
    grunt.registerTask('dev', ['watch']);
};
