var gulp = require('gulp');
var tsc = require('gulp-typescript');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge-stream');

/**
 * Configuration.
 */
var C = {};
C.srcBase = './src/';
C.testBase = './test/';
C.destBase = './build/';
C.config = {
  src: './config.json',
  dest: C.destBase
}
C.ts = {
  lib: {
    project: tsc.createProject(
      C.srcBase + 'ts/lib/tsconfig.json'
    ),
    dest: C.destBase + 'js',
    dtsDest: C.srcBase + 'ts/defs/'
  },
  editor: {
    src: C.srcBase + 'ts/editor/**/*.ts',
    project: 
      tsc.createProject(
        C.srcBase + 'ts/editor/tsconfig.json'),
    dest: C.destBase + 'js',
    dtsDest: C.srcBase + 'ts/defs/'
  },
  player: {
    src: C.srcBase + 'ts/player/**/*.ts',
    project: 
      tsc.createProject(
        C.srcBase + 'ts/player/tsconfig.json'),
    dest: C.destBase + 'js',
    dtsDest: C.srcBase + 'ts/defs/'
  },  
  pages: {
    project: tsc.createProject(
      C.srcBase + 'ts/pages/tsconfig.json'
    ),
    dest: C.destBase + 'js'
  },
  src: [
    C.srcBase + 'ts/**/*.ts',
    '!' + C.srcBase + 'ts/defs/**/*'
  ],
  tests: {
    project: tsc.createProject(
      C.testBase + 'tsconfig.json'
    ),
    watch: [
      C.testBase + '**/*.ts',
      C.srcBase + 'ts/{lib,editor,parcour}/**/*.ts'
    ],
    dest: C.testBase + 'js/'
  }
};
C.js = {
  src: C.srcBase + 'js/**/*.js',
  dest: C.destBase + 'js'
}
C.html = {
  src: C.srcBase + 'html/**/*.html',
  dest: C.destBase
}
C.css = {
  src: C.srcBase + 'css/**/*.css',
  dest: C.destBase + 'css'
}
C.dep = {};
C.dep.lodash = {
  src: 'bower_components/lodash/dist/*.{js,min}',
  dest: C.destBase + 'lib/js'
}
C.dep.jquery = {
  src: 'bower_components/jquery/dist/jquery.min.js',
  dest: C.destBase + 'lib/js'
};
C.dep.uuid = {
  src: 'bower_components/uuid/uuid.js',
  dest: C.destBase + 'lib/js'
};
C.dep.roboto = {
  src: 'bower_components/roboto-fontface/**/*',
  dest: C.destBase + 'fonts/roboto'
};
C.dep.fontAwesome = {
  src: [
    'bower_components/font-awesome/**/*.{css,map}',
    'bower_components/font-awesome/**/*.{eot,svg,ttf,woff,woff2,otf}'
  ],
  dest: C.destBase + 'lib/fa'
};
C.dep.three = {
  src: [
    'node_modules/three/build/*',
    'node_modules/three/examples/js/Detector.js',
    'node_modules/three/examples/js/controls/OrbitControls.js'
  ],
  dest: C.destBase + 'lib/js'
};
C.dep.ammoJs = {
  src: 'node_modules/ammo.js/ammo.js',
  dest: C.destBase + 'lib/js'
};
C.dep.stats = {
  src: 'node_modules/stats.js/build/*',
  dest: C.destBase + 'lib/js'
}
C.dep.datGui = {
  src: 'node_modules/dat.gui/build/*',
  dest: C.destBase + 'lib/js'
}
C.assets = {
  src: C.srcBase + 'assets/*.*',
  dest: C.destBase + 'assets'
};

/**
 * Tasks.
 */
gulp.task('default', ['build'], function() {
  console.log('Default task.');
});

gulp.task('config', function() {
  gulp.src(C.config.src).pipe(gulp.dest(C.config.dest));
});

gulp.task('ts-lib', function() {
  var tsResult = C.ts.lib.project.src()
    .pipe(sourcemaps.init())
    .pipe(C.ts.lib.project());
 
  var js = tsResult.js.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(C.ts.lib.dest));

  var dts = tsResult.dts.pipe(gulp.dest(C.ts.lib.dtsDest));
 
  return merge(js, dts);
});

gulp.task('ts-editor', ['ts-lib'], function() {

  var tsResult = C.ts.editor.project.src()
    .pipe(sourcemaps.init())
    .pipe(C.ts.editor.project());

  var js = tsResult.js.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(C.ts.editor.dest));

  var dts = tsResult.dts.pipe(gulp.dest(C.ts.editor.dtsDest));
 
  return merge(js, dts);
});

gulp.task('ts-player', ['ts-lib'], function() {

  var tsResult = C.ts.player.project.src()
    .pipe(sourcemaps.init())
    .pipe(C.ts.player.project());

  var js = tsResult.js.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(C.ts.player.dest));

  var dts = tsResult.dts.pipe(gulp.dest(C.ts.player.dtsDest));
 
  return merge(js, dts);
});

gulp.task('ts-pages', ['ts-lib', 'ts-editor', 'ts-player'], function() {
  return C.ts.pages.project.src()
    .pipe(sourcemaps.init())
    .pipe(C.ts.pages.project())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(C.ts.pages.dest));
});

gulp.task('ts-tests', ['ts-lib', 'ts-editor', 'ts-player'], function() {
  return C.ts.tests.project.src()
    .pipe(sourcemaps.init())
    .pipe(C.ts.tests.project())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(C.ts.tests.dest));
});

gulp.task('ts', ['ts-lib', 'ts-editor', 'ts-player', 'ts-pages', 'ts-tests']);

gulp.task('js', function() {
  return gulp.src(C.js.src).pipe(gulp.dest(C.js.dest));
});

gulp.task('html', function() {
  return gulp.src(C.html.src).pipe(gulp.dest(C.html.dest));
});

gulp.task('css', function() {
  return gulp.src(C.css.src).pipe(gulp.dest(C.css.dest));
});

// Dependencies
gulp.task('dep-lodash', function() {
  return gulp.src(C.dep.lodash.src).pipe(gulp.dest(C.dep.lodash.dest));
});

gulp.task('dep-jquery', function() {
  return gulp.src(C.dep.jquery.src).pipe(gulp.dest(C.dep.jquery.dest));
});

gulp.task('dep-uuid', function() {
  return gulp.src(C.dep.uuid.src).pipe(gulp.dest(C.dep.uuid.dest));
});

gulp.task('dep-roboto-fontface', function() {
  return gulp.src(C.dep.roboto.src).pipe(gulp.dest(C.dep.roboto.dest));
});

gulp.task('dep-font-awesome', function() {
  return gulp.src(C.dep.fontAwesome.src)
    .pipe(gulp.dest(C.dep.fontAwesome.dest));
});

gulp.task('dep-three', function() {
  return gulp.src(C.dep.three.src)
    .pipe(gulp.dest(C.dep.three.dest));
});

gulp.task('dep-ammo', function() {
  return gulp.src(C.dep.ammoJs.src)
    .pipe(gulp.dest(C.dep.ammoJs.dest));
});

gulp.task('dep-stats', function() {
  return gulp.src(C.dep.stats.src)
    .pipe(gulp.dest(C.dep.stats.dest));
});

gulp.task('dep-datgui', function() {
  return gulp.src(C.dep.datGui.src)
    .pipe(gulp.dest(C.dep.datGui.dest));
});


gulp.task('dep', [
  'dep-lodash', 'dep-jquery', 'dep-uuid', 'dep-roboto-fontface', 'dep-font-awesome',
  'dep-three', 'dep-ammo', 'dep-stats'
], function() {});

// Assets
gulp.task('assets', function() {
  return gulp.src(C.assets.src).pipe(gulp.dest(C.assets.dest));
});

gulp.task('build',
  ['config', 'ts', 'js', 'html', 'css', 'dep', 'assets'],
  function() {
    console.log('Everything was built.');
  }
);

// Watchers.
gulp.task('watch-config', ['config'], function() {
  gulp.watch(C.config.src, ['config']);
});

gulp.task('watch-ts', ['ts'], function() {
  // gulp.watch(C.ts.src, ['ts-lib', 'ts-editor', 'ts-pages', 'ts-player', 'ts-tests']);
  gulp.watch(C.ts.src, ['ts']);
});

gulp.task('watch-tests', ['ts-tests'], function() {
  gulp.watch(C.ts.tests.watch, ['ts-tests']);
});

gulp.task('watch-html', ['html'], function() {
  gulp.watch(C.html.src, ['html']);
});

gulp.task('watch-css', ['css'], function() {
  gulp.watch(C.css.src, ['css']);
});

gulp.task('watch', ['watch-config', 'watch-ts', /* 'watch-tests', */ 'watch-html', 'watch-css'], function() {
  console.log('Watching "config", "ts", "html" and "css".');
});
