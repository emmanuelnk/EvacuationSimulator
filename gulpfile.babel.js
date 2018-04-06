// gulpfile.babel.js
import gulp from 'gulp';
import nodemon from 'gulp-nodemon';
import browserify from 'browserify';
import fs from 'fs';
import watch from 'gulp-watch';

const nodemonOptions = {
    script: 'bin/www',
    ext: 'js',
    env: { 'NODE_ENV': 'development' },
    verbose: false,
    ignore: [],
    watch: ['bin/*', 'data/db.js','routes/*', 'app.js']
};

gulp.task('start', function () {
    nodemon(nodemonOptions)
        .on('restart', function () {
            console.log('restarted!')
        });
    gulp.start("build-js");
    gulp.start('watch');
});

gulp.task('build-js', () => {
    browserify('./public/js/app.js')
        .transform('babelify', {presets: ["es2015", "stage-2"]})
        .bundle()
        .pipe(fs.createWriteStream('./public/js/bundle.js'))
    ;
});

gulp.task("watch", function() {
    watch("./public/js/app.js", function() {
        gulp.start("build-js");
    });
});