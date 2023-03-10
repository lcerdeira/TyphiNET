const { src, dest, task, watch, parallel, series } = require("gulp");

const sass = require('gulp-sass');
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const eslint = require("gulp-eslint");
const mocha = require("gulp-mocha");
const sync = require("browser-sync").create();
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');

function generateCSS(cb) {
    src("./sass/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('./'))
        .pipe(dest("public"))
        .pipe(sync.stream());
    cb();
}

function generateHTML(cb) {
    src("./views/*.ejs")
        .pipe(ejs({
            title: "TyphiNET",
        }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(dest("public"));
    cb();
}

function runLinter(cb) {
    return src(['**/*.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .on('end', function() {
            cb();
        });
}

function watchFiles(cb) {
    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch(['**/*.js', '!node_modules/**'], parallel(runLinter));
}

// function runTests(cb) {
//     return src(['**/*.test.js'])
//         .pipe(mocha())
//         .on('error', function() {
//             cb(new Error('Test failed'));
//         })
//         .on('end', function() {
//             cb();
//         });
// }

function browserSync(cb) {
    sync.init({
        server: {
            baseDir: "./public"
        }
    });

    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch("./public/**.html").on('change', sync.reload);
}

task('clean:public', function(resolve) {
    sync('public');
    resolve();
});



task('styles', () => {
    return src('sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('./css/'));
});

task('clean', () => {
    return del([
        'css/main.css',
    ]);
});

exports.css = generateCSS;
exports.html = generateHTML;
exports.lint = runLinter;
// exports.test = runTests;
exports.watch = watchFiles;
exports.sync = browserSync;

exports.default = series(runLinter, parallel(generateCSS, generateHTML));

// exports.default = series(runLinter, parallel(generateCSS, generateHTML), runTests);