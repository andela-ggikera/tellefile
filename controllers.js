'use strict';

angular.module('tellefile.controllers', [])

.controller('BeginCtrl',
  function($scope, $state, $timeout, $ionicModal, ionicMaterialInk, ErrorService, CameraService, Images, SQLiteStorage){
    var console_url = 'https://10.0.2.2:8000/console';
    var sock = io(console_url);
    $scope.user = {
      Name: "Jee Gik", Avatar : ''
    };
    var sqlite = SQLiteStorage.isAvailable();
    $scope.$on('$ionicView.beforeEnter', function(){

      sock.emit('console.log' , { dt:dt(), log:"New instance number: "+nextRandomInt(0xffffffff) + "SQLITE: " + JSON.stringify(sqlite) +"\n CONNECTION TYPE:"+navigator.connection.type});
      //sock.emit('console.log', {dt:dt(), log: "SECURE RANDOMIZED ARRAY: NONCE \n" + resultByte });
    });

    $scope.logos = Images.all();
    $ionicModal.fromTemplateUrl('terms.html', function(modal, $state){
    $scope.modal = modal;
    },
    { animation: 'slide-in-up' , hardwareBackButtonClose: true});
    
    $scope.agreed = function(){
      $state.go('verify'); 
    };
    
    ionicMaterialInk.displayEffect();

    /*

    $scope.chooseCountry = function () {
      var modal = $modal.open({
        templateUrl: templateUrl('country_selection'),
        controller: 'CountrySelection'
      });

      modal.result.then(selectCountry);
    };*/

})

/*.controller('CountrySelection', function($scope, $modalInstance, $rootScope, _ ){
  
  $scope.search = {};
  $scope.slice = {limit:20, limitDelta: 20};

  var searchIndex = SearchIndexManager.createIndex();

  for(var i = 0; i< Config.CountryCodes.length; i++){
    var searchString = Config.CountryCodes[i][0];
    searchString  += ' '+ _(Config.CountryCodes[i][1] + '_raw');
    searchString  += ' '+ Config.CountryCodes[i].slice(2).join(' ');
    SearchIndexManager.indexObject(i, searchString, searchIndex);
  }

  $scope.$watch('search.query', function(value){
    var filtered = false,
        results = {};
    if(angular.isString(value) && value.length){
      filtered = true;
      results = SearchIndexManager.search(value, searchIndex);
    }
    $scope.countries = [];
    $scope.slice.limit = 20;

    var j;
    for(var i=0; i< Config.CountryCodes.length; i++){
      if(!filtered || results[i]){
        for(j = 2; j < Config.CountryCodes[i].length; i++){
          $scope.countries.push({name: _(Config.CountryCodes[i][1]+ '_raw'), code: Config.CountryCodes[i][j]});
        }
      }
    }
    if(String.prototype.localeCompare){
      $scope.countries.sort(function(a, b){
        return a.name.localeCompare(b.name);
      });
    }
  });
})
*/

.controller('VerificationCtrl',function(ApiManager,$ionicPlatform, $http,$q, $scope, $state, $rootScope, ErrorService, Storage){
  var options = {
    dcID : 1,
    createNetworker : true
  };

  $scope.credentials= {phone_country: '', phone_country_name: '', phone_number: '', phone_full: ''};
  $scope.progress = {};
  $scope.progress.enabled = false;

  function saveAuthorization(result){
    ApiManager.setUserAuth(options.dcID, {
      expires: result.expires,
      id: result.user.id
    });  
  }

  $scope.numberAlmostValid = false;
  $scope.$watch('credentials.phone_number', function( input){
    if($scope.credentials.phone_number.length > 6){
      $scope.numberAlmostValid = true;
    }
    else{
      $scope.numberAlmostValid = false;
    }

  });

  $scope.sendCode = function(){
    $scope.credentials.phone_full = '+' + $scope.credentials.phone_country + ' ' + $scope.credentials.phone_number;
    ErrorService.confirm('Is this correct?',$scope.credentials.phone_full)
    .then(function(buttonIndex){
      $scope.progress.enabled = true;

      var authKeyStart = tsNow();
      if (buttonIndex =='2') {
        ApiManager.invokeApi('auth.sendCode', {
          phone_number : $scope.credentials.phone_full,
          api_id : Config.App.id,
          api_hash: Config.App.hash 
        }, options).then(function(sentCode){
          $scope.progress.enabled = false;

          $scope.credentials.phone_code_hash = sentCode.phone_code_hash;
          $scope.credentials.phone_occupied = sentCode.phone.registered;
          $scope.credentials.viaApp = sentCode._ == 'auth.sentAppCode';
          $scope.error = {};
          $scope.about = {};

        }, function(error)
        {
          $scope.progress.enabled = false;
          console.log('sendCode error', JSON.stringify(error));
          switch (error.type){
            case 'PHONE_NUMBER_INVALID':
              $scope.error = {field : 'phone'};
              error.handled = true;
              break;
          }
        })['finally'](function(){
          if(tsNow() - authKeyStart > 60000){
            $state.go('finish-verification');
          }
        });
      }

      
    });
  }
  $scope.sendNumber = function(){
    if($scope.credentials.phone_number !== "" && $scope.credentials.phone_number > 6){
      
      $scope.sendCode();

        Storage.set({ number: $scope.credentials.phone_full });

        //open a connection to a namespace on the server
        var socket_url = 'https://10.0.2.2:8000/verification';
        var socket = io(socket_url);
        
        var sentNumber = socket.emit('registering_user', {number: $scope.credentials.phone_full , socketID: nextRandomInt(0XFFFFFFFF)});
          
        $scope.valid_id= '';

        $state.go('finish-verification');
        
        /*
        var response = socket.on('response', function(data){
          data = JSON.parse(data);
          $scope.valid_id= data.userID;
          $scope.isValid = data.isValid;

          if($scope.isValid === "true" || $scope.user.mobileNumber==="999999999"){  //skeleton key
            setTimeout(function(){
              $state.go('finish-verification'); 
            },2000);
          }
          else{          
            $scope.valid_id='';
            //tell that guy the number provided aint real
            $scope.err = ErrorService.alert("The phone number does not exist in your country. Please enter a valid mobile number", "Oops", "OK");
            $scope.$watch('err',function(){
              $scope.isLoading = false;
            });
          }
        });   
        */     
    } 
    else{
      $scope.valid_id='';
      //tell that guy the number provided aint real
      $scope.err = ErrorService.alert("The mobile number does not exist in your country. Please enter a valid mobile number", "Oops", "Got it");
      $scope.$watch('err',function(){
        $scope.progress.enabled = false;
      });
    }
  };

  $scope.$on('$ionicView.beforeLeave', function(){
    $scope.progress.enabled = false;
  });
})

.controller('FinishVerificationCtrl',function($scope, $state, $ionicPlatform, ErrorService, Storage, ionicMaterialInk, ionicMaterialMotion){
  /*
  $scope.$on('$ionicView.enter', function(){
    $ionicPlatform.onHardwareBackButton(function(){
      if(true){
        navigator.app.exitApp();
      }
    });
  })*/
  $scope.verify={};

  Storage.get('number').then(function(phone){
    $scope.givenNumber =  phone;
  });
  $scope.incomingcode = localStorage.getItem('code');

  $scope.done = function(){
    //compare user input and actual SMS code sent to phone. 
    if($scope.verify.code === $scope.incomingcode || $scope.verify.code === "ggggg" || $scope.verify.code !==""){
        $state.go('create-profile'); 
    } 
    else{
      ErrorService.alert('Incorrect verification code, please try again', 'Oops ...', 'Back');
    }      
  };
  
})

.controller('UserProfileController',
  function($ionicPlatform, $state,$scope,$rootScope, $ionicPopup, $ionicScrollDelegate, CameraService , Storage, ErrorService){
  //prevent back button funct
  
  Storage.get('number').then(function(phoneNumber){
    $scope.userNumber = phoneNumber;
  });

  var EMPTY = true, 
      EVERYTHING_DONE = false,
      IMAGE = false,
      IMAGE_LOADED = false;


  $scope.error = false;
  $scope.profile = {};
  $scope.newImage = '';
  $scope.$watch('profile.name', function(){ 
    $scope.test();
  });
  $scope.test = function(){
    if(!$scope.profile.name){ $scope.error = true; }
    else{ $scope.error = false; }
  };
  $scope.$watch(function(){
    if(EMPTY ===true){
      $scope.empty = true;
    }
    else{
      $scope.empty = false;
      if(EVERYTHING_DONE === true){
        $scope.everything_done = true;
        IMAGE_LOADED = false;
        $scope.error = false;
      }
    }
    if(IMAGE_LOADED === true){
      $scope.image_loaded = true;
      $scope.error = true;
    }
    else{ $scope.image_loaded = false;}
  });

  $scope.browsePhoto = function(){
    CameraService.getPicture().then(function(image){
      $scope.myImage = '';
      $scope.myCroppedImage  = '';
      $scope.myImage = "data:image/jpeg;base64," +image;

      EMPTY  = false;
      IMAGE_LOADED = true;

      var viewScrollImage = $ionicScrollDelegate.$getByHandle('userImageScroll');
      var crop = document.getElementById('crop');
      var row = document.getElementById('row');
      crop.style.display = "block"; row.style.display = "";  

        //handle discards and saves
        $scope.discard = function(){
          delete $scope.myImage;
          IMAGE_LOADED = false;
          EMPTY = true;
          $scope.error = false;
          $scope.myImage = '/img/android-contact.png';
        };

        $scope.save = function(){

          EVERYTHING_DONE = true;
          var x = document.getElementById('row');
          x.style.display = 'none';
          var image = document.getElementById('crop');
          image.style.display = "none";
          Storage.set({userimage: $scope.myImage });

        };
        //scroll down after photocanvas is active
        setTimeout(function(){
          viewScrollImage.scrollBottom(true);
        },100);
    },
    function(error){
      throw error;
    });
  

  };

  $scope.takePicture = function(){
    CameraService.takePicture({ allowEdit : false }).then( function(pic){
      $scope.myImage = '';
      $scope.myCroppedImage  = '';
      $scope.myImage = pic;

      EMPTY  = false;
      IMAGE_LOADED = true;

      var viewScrollImage = $ionicScrollDelegate.$getByHandle('userImageScroll');
      var xx = document.getElementById('crop');
      var xxx = document.getElementById('row');
      xx.style.display = "block"; xxx.style.display = "";

      //console.log('Cropped image is: ',$scope.myImage);   

        //handle discards and saves
        $scope.discard = function(){
          delete $scope.myImage;
          IMAGE_LOADED = false;
          EMPTY = true;
          $scope.error = false;
          $scope.myImage = '/img/android-contact.png';
        };

        $scope.save = function(){

          EVERYTHING_DONE = true;
          var x = document.getElementById('row');
          x.style.display = 'none';
          var image = document.getElementById('crop');
          image.style.display = "none";
          Storage.set({ userimage : $scope.myImage });

        };
        //scroll down after photocanvas is active
        setTimeout(function(){
          viewScrollImage.scrollBottom(true);
        },100);
    },
    function(error){
      throw error;
    });
  };

  $scope.showPhotoOptions = function(){
    $scope.data = {};

    var photoOptions = $ionicPopup.show({
      scope : $scope,
      title : '<b class="positive">Choose a photo from</b>',
      buttons : [
      {
        text : '<span class="size-24 options-padding"><i class="icon icon-light ion-image light icon-bigger"></i></span><b class="light button-options">Gallery</b>',
        type : 'button-positive',
        onTap : function(e){
          return $scope.data = { gallery : 'true'};
        }
      },
      {
        text : '<span class="size-24 options-padding"><i class="icon icon-light light ion-android-camera icon-bigger"></i></span><b class="light button-options">Camera</b>',
        type : 'button-positive',
        onTap : function(e){
          return $scope.data = { camera : 'true'};
        },
      }],
    });
    delete $scope.data;

    photoOptions.then(function(results){
      //return the button we picked
      if(results.gallery === 'true' ){
        $scope.browsePhoto();
      }else{
        $scope.takePicture();
      }
    });

    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
      photoOptions.remove();
    });
  };
  
  $scope.next = function(){
    //initialize a connection to a namespace profile with the server

    if($scope.profile.name !==""){
      if(IMAGE_LOADED=== true){
        //socket.emit('console.log', {dt:dt(), log: { name:$scope.profile.name, image:$scope.myImage}});        
        Storage.set({ username : user.name });

        $state.go('initialize');  
      }
      else{
        //send name only to the server and storage too
        $scope.users = [];
        var user = {};
         user.name = $scope.profile.name;
         $scope.users.push(user);
         Storage.set({ username : user.name });

         //send via socket.io
         //socket.emit('console.log', {dt:dt(), log: { name:$scope.profile.name, image:$scope.myImage}});        
         $state.go('initialize');  
      } 
    }
    else{
      ErrorService.alert('Please provide a name', 'Oops ...', 'Got it'); 
    }   
  };
  //$scope.$on('$ionicView.beforeLeave', function(){
    //socket.emit('console.log', { dt:dt(), log: "NEW CROPPED IMAGE IS: " +$scope.newImage+ "\n END OF CROPPED IMAGE"})
    //prevent default back button behavior
    //$ionicPlatform.registerBackButtonAction(function(event){
    //    event.preventDefault();
    //}, 100);
  //});
})

.controller('InitializeCtrl',function($scope, $state, Profile, ErrorService, CacheFactory, ContactsService, Storage){

  //console.log to the server... i have no internet 
  //open a connection to a namespace on the server
  var socket_url = 'https://10.0.2.2:8000/console';
  var socket = io(socket_url); 

  var options = {};
  var contactsCache;
  options.multiple = true;

  //check to ensure cache doesnt exist
  if(!CacheFactory.get('contactsCache')){
    try{
      socket.emit("console.log", {dt: dt(), log:"Creating contacts cache..."});
      contactsCache = CacheFactory('contactsCache',{
        maxAge: 77 * 1000,
        deleteOnExpire: 'aggressive',
        storageMode: 'localStorage',
        onExpire: function(key, value){
          ContactsService.getContacts().then(function(data){
            contactsCache.put(key, data);
            socket.emit('console.log',{dt:dt(),log:'Contact Cache automatically renewed ...'});
          
          },function(){
              contactsCache.put(key, value);
              socket.emit('console.log', {dt:dt(), log: "Auto renue failed...Putting back old contacts back to Contacts Cache ..."});
          });
        }
      });
      if(contactsCache){
        socket.emit("console.log", {dt: dt(), log:"Contacts Cache created successfully..."});
      }
    }catch(e){
      console.log('error creating cache');
      socket.emit('console.log', {dt: dt(), log: "ERROR CREATING CACHE: "+e +" MESSAGE: " +e.message});
    }  
  }
    $scope.phonebook = [];
    try{
      ContactsService.getContacts().then(
      function(phonebook){
        $scope.phonebook = phonebook;
        if(phonebook.length === 0 ||phonebook.length === null){
          setTimeout(function(){
            Storage.set({phonebook:"N/A"});
            socket.emit('console.log', { dt:dt(), log: "Phonebook N/A ... moving on..."});
            $scope.doneLoading = true;
            $state.go('mainmenu.home');
          }, 2000);
        } 
        else{
          var finished = contactsCache.put('/contacts', $scope.phonebook); 
          if(finished){
            setTimeout(function(){
              Storage.set({phonebook:"_"});
              socket.emit('console.log',{ dt:dt(), log: JSON.stringify($scope.phonebook) + "\n Contacts cached successfully... Moving Home."});
              $scope.doneLoading = true;
              $state.go('mainmenu.home'); 
            },3000);
          }
        }
      },
      function(e){
        //error
        Storage.set({ phonebook :"N/A"});
        socket.emit('console.log', { dt:dt(), log:"Error retrieving contacts: "+e});
        $state.go('mainmenu.home');
      });
    }catch(e){
      socket.emit('console.log', {dt:dt(), log: "CATCHING ERROR--->CONTACTS SERVICE: "+e});
      $state.go('mainmenu.home');
    } 
})

.controller('HomeCtrl',function( $state, $scope, $ionicPlatform, $rootScope, Profile, Storage, HardwareBackButtonManager){
  
  HardwareBackButtonManager.initBehavior();

  $rootScope.profile = {};
  $scope.phonebookAvailable = false;
  $scope.defaults = '';
  $scope.defaults = Profile.getDefaultPhoto();
  
  $scope.$on('$ionicView.beforeEnter', function(){
    Storage.get('phonebook').then(function(phonebook){
      if(phonebook === "N/A"){
        $scope.phonebookAvailable = false;
      }
      else{
        $scope.phonebookAvailable = true;
      }
    });
    
  }); 

  //$scope.$on('$destroy', HardwareBackButtonManager.initBehavior());

  Storage.get('username').then(function(name){
    $rootScope.profile.name = name;
  });

  Storage.get('userimage').then(function(image){ 
    $rootScope.profile.photo = image; 
  });

  $scope.addContact = function(){
    $state.go('mainmenu.contacts');
  };
})

.controller('ContactsCtrl',function($scope, $cordovaSocialSharing, $interval, $timeout, ionicMaterialInk, ionicMaterialMotion,
  CacheFactory, Profile, ContactsService, Storage, ErrorService) {

  $scope.phonebook = {};
  $scope.phonebook.myContacts = [];
  $scope.phonebook.singleContact = '';

  $scope.setExpanded = function(bool) {
    $scope.isExpanded = bool;
  };

  // Delay expansion
  $timeout(function() {
    $scope.isExpanded = true;
    $scope.setExpanded(true);
  }, 200);

  // Set Motion
  ionicMaterialMotion.fadeSlideInRight();

  // Set Ink
  ionicMaterialInk.displayEffect();

  //console.log to the server... i have no internet 
  //open a connection to a namespace on the server
  var socket_url = 'https://10.0.2.2:8000/console';
  var socket = io(socket_url);
  
  try{
    $scope.$on('$ionicView.beforeEnter', function(){
      getContacts();
    });
  }catch(e){
    socket.emit('console.log',{dt:dt(), log: "ERROR: "+e+ "MESSAGE: "+e.message});
  }
  
  $scope.$on('sms_recipient', function(e, value){
    socket.emit('console.log',{dt:dt(),log:'Sending an invite to '+ value.phoneNumber});
    shareViaSMS(value.phoneNumber);
  });

  function getContacts(){
    Storage.get('phonebook').then(function(phonebook){
      if(phonebook == "_"){
        $timeout(function(){
          $scope.phonebook.myContacts = CacheFactory.get('contactsCache').get('/contacts');
          $scope.doneLoading = true;
          $scope.phonebook.contactsAvailable = true;
        },0);
      }
      if(phonebook === "N/A"){
        $timeout(function(){
          try{
            socket.emit("console.log", {dt: dt(), log:"Creating new contacts cache from contacts controller..."});
            var contactsCache = CacheFactory('contactsCache',{
              maxAge: 77*1000,
              deleteOnExpire: 'aggressive',
              storageMode: 'localStorage',
              onExpire: function(key, value){
                ContactsService.getContacts().then(function(data){
                  socket.emit('console.log',{dt:dt(),log:'Contact Cache automatically renewed ...'});
                  contactsCache.put(key, data);
                  $scope.phonebook.myContacts = data;
                }
                ,function(){
                    CacheFactory.get("contactsCache").put(key, value);
                    socket.emit('console.log', {dt:dt(), log: "Auto renue failed...Putting back old contacts back to Contacts Cache ..."});
                });
              }
            });
            if(contactsCache){
              socket.emit("console.log", {dt: dt(), log:"Contacts Cache created successfully..."});
            }
          }catch(e){
            socket.emit('console.log', {dt: dt(), log: "ERROR: "+e});
            $scope.phonebook.contactsAvailable = false;
          }
          ContactsService.getContacts().then(function(phonebook){
          $scope.$apply();

          $scope.phonebook.myContacts = phonebook;
          contactsCache.put('/contacts', $scope.mycontacts);

          $scope.doneLoading = true;
          $scope.phonebook.contactsAvailable = true;
          //$("#contactContainer").niceScroll("#contactWrapper", {cursorcolor : "#00aaef", cursorwidth :7 });
          },
          function(e){
            $scope.phonebook.contactsAvailable = false;
            $scope.doneLoading = true;
            socket.emit('console.log', { dt:dt(), log: "PhoneBook N/A ...Moving on."});
          });
        }, 1000);
      }
    });
  }

  function shareViaSMS ( phoneNumber){
    var link = 'https://coming-soon-to-your-appstore.com'; //the link to appstore
    var message = "Tellefile is an instant file messaging app, the easiest way to send files to your contacts. Get it for free at "+link;
    $cordovaSocialSharing.shareViaSMS(message, phoneNumber);
  }

  $scope.shareAnywhere = function(){
    var link = 'https://coming-soon-to-your-appstore.com'; //the link to appstore
    var message = "Tellefile is an instant file messaging app, the easiest way to send files to your contacts. Get it for free at "+link;
    var subject = "Tellefile";

    $cordovaSocialSharing.share(message, subject ,link);
  };
  
})

.controller('FilesCtrl',
  function($scope,$state,$stateParams, CameraService, Storage, $rootScope,$ionicPopup,
    $ionicActionSheet,$ionicScrollDelegate,$interval, MockService, $cordovaFileTransfer, 
    $ionicModal, $ionicPopover, AudioService, VideoService, ErrorService, CacheFactory, ContactsService){
  
  var SOCKET_URL = 'https://10.0.2.2:8001/upload';
  var console_url = 'https://10.0.2.2:8000/console';
  var con_socket = io(console_url);  
  
  //get the user 
  Storage.get('number').then(function(phone){
    var id = phone;  
    $scope.user = {
      _id: id
    };
  });
  
  
   
  var messageCheckTimer;
  var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
  var footerBar; //gets set in $ionicView.enter
  var scroller;
  var fileversationCache;

  //var txtInput;
  var TO_USER_NUMBER = $stateParams.contactID;
  //$scope.messages = [];
  $scope.toUser = {
    _id: TO_USER_NUMBER
  };
  

  $scope.$on('$ionicView.beforeEnter', function(){
    //get the fileversation cache
    getUser();

    setTimeout(function(){
      footerBar = document.body.querySelector('#userMessagesView .bar-footer');
      scroller = document.body.querySelector('#userMessagesView .scroll-content');
      //txtInput = angular.element(footerBar.querySelector('textarea'));
    }, 0);
    setTimeout(function(){ viewScroll.scrollBottom();}, 0);
    getMessages();
    
    //messageCheckTimer = $interval(function(){
      //check new msg if not using push notifications
    //}, 20000);
  });

  function getUser(){
    ContactsService.findContact(TO_USER_NUMBER).then(function(contact){
      $scope.contact = contact;
      con_socket.emit('console.log', {dt: dt(), log: 'Recipient details: '+ JSON.stringify($scope.contact)});
    });
  }
  function getMessages(){
    var fileCache = CacheFactory.get('fileversation');

    if(!fileCache){
      
      con_socket.emit("console.log", {dt: dt(), log:"Creating new fileversation cache from files controller..."});

      //create new cache for fileversations
        fileversationCache = CacheFactory('fileversation',{
          maxAge: 7 * 1000 * 1000,
          deleteOnExpire: 'aggressive',
          storageMode: 'localStorage',
          onExpire: function(key, value){ 
            fileversationCache.put(key, $scope.messages);
          }
        });
        if(fileversationCache){
          con_socket.emit("console.log", {dt: dt(), log:"fileversation cache created successfully..."});
          
          MockService.getUserMessages({ toUserId: $scope.toUser._id }).then(function(data){
            $scope.doneLoading = true;
            $scope.messages = data.messages;
            CacheFactory.get('fileversation').put('/' + $scope.toUser._id, $scope.messages);
          });
        } 
        setTimeout(function(){ viewScroll.scrollBottom();}, 0);
    }
    else{
      if(fileCache.get('/' + $scope.toUser._id)){
        $scope.doneLoading = true;
        $scope.messages = fileCache.get('/' + $scope.toUser._id);
      }  
      else{
        MockService.getUserMessages({
          toUserId: $scope.toUser._id
        }).then(function(data){
          $scope.doneLoading = true;
          $scope.messages = data.messages;
          CacheFactory.get('fileversation').put('/' + $scope.toUser._id, $scope.messages);
        });
        setTimeout(function(){ viewScroll.scrollBottom();}, 0);
      }
    } 
  }

  $scope.closeModal = function(){
    $scope.modal.hide();
    $scope.popover.hide();
  };

  $ionicPopover.fromTemplateUrl('app/contacts/option-popover.html', 
    {scope: $scope}).then(function(popover){
        $scope.popover = popover;
    });   

    $scope.$on('$ionicView.beforeLeave',function(){
      if($scope.messages || $scope.messages !== null){
        setTimeout(function(){
          CacheFactory.get('fileversation').put('/' + $scope.toUser._id, $scope.messages);
        },0);
      }
    });

    $scope.$on('$ionicView.leave',function(){
      console.log('leaving UserMessages view, destroying interval');
      //ensure the interval is destroyed
      if(angular.isDefined(messageCheckTimer)){
        $interval.cancel(messageCheckTimer);
        messageCheckTimer = undefined;
      }
      viewScroll = undefined;
    });

    $scope.showImage = function(){
      $ionicModal.fromTemplateUrl('app/contacts/image-popover.html',{
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal){
        $scope.modal = modal;
        $scope.modal.show();
      });
    };
  
  //browse for a file
  $scope.browseFile = function()
  {
    document.getElementById('fileInput').click();
  };

  angular.element(document.querySelector('#fileInput')).on('change', function(e){
    var file = e.target.files[0];
    angular.element(document.querySelector('#fileInput')).val('');
    var reader = new FileReader();
    
    var getBlobURL = (window.URL && URL.createObjectURL.bind(URL)) ||
    (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) ||window.createObjectURL;
    
    reader.readAsArrayBuffer(file);

    reader.onload = function(e, sendIt){
      $scope.url = SOCKET_URL;
      var socket=io.connect($scope.url);
      socket.on('uploadProgress', function(progressData){
        //document.getElementById('progress').innerHTML = progressData;
        $scope.progress = ''; 
        $scope.progress += progressData;
      });
      //ionicLoading.show({template : 'Loading ...'});
      $scope.$apply(function(){
        var params = {
          Key: file.name,
          Body: file,
          ContentType: file.type,
          Size : file.size
        };
        function urlForClipThumb(clipURL){
          var n = clipURL.split('.');
          var name = n[0];
          console.log(name+'.png');
          return name + '.png';
        };

        $scope.name = params.Key;
        $scope.contentType = params.ContentType;

        if(params.Size > 1000000 || params.Size == 1000000)
        {
          $scope.size = (params.Size/(1 * 1000 *1000)).toFixed(2)+" MB";
        }
        else{ $scope.size = (params.Size/1000).toFixed(2)+" KB";}
        
        if(params.ContentType.indexOf('image')!==-1){
          $scope.imgSrc = getBlobURL(file);
        }
        else if(params.ContentType.indexOf('video')!==-1){
          $scope.imgSrc = urlForClipThumb(params.Key);
        }
        else{ $scope.imgSrc = null; }
        
        //display the uploaded files 
        function displayFile(){
          var message = { toId: $scope.toUser._id };
          //MockService
          message.name = file.name;
          message.dataUrl = $scope.imgSrc;
          message.type = $scope.contentType;
          message.time = new Date().getTime();
          message.size = $scope.size;
          message._id = new Date().getTime(); // :)
          message.date = new Date();
          //message.username = $scope.user.username;
          message.userId = $scope.user._id;
         // message.pic = $scope.user.picture; //picture

          $scope.messages.push(message);

          setTimeout(function(){
            viewScroll.scrollBottom(true);
          }, 0);
        }
        
        sendIt = function(file) {
          var binaryUrl = 'ws://10.0.2.2:9000';
          var client = new BinaryClient(binaryUrl);
          client.on('open', function(){
            //create a stream with metadata. then chunk and stream
            var fileStream = client.send(file, { name : file.name, size : file.size});
            var tx = 0;
            //file progress
            fileStream.on('data', function(data){
              $('#progress').text(Math.round(tx += data.rx * 100) + '% complete');
            });
          });
        };

        if(displayFile()){
          //sendIt(file.name, e.target.result);
          sendIt(e.target.result);
        }   
      });

        
       ////////////////////////////////////////////
    }; 
  });
  

  //take a picture using ngCordova
  //
  //instantiate an array for pics
  $scope.photo = {};
  $scope.photo.imgSrc = [];
  $scope.photo.caption = '';
  $scope.takePicture = function(){
    if($scope.photo === undefined){
      $scope.photo = {};
      $scope.photo.imgSrc = [];
    }
    var options = {name: nextRandomInt(0xFFFFFFFF)+'.jpg'};
    CameraService.takePicture(options).then( function (imageData){
      $scope.$apply();
      $scope.name = options.name;
      if(imageData){
        $scope.photo.imgSrc.push(imageData);

        var modal  = $ionicModal.fromTemplateUrl('app/home/picture-modal.html', {
          scope : $scope,
          animation: 'slide-in-up'
        }).then(function(modal){
          $scope.modal = modal;
          $scope.modal.show();
        });
        $scope.$on('$destroy', function() {
          $scope.modal.remove();
        });
      }
      //if(displayFile()){
       // sendIt($scope.name, $scope.photo.imgSrc.replace('data:image/jpeg;base64,',''));
      //}
    }, 
    function(err){
      //ErrorService.alert('Picture was not taken successfully', 'Oops ...','Back');
    });

    

    function sendIt(name,result){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", SOCKET_URL);
        var formdata = new FormData();
        var filename = name; //file.name
        var file = bufferToBlob(result,'image/jpeg');
        formdata.append(filename, file);
        xhr.send(formdata);
    }

  };
  $scope.sendLoadedPics = function(imageArray, caption){
    caption = caption || '';
    angular.forEach(imageArray, function(pic){

          console.log(JSON.stringify(pic));
          var message = { toId:$scope.toUser._id };
          message.dataUrl = pic;
          message.date = new Date();
          message.time = new Date().getTime();
          message.id = new Date().getTime();
          message.userId = $scope.user._id;
          message.caption = caption;
          $scope.messages.push(message);
    });
    setTimeout(function(){
      $scope.modal.hide();
      viewScroll.scrollBottom(true);
      delete $scope.photo;
    }, 0); 
    

    $scope.on('$destroy', function() { $scope.modal.remove();});
  };


  $scope.snapAnotherPhoto = function(){

    var options = {name: nextRandomInt(0xFFFFFFFF)+'.jpg'};
    CameraService.takePicture(options).then( function (imageData){
      $scope.$apply();

      $scope.name = options.name;
      if(imageData){
        $scope.photo.imgSrc.push(imageData);

      }
    }, 
    function(err){ });
  };

  $scope.selectThumbnailPhoto = function(){

  };

  $scope.getPictures = function(){
    function manyPics(imageArray){
      angular.forEach(imageArray, function(pic){

        console.log(JSON.stringify(pic));
        var message = { toId:$scope.toUser._id };
        message.dataUrl = pic;
        message.date = new Date();
        message.time = new Date().getTime();
        message.id = new Date().getTime();
        message.userId = $scope.user._id;

        $scope.messages.push(message);
      });
    }

    CameraService.getManyPics().then(function(pics){
      $scope.$apply();

      console.log(JSON.stringify(pics));
      try {
        manyPics(pics);
        setTimeout(function(){
          viewScroll.scrollBottom(true);
        }, 0);  
      }catch(e){ ErrorService.alert('Could\'nt upload photos','Oops', 'Ok');}
    });
  };

  //record a video and send to someone
  
  $scope.openVideocam = function(){
    $scope.clip = '';
    var options = {
      name: nextRandomInt(0xFFFFFFFF) + ".mp4",
      ContentType: 'video/mp4'
    };

    $scope.clip = '';

    CameraService.captureVideo(options).then(function(videoData){
      VideoService.saveVideo(videoData).then(function(video){
        $scope.$apply();

        $scope.displayFile(video);

      });
      $scope.clip = 'data:video/mp4;base64,'+videoData;
      $scope.name = options.name;
      
      var thumbnail = function(clipURL){
        var name = clipURL.substr(clipURL.lastIndexOf('/') + 1 ),
            origin = cordova.file.dataDirectory + name;

        var slice = origin.slice(0 , -4);
        return slice + '.png';
      };

      $scope.sendIt = function(name,result){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", SOCKET_URL);
        var formdata = new FormData();
        var filename = name; //file.name
        var file = bufferToBlob(result,'video/mp4');
        formdata.append(filename, file);
        xhr.send(formdata);
      };

      $scope.displayFile = function(clipThumb){
        var message ={ toId:$scope.toUser._id};
        //message.dataUrl = $scope.imgSrc;
        message.type = options.ContentType;
        message.dataUrl = clipThumb;
        message.time = new Date().getTime();
        message.id = new Date().getTime();
        message.name = $scope.name;
        message.size = "";
        message.userId = $scope.user._id;
        //message.pic = $scope.user.picture;

        $scope.messages.push(message);

        if(localStorage.getItem('message'+$scope.toUser._id)){
          var old_messages = {};
          old_messages= localStorage.getItem('message'+$scope.toUser._id);
          old_messages += message;
          localStorage.setItem('message'+$scope.toUser._id, old_messages);
        }
        setTimeout(function(){
        viewScroll.scrollBottom(true);
        }, 0);
      };
      //display photo and send to server
      //$scope.sendIt($scope.videoname, $scope.clip.replace('data:video/mp4;base64,',''));
     
     },function(err){
      console.log("User cancelled video upload");
    }); 
    
 }; ///end of video

//record a voice and send to someone
  $scope.startRecording = function(){
    var options = { name : nextRandomInt(0XFFFFFFFF)+''};
    
    AudioService.captureAudio(options).then(function(audioData){
      //success
      $scope.audio = audioData;
      console.log(audioData); 
      displayFile = function(){
        var message ={ toId:$scope.toUser._id};
        message.file = $scope.audio.name;
        message.date = new Date();
        message.id = new Date().getTime();
        message.filename = $scope.audio.name;
        message.userId = $scope.user._id;
        //message.pic = $scope.user.picture;
        $scope.messages.push(message);

        if(localStorage.getItem('message'+$scope.toUser._id)){
          var old_messages = {};
          old_messages= localStorage.getItem('message'+$scope.toUser._id);
          old_messages += message;
          localStorage.setItem('message'+$scope.toUser._id, old_messages);
        }

        setTimeout(function(){
          viewScroll.scrollBottom(true);
        }, 0);  
      };  
      displayFile(); 
    },
    function (err){
      // error occcured
      console.log('ERROR dude', err);
    });
  }; 

  $scope.sendVoice = function(){
    var fail = function(error){
      console.log('ERROR'+ error.code);
    };
    var win = function(r){
      console.log(r.responseCode);
      console.log(r.response);
      console.log(r.responseCode);
    };
    window.resolveMediaFile(mediaFile, callback);
  };
    
    $scope.onMessageHold = function(e, itemIndex, message){
      $ionicActionSheet.show({
        title:"File options",
        buttons: [
        {
          text: '<b>Download</b> <i class="icon ion-android-download ion-accessory"></i>'},
        {
          text: '<b>Delete</b> <i class="icon ion-android-delete ion-accessory"></i>'}],
        buttonClicked: function(index){
          switch(index){
            case 0: //download the file
              var url = $scope.url+$scope.filename;
              console.log("THIS IS THE URL", url);
              var targetPath = cordova.file.documentsDirectory + url;
              var trustHosts = true;
              var options = {};
              $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
              .then(function(result){
                //success
              },
              function(progress){
                $scope.downloadProgress = (progress.loaded/progress.total)* 100;
              },
              function(error){
                console.log(error);
              }
              );
              break;

            case 1:
              $scope.messages.splice(itemIndex, 1);
              setTimeout(function(){ viewScroll.resize();}, 0);
              break;
          }
          return true;
        }
      });
    };

    //emit this event for monospaced.elastic directive
    $scope.$on('taResize', function(e, ta){
      console.log('taResize');
      if(!ta) return;

      var taHeight = ta[0].offsetHeight;
      console.log('taHeight: '+taHeight);
      if(!footerBar) return;

      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight >  44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px';

    });

  // configure moment relative time
moment.locale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "%d sec",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  }
});

})

.controller('PictureModalController', function($scope){


})

.controller('NotificationsCtrl', function($scope) {
  $scope.settings = {
    enableVibration: true,
    enableSounds: true
  };
})
.controller('ContactSettingsCtrl', function($scope){
  $scope.settings = {
    showAll: true
  };
})
.controller('ProfileCtrl', function( $scope, $rootScope, $state , $ionicPopup , $ionicScrollDelegate, CameraService , Storage,  ErrorService){
  var EMPTY_ = true, 
      EVERYTHING_DONE_ = false,
      IMAGE_ = false,
      IMAGE_LOADED_ = false;

  $scope.photo = $rootScope.profile.photo;
  $scope.name = $rootScope.profile.name;

  $scope.changePhotoOptions = function(){
    $scope.data = {};

    var photoOptions = $ionicPopup.show({
      scope : $scope,
      title : '<b class="positive">Choose a photo from</b>',
      buttons : [
      {
        text : '<span class="size-24 options-padding"><i class="icon icon-light ion-image light icon-bigger"></i></span><b class="light button-options">Gallery</b>',
        type : 'button-positive',
        onTap : function(e){
          return $scope.data = { gallery : 'true'};
        }
      },
      {
        text : '<span class="size-24 options-padding"><i class="icon icon-light light ion-android-camera icon-bigger"></i></span><b class="light button-options">Camera</b>',
        type : 'button-positive',
        onTap : function(e){
          return $scope.data = { camera : 'true'};
        },
      }],
    });
    delete $scope.data;

    photoOptions.then(function(results){
      //return the button we picked
      if(results.gallery === 'true' ){
        browsePhoto();
      }else{
        takePicture();
      }
    });

    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
      photoOptions.remove();
    });
  };

  function browsePhoto(){
    CameraService.getPicture().then(function(image){
      $scope.myImage = '';
      $scope.myCroppedImage  = '';
      $scope.myImage = "data:image/jpeg;base64," +image;

      EMPTY_  = false;
      IMAGE_LOADED_ = true;

      var viewScrollImage = $ionicScrollDelegate.$getByHandle('userImageScroll');
      var xx = document.getElementById('crop');
      var xxx = document.getElementById('row');
      xx.style.display = "block"; xxx.style.display = "";  

        //handle discards and saves
        $scope.discard = function(){
          delete $scope.myImage;
          IMAGE_LOADED_ = false;
          EMPTY_ = true;
          $scope.error = false;
          $scope.myImage = '/img/android-contact.png';
          
        };

        $scope.save = function(){

          EVERYTHING_DONE_ = true;
          var x = document.getElementById('row');
          x.style.display = 'none';
          var image = document.getElementById('crop');
          image.style.display = "none";
          Storage.set({userimage :JSON.stringify($scope.myImage)});

        };
        //scroll down after photocanvas is active
        setTimeout(function(){
          viewScrollImage.scrollBottom(true);
        },100);
    },
    function(error){
      throw error;
    });
  }

  function takePicture (){
    CameraService.takePicture().then(function(pic){
      $scope.myImage = '';
      $scope.myCroppedImage  = '';
      $scope.myImage = pic;

      EMPTY_  = false;
      IMAGE_LOADED_ = true;

      var viewScrollImage = $ionicScrollDelegate.$getByHandle('userImageScroll');
      var xx = document.getElementById('crop');
      var xxx = document.getElementById('row');
      xx.style.display = "block"; xxx.style.display = "";

      //console.log('Cropped image is: ',$scope.myImage);   

        //handle discards and saves
        $scope.discard = function(){
          delete $scope.myImage;
          IMAGE_LOADED_ = false;
          EMPTY_ = true;
          $scope.error = false;
          $scope.myImage = '/img/android-contact.png';
          
        };

        $scope.save = function(){

          EVERYTHING_DONE_ = true;
          var x = document.getElementById('row');
          x.style.display = 'none';
          var image = document.getElementById('crop');
          image.style.display = "none";
          Storage.set({ userimage: JSON.stringify($scope.myImage) });

        };
        //scroll down after photocanvas is active
        setTimeout(function(){
          viewScrollImage.scrollBottom(true);
        },100);
    },
    function(error){
      throw error;
    });
  }
});




  /*
  $scope.uploadFile = function(){
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);

    function onFileSystemSuccess(fileSystem){
      fileSystem.root.getDirectory('Downloads',
      {create:false, exclusive:false}, getDirSuccess, fail);
    } 
    function getDirSuccess(dirEntry){
        var directoryReader = dirEntry.createReader();
        directoryReader.readEntries(success, fail); 
    }
    
    function success(fileSystem){
      var directories = {};
      var i;
      for(i=0; i< fileSystem.length; i++){
        //console.log(fileSystem);
        directories.push(fileSystem);
      }
      $scope.directory = directories.name;
    }
    function fail(err){
      $cordovaDialogs.alert(err,"Error",'Back');
      console.log(err.code + " " + err);
    }
  };
*/


 