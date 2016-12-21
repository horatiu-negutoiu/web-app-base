require('./components/sampleComponent.js');

var siteConfig = {
  API_HOST: "<%= apiHost %>",
  TAB_SITE: "<%= tabSite %>",
  DOWNLOAD_PATH: "<%= downloadPath %>",
  APP_PATH: "<%= appPath %>",
  DOC_PATH: "<%= docPath %>"
};

console.log(appArguments);

var app = angular.module('plunker', []);

app.controller('MainCtrl', function($scope) {
  $scope.name = 'World';
});

// (function() {
//   console.log("this is commented function");
// })();
