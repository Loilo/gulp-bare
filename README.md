# gulp-bare
`gulp-bare` is a simple scaffolding tool for small gulp projects.
It's capable of setting up a JavaScript, CSS and HTML precompiler for you through a Yeoman-like command line Q&A session.

It's probably not suited to build real apps but I use it regularly for fiddling around with code or for writing small JS libraries.

Just install -- I do recommend to install globally -- with `npm i -g gulp-bare` and run `gulp-bare` from the commandline in the directory you want to set your app up.

That's pretty mutch it.


## How to use?
After initially configuring your project with the steps above, `gulp-bare` exposes the following gulp tasks you can call conveniently just like `gulp [taskname]` from command line.

### build
Consists of the subtasks `build-styles`, `build-scripts`, `build-views` and `build-assets`. You can as well call those separately if you configured `gulp-bare` to use them. 

### watch
By analogy with the build tasks, this consists of `watch-styles`, `watch-scripts`, `watch-views` and `watch-assets`. Notice that the watch task won't run a complete `build` task in the beginning so it only really builds anything if any files do change.

To do both building and watching just run both, like `gulp build watch`.


## What are the capabilities?
You will be asked for several things to set up in the following order. Each of them is optional:

### Styles
You need a CSS precompiler? Go for it. It also includes `autoprefixer` in case you want to use it.

### Scripts
Same goes for JavaScript. Will also offer to use `browserify`.

### Views
In case you also want to use a view compiler like Jade or HAML.

### Assets
This isn't exactly a precompiler. It's just a copy-and-paste tool to bring everything from source to dist path that hasn't been done by the above compilers.

With that in mind, my usual mini project structure (not using compiled views in this case) looks like this:
```
my-app
/src
  /js
  /css
  index.html
/dst
  everything here is generated by gulp-bare
```

# The questions
Here's a full listing and (if necessary) explaination of the questions that `gulp-bare` is going to ask you and their initial default answers. If questions are indented their appearance relies on the answer to the preceding question.

Just some prequesites:

* All pathes and globs are relative to the directory `gulp-bare` runs from unless stated otherwise.
* (#boolean)Boolean answers accept the following case insensitive truthy / falsy values: "true", "yes", "yeah", "yeh", "ye", "yep", "yo", "yip", "y" / "false", "no", "nah", "nope", "n"

  Just because I like it. :)
* If the answer should be an "object" this means an object parseable by JavaScript's `JSON.parse()`


So, about the questions themselves:

1. **What's your source files' base directory?** (`src/`)
  
   The general source path of your project. Not used anywhere specifically but used to offer sensible defaults for future questions. In this listing the answer to this question will be referred to as `[src/]`.

1. **And the general output path?** (`dst/`)

   The path where your compiled files go. Just like above, this is not used anywhere specifically but used to offer sensible defaults for future questions. In this listing the answer to this question will be referred to as `[dst/]`.

1. **Do you want to use a styles precompiler?** (`yes`)

   Boolean answer

   1. **What's your style compiler module?** (`gulp-sass`)
  
      A gulp plugin that can be piped in to compile to CSS

   1. **You may provide some options for the compiler.** (`{}`)
  
      Object answer

   1. **The styles source directory?** (`[src/]sass/`)

      The path to your styles.
    
      *Default value varies depending on chosen precompiler.*

   1. **The files to keep track of there?** (`**/*.scss`)

      Files to watch -- may be a glob -- relative to your chosen styles source path.

      *Default value varies depending on chosen precompiler.*

   1. **The toplevel starting point(s) of your styles?** (`*.scss`)

      Files to use as starting points for your CSS output files. May be a glob. Relative to your chosen styles source path.
    
      *Default value varies depending on chosen precompiler.*

   1. **Autoprefixer browser compability (`last 2 versions`)

      Your desired compatibility. A [browserlist](https://github.com/ai/browserslist) compatible string.
    
      If you don't want to use Autoprefixer at all just pass in a [falsy](#boolean) value.

  1. **The according styles output directory?** (`[dst/]css/`)

     The path to your compiled CSS files.

1. **Do you want to use a scripts precompiler?** (`yes`)

   Boolean answer

   1. **What's your scripts compiler module?** (`gulp-babel`)
  
      A gulp plugin that can be piped in to compile to JavaScript

   1. **You may provide some options for the compiler.** (`{}`)
  
      Object answer

   1. **The scripts source directory?** (`[src/]es6/`)

      The path to your scripts.
    
      *Default value varies depending on chosen precompiler.*

   1. **The files to keep track of there?** (`**/*.js`)

      Files to watch -- may be a glob -- relative to your chosen scripts source path.

      *Default value varies depending on chosen precompiler.*

   1. **What's the according output directory?** (`[dst/]js/`)

      The path to your compiled JavaScript files.

   1. **Do you want to use [browserify](https://github.com/substack/node-browserify)?** (`no`)

       Boolean answer
    
       1. **Your browserify starting file(s)?** (`*.js`)

          Files to use as starting points for your browserify output files. May be a glob. Relative to your chosen scripts source path.
          
          *Default value varies depending on chosen precompiler.*
          
       1. **Your browserify options?** (`{}`)
       
          Options object you want to provide to the browserify function.
          
       1. **Use a browserify transform?** (`no`)
       
          An npm browserify transform module or a [falsy](#boolean) value if none.

          *Default value varies depending on chosen precompiler.*
          
          1. **Your browserify transform options?** (`{}`)
          
             Options object you want to provide to the browserify transform function.

       1. **Where do you want to store your modules?** (`[src/]scripts/modules/`)

          The path to your browserify modules. May not work with certain browserify transforms (e. g. [typify](https://www.npmjs.com/package/typeify)).

   1. **Should I add jQuery?** (`yes`)
 
      Adds a current copy of jQuery to your `[dst/js/]vendor/` directory.

      Boolean answer


1. **Do you want to use a views precompiler?** (`yes`)

   Boolean answer


   1. **What's your view compiler module?** (`gulp-handlebars`)
  
      A gulp plugin that can be piped in to compile to HTML

   1. **You may provide some options for the compiler.** (`{}`)
  
      Object answer

   1. **The views source directory?** (`[src/]views/`)

      The path to your views.
 
   1. **The files to keep track of there?** (`**/*.hbs`)

       Files to watch -- may be a glob -- relative to your chosen views source path.

       *Default value varies depending on chosen precompiler.*

    1. **The according views output directory?** (`[dst/]views/`)

       The path to your compiled HTML views.


1. **Do you want to automatically copy your assets?** (`yes`)

   Boolean answer

   1. **Tell me your assets source directory.** (`[src/]`)

      The path to everything that should be copied from. Probably the same as your `[src/]` directory.

   1. **Which files should be copied?** (`[".htaccess", { "ext": ["html", "php", "json", "yml", "js", "css", "png", "jpg", "svg", "ttf", "woff", "woff2", "eot"] }]`)
  
      A glob or an array that may contain
      * globs
      * objects with an `ext` property, containing a file extension or a list of file extensions. File extensions can be excluded by prepending a "!".
      * such arrays itself

    1. **And where should they go?** (`[dst/]`)

         The path everything should be copied to. Probably the same as your `[dst/]` directory.


## Change project settings
If you want to change your style / script / view / asset settings you can just run `gulp-bare` again. It will prefill your answers with your last choices.
Though it's probably faster to just edit the `config.json` that has been created in your app's root directory.

## Why no Yeoman?
I didn't make this a Yeoman generator as for almost everything one doesn't use a framework for -- it was intended to be way smaller than it came out and I didn't feeld to be in need of one.