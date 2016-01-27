# gulp-bare
`gulp-bare` is as simple scaffolding tool for small gulp projects.
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

## Change project settings
If you want to change your style / script / view / asset settings you can just run `gulp-bare` again. It will prefill your answers with your last choices.
Though it's probably faster to just edit the `config.json` that has been created in your app's root directory.

## Why no Yeoman?
I didn't make this a Yeoman generator as for almost everything one doesn't use a framework for -- it was intended to be way smaller than it came out and I didn't feeld to be in need of one.