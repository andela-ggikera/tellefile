angular.module('tellefile', [
  'ionic',
  'ionic-material','ionMdInput',
  'angularMoment',
  'ngImgCrop',
  'ngCordova', 
  'monospaced.elastic',
  'tellefile.controllers', 
  'tellefile.services',
  'tellefile.filters',
  'tellefile.directives',
  'tellefile.protocol',
  'tellefile.protocol.wrapper',
  'angular-cache'
  ])

.run(function($ionicPlatform, $state, $rootScope, Storage){
    
   $ionicPlatform.ready(function(){

    /*
    document.addEventListener("pause", function (event) {
          $rootScope.$broadcast('cordovaPauseEvent');
          Storage.set({ default : 'mainmenu.home'});
          console.log('run() -> cordovaPauseEvent');
      });

    document.addEventListener("resume", function(event){
      $rootScope.$broadcast('cordovaPauseEvent');
      console.log('run() -> cordovaResumeEvent');
      $state.go('mainmenu.home');
    }, false);
*/
    //var storageIsAvailable = window && window.sqlitePlugin.openDatabase({ name: "tellefile.db", androidDatabaseImplementation : 2 });
    //console.log(storageIsAvailable);

    //hide accessory bar by default
    if(window.cordova && cordova.plugins.Keyboard){
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar){
      //org.apache.cordova.statusBar required
      StatusBar.styleDefault();
    }
    
   });   
})


//manage states for the application
.config(['$stateProvider', '$urlRouterProvider','$compileProvider','$ionicConfigProvider',function($stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider){
  $stateProvider
    .state('begin',{
      url:"/begin",
      templateUrl:"app/begin/begin.html",
      controller: "BeginCtrl"
    })

    .state('verify',{
      url:"/verify",
      templateUrl:"app/verification/verification.html",
      controller: "VerificationCtrl"
    })


    .state('voice',{
      url:"/voice",
      templateUrl:"app/verification/voice.html"
    })
    .state('finish-verification',{
      url:"/finish-verification",
      templateUrl:"app/verification/finish-verification.html",
      controller: "FinishVerificationCtrl"
    })

    .state('create-profile',{
      url:"/create-profile",
      templateUrl:"app/create-profile/create-profile.html",
      controller: "UserProfileController"
    })

    .state('initialize',{
      url:"/initialize",
      templateUrl:"app/home/initialize.html",
      controller: 'InitializeCtrl'
    })

    .state('mainmenu',{
      abstract:true,
      url:"/mainmenu",
      templateUrl:"app/layout/main-menu.html",
      controller: 'HomeCtrl'
    })

    

    .state('mainmenu.home',{
      url:"/home",
      views: {
        'mainMenu':{
          templateUrl:"app/home/home.html",
          controller: 'HomeCtrl'
        }
      },
    })

    .state('mainmenu.default', {
      url:"/default",
      views: {
        'mainMenu':{
          templateUrl: "app/home/default.html",
          controller : 'DefaultCtrl'
        }
      }
    })

    .state('mainmenu.contacts',{
      url:"/contacts",
      views: {
        'mainMenu':{
          templateUrl:"app/contacts/contacts.html",
          controller:'ContactsCtrl'
        }
      },

    })

    .state('mainmenu.settings',{
      url:"/settings",
      views: {
        'mainMenu':{
          templateUrl:"app/settings/settings.html"
        }
      }
    })
    .state('mainmenu.user-messages', {

          url: '/user-messages/:contactID',
          views: {
            'mainMenu': {
                templateUrl: 'app/home/user-messages.html',
                controller: 'FilesCtrl'
            }
          }
      })

    .state('mainmenu.help',{
      url:"/help",
      views: {
        'mainMenu':{
          templateUrl:"app/help/help.html"
        }
      }
    })

    .state('mainmenu.myprofile',{
      url:"/myprofile",
      views: {
        'mainMenu':{
          templateUrl:"app/myprofile/myprofile.html",
          controller: 'ProfileCtrl'
        }
      }
    })

    .state('mainmenu.editprofile',{
      url:"/editprofile",
      views: {
        'mainMenu':{
          templateUrl:"app/myprofile/edit-profile.html"
        }
      }
    })

    .state('mainmenu.account',{
      url:"/accountsettings",
      views: {
        'mainMenu':{
          templateUrl:"app/account/account.html"
        }
      } 
    })

    .state('mainmenu.filesettings',{
      url:"/filesettings",
      views: {
        'mainMenu':{
          templateUrl:"app/filesettings/filesettings.html"
        }
      }
    })

    .state('mainmenu.notifications',{
      url:"/notificationsettings",
      views: {
        'mainMenu':{
          templateUrl:"app/notifications/notifications.html",
          controller: 'NotificationsCtrl'
        }
      }   
    })

    .state('mainmenu.sounds',{
      url:"/soundsettings",
      views: {
        'mainMenu':{
          templateUrl:"app/sounds/sounds.html"
        }
      }       
    })

    .state('mainmenu.contactsettings',{
      url:"/contactsettings",
      views: {
        'mainMenu':{
          templateUrl:"app/contact-settings/contact-settings.html",
          controller: 'ContactSettingsCtrl'
        }
      }
    })
    .state('mainmenu.privacy',{
      url:"/privacy",
      views: {
        'mainMenu':{
          templateUrl:"app/account/privacy.html"
        }
      }
    })
    .state('mainmenu.change',{
      url:"/change",
      views: {
        'mainMenu':{
          templateUrl:"app/account/change.html"
        }
      }
    })
    .state('mainmenu.delete',{
      url:"/delete",
      views: {
        'mainMenu':{
          templateUrl:"app/account/delete.html"
        }
      }
    })
    .state('mainmenu.network',{
      url:"/network",
      views: {
        'mainMenu':{
          templateUrl:"app/account/network.html"
        }
      }
    });
  
  // Turn off back button text
  //$ionicConfigProvider.backButton.previousTitleText(false);

  $urlRouterProvider.otherwise('/begin');
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|mailto|blob|filesystem|content|chrome-extension|app):|data:/);

}])




/*
.config(['$ionicAppProvider', function ($ionicAppProvider){
  //identify the app
  $ionicAppProvider.identify({
    app_id : 'eb5cc34c', //app id from the apps.ionic.io
    api_key: 'AIzaSyBucbVDbq9EqkTyybijTpBmCi6sX6-K3Yk', //public API key
    gcm_id : '206287376199' //GCM id from google developer console.
  });
}]); */


 //MONOSPACED ELASTIC
angular.module('monospaced.elastic', [])

  .constant('msdElasticConfig', {
    append: ''
  })

  .directive('msdElastic', [
    '$timeout', '$window', 'msdElasticConfig',
    function($timeout, $window, config) {
      'use strict';

      return {
        require: 'ngModel',
        restrict: 'A, C',
        link: function(scope, element, attrs, ngModel) {

          // cache a reference to the DOM element
          var ta = element[0],
              $ta = element;

          // ensure the element is a textarea, and browser is capable
          if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
            return;
          }

          // set these properties before measuring dimensions
          $ta.css({
            'overflow': 'hidden',
            'overflow-y': 'hidden',
            'word-wrap': 'break-word'
          });

          // force text reflow
          var text = ta.value;
          ta.value = '';
          ta.value = text;

          var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
              $win = angular.element($window),
              mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                                'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                                '-moz-box-sizing: content-box; box-sizing: content-box;' +
                                'min-height: 0 !important; height: 0 !important; padding: 0;' +
                                'word-wrap: break-word; border: 0;',
              $mirror = angular.element('<textarea tabindex="-1" ' +
                                        'style="' + mirrorInitStyle + '"/>').data('elastic', true),
              mirror = $mirror[0],
              taStyle = getComputedStyle(ta),
              resize = taStyle.getPropertyValue('resize'),
              borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
              boxOuter = !borderBox ? {width: 0, height: 0} : {
                            width:  parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                            height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                          },
              minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
              heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
              minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
              maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
              mirrored,
              active,
              copyStyle = ['font-family',
                           'font-size',
                           'font-weight',
                           'font-style',
                           'letter-spacing',
                           'line-height',
                           'text-transform',
                           'word-spacing',
                           'text-indent'];

          // exit if elastic already applied (or is the mirror element)
          if ($ta.data('elastic')) {
            return;
          }

          // Opera returns max-height of -1 if not set
          maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

          // append mirror to the DOM
          if (mirror.parentNode !== document.body) {
            angular.element(document.body).append(mirror);
          }

          // set resize and apply elastic
          $ta.css({
            'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
          }).data('elastic', true);

          /*
           * methods
           */

          function initMirror() {
            var mirrorStyle = mirrorInitStyle;

            mirrored = ta;
            // copy the essential styles from the textarea to the mirror
            taStyle = getComputedStyle(ta);
            angular.forEach(copyStyle, function(val) {
              mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
            });
            mirror.setAttribute('style', mirrorStyle);
          }

          function adjust() {
            var taHeight,
                taComputedStyleWidth,
                mirrorHeight,
                width,
                overflow;

            if (mirrored !== ta) {
              initMirror();
            }

            // active flag prevents actions in function from calling adjust again
            if (!active) {
              active = true;

              mirror.value = ta.value + append; // optional whitespace to improve animation
              mirror.style.overflowY = ta.style.overflowY;

              taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

              taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

              // ensure getComputedStyle has returned a readable 'used value' pixel width
              if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                // update mirror width in case the textarea width has changed
                width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                mirror.style.width = width + 'px';
              }

              mirrorHeight = mirror.scrollHeight;

              if (mirrorHeight > maxHeight) {
                mirrorHeight = maxHeight;
                overflow = 'scroll';
              } else if (mirrorHeight < minHeight) {
                mirrorHeight = minHeight;
              }
              mirrorHeight += boxOuter.height;
              ta.style.overflowY = overflow || 'hidden';

              if (taHeight !== mirrorHeight) {
                ta.style.height = mirrorHeight + 'px';
                scope.$emit('elastic:resize', $ta);
              }
              
              scope.$emit('taResize', $ta); // listen to this in the UserMessagesCtrl

              // small delay to prevent an infinite loop
              $timeout(function() {
                active = false;
              }, 1);

            }
          }

          function forceAdjust() {
            active = false;
            adjust();
          }

          /*
           * initialise
           */

          // listen
          if ('onpropertychange' in ta && 'oninput' in ta) {
            // IE9
            ta['oninput'] = ta.onkeyup = adjust;
          } else {
            ta['oninput'] = adjust;
          }

          $win.bind('resize', forceAdjust);

          scope.$watch(function() {
            return ngModel.$modelValue;
          }, function(newValue) {
            forceAdjust();
          });

          scope.$on('elastic:adjust', function() {
            initMirror();
            forceAdjust();
          });

          $timeout(adjust);

          /*
           * destroy
           */

          scope.$on('$destroy', function() {
            $mirror.remove();
            $win.unbind('resize', forceAdjust);
          });
        }
      };
    }
  ]);









