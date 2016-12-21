# Sample angular-gulp-bower build

## Installation

```
git clone git https://github.com/horatiu-negutoiu/gulp-bower-angular-1.git 
npm install 
gulp 
```

## Compile for development

Set the `ENVIRONMENT` variable in the `.env` file to `development` to build the development/testing version of the project. 

## Compile for production

Set the `ENVIRONMENT` variable in the `.env` file to `production` to build the production version of the project. 

## Current features 

- **Environment**
  - picks up variables from the `.env` file and stores them as environment variables
  - automatically sets the `process.env.NODE_ENV` variable
  - allows user to pass in special environment variables into the application's javascript file
  - cachebusting
- **Javascript**
  - compiles bower-installed javascript packages (like jQuery and Angular 1.5.9) into a `vendor.js` file
  - concatenates all application scripts
  - minifies application scripts after concatenation
  - generates source maps (controlled from .env)
- **CSS**
  - sass compiler
  - bootstrap sass compiler
  - generates source maps (controlled from .env)
- **FONTS**
  - imports font-awesome fonts
- **IMAGES**
  - compresses images through gulp-imagemin
- **HTML**
  - only `index.html` is copied over
  - compiles html templates in a javascript file

## Important Notes

If adding a bower package that contains javascript, follow the practice inside the `bower.json` file and add both the development and production version of the files. That way, the minified version will be loaded when compiling for production.
