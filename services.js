angular.module('tellefile.services', ['tellefile.i18n'])

.value('USER' ,{})
.value('SOCKET_URL', 'http://127.0.0.1:8000')
.value('LOGO', '/img/icon.png')

.factory('HardwareBackButtonManager', ['$state', '$ionicPlatform','$ionicHistory',
  function($state, $ionicPlatform, $ionicHistory){
    var backButton = {};
    backButton.initBehavior = function (){
      $ionicPlatform.registerBackButtonAction(function(){
        if($state.current.name == "mainmenu.home"){
          navigator.app.exitApp();
        }
        else{
          $ionicHistory.goBack();
        }
      }, 100);
    };
    return backButton;
}])

.factory("AvatarService", function(){

    function getAvatar(user){
      var colorCodes = {
        1: "#F29691",
        2: "#92D6C2",
        3: "#CFD696",
        4: "#FACA82",
        5: "#D7ADE0"
    };
    var i1 = "", i2 = "", nameArray = [];
    if (angular.isDefined(user.Name)) {
      i1 = angular.uppercase(user.Name.charAt(0));
      nameArray = user.Name.split(" ");
      if (nameArray.length > 2) {
        i2 = angular.uppercase(nameArray[nameArray.length - 1].charAt(0));
      } else {
        i2 = angular.uppercase(nameArray[1].charAt(0));
      }
    } else {
      i1 = angular.uppercase(user.FirstName.charAt(0));
      nameArray = user.LastName.split(" ");
      if (nameArray.length > 2) {
        i2 = nameArray[nameArray.length - 1].charAt(0);
      } else {
        i2 = angular.uppercase(nameArray[0].charAt(0));
      }
    }
    var initials = i1 + i2;
    var charCode = initials.charCodeAt(0) + initials.charCodeAt(1);
    charCode = charCode >= 130 && charCode <= 144 ? 1 : charCode >= 145 && charCode <= 158 ? 2 : charCode > 158 && charCode <= 172 ? 3 : charCode >= 173 && charCode <= 186 ? 4 : 5;
    var background = colorCodes[charCode];

    return ({ "Initials": initials, "Background": background });
    }
    return {
      getAvatar: getAvatar
    }
})

.service('ErrorService', function($cordovaDialogs){

  var shownDialogs = 0;

  function alert(description, title, exit){
    if(shownDialogs >=1){
      console.log('Too many open dialogs');
      return false;
    }
    shownDialogs++;
    var dialog = $cordovaDialogs.alert(description, title, exit);
    if(dialog){
      shownDialogs--;
    }
    return dialog;
  }
  function alertEnabled(){
    console.log('Alert closed by user');
  } 
  function  accepted(buttonIndex){
    console.log('confirm dialog closed and selected button '+ buttonIndex);
  }

  function confirm( desc, title){
    if(shownDialogs >=1){
      console.log('Too many open dialogs');
      return false;
    }
    shownDialogs++;
    var dialog = $cordovaDialogs.confirm(desc, title, ["Yes","No"]);

    if(accepted){
      shownDialogs--;
    }
    return dialog.then(function(index){
      return index;
    });
  }

  function accepted (buttonIndex){
    if(buttonIndex === 1){
      //yes button selected
      return true;
    }
    else{
      //cancel/no button selected
      return false;
    }
  }
  return {
    confirm: confirm,
    alert : alert,
    accepted: accepted
  };
})

.service('UsersManager', function($rootScope, $q, $modal, $filter, promises, ApiManager, ErrorService, Storage, RichTextProcessor){
    
  var users = {},
      usernames = {},
      cachedPhotoLocations = {},
      contactsFillPromise,
      contactsList,
      contactsIndex = SearchIndexManager.createIndex(),
      myID,
      serverTimeOffset = 0;

  Storage.get('server_time_offset').then(function(offset){
    if(offset){
      serverTimeOffset = 0;
    }
  });

  ApiManager.getUserID().then(function(id){
    myID = id;
  });

  function fillContacts () {
    if (contactsFillPromise) {
      return contactsFillPromise;
    }
    return contactsFillPromise = ApiManager.invokeApi('contacts.getContacts', {
      hash: ''
    }).then(function (result) {
      var userID, searchText, i;
      contactsList = [];
      saveApiUsers(result.users);

      for(var i = 0; i < result.contacts.length; i++){
        userID = result.contacts[i].user_id;
        contactsList.push(userID);
        SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex);
      }
      return contactsList;
    });
  }

  function getUserSearchText(id){
    var user = users[id];
    if (!user){
      return false;
    }
    return (user.phone || '') + ' '+ (user.username || '');
  }

  function getContacts (query){
    return fillContacts().then(function(contactsList){
      if(angular.isString(query) && query.length){
        var results = SearchIndexManager.search(query, contactsIndex),
            filteredContactsList = [];

        for (var i = 0; i < contactsList.length; i++){
          if(results[contactsList[i]]){
            filteredContactsList.push(contactsList[i]);
          }
        }
        contactsList = filteredContactsList;
      }
      return contactsList;
    });
  }

  function userNameClean(username){
    return username && username.toLowerCase() || '';
  }

  function resolveUsername (username){
    var searchName = userNameClean(username);
    var gotUserID = usernames[searchName];
    if(gotUserID && userNameClean(users[gotUserID].username) === searchName){
      return promises.when(gotUserID);
    }
    return ApiManager.invokeApi('contacts.resolveUsername', 
      { username : username }).then( function(resolveResult){
        saveApiUser(resolveResult);
        return resolveResult.id;
      });
  }
  function saveApiUser(apiUser, noReplace){
    if(!angular.isObject(apiUser) || 
      noReplace && angular.isObject(users[apiUser.id]) &&
      users[apiUser.id].first_name) {
      return;
    }

    var userID = apiUser.id;
    if (apiUser.phone){
      apiUser.rPhone = $filter('phoneNumber')(apiUser.phone);
    }

    apiUser.num = (Math.abs(userID) % 8) + 1;

    if(apiUser.username){
      usernames[userNameClean(apiUser.username)] = userID;
    }

    apiUser.sortName = SearchIndexManager.cleanSearchText(apiUser.username);

    var name = apiUser.sortName.split(' ');
    var firstName = name.shift();
    var lastName = name.pop();

    apiUser.initials = firstName.charAt(0) + (lastName ? lastName.charAt(0) : firstName.charAt(1));
    
    apiUser.sortStatus = getUserStatusForSorting(apiUser.status);

    var result = users[userID];

    if(result === undefined){
      result = users[userID] = apiUser;
    }else{
      //replace Old result with new apiUser object
      safeReplaceObject(result, apiUser); 
    }
    $rootScope.$broadcast('user_update', userID);

    if(cachedPhotoLocations[userID] !== undefined){
      safeReplaceObject(cachedPhotoLocations[userID], apiUser && apiUser.photo && apiUser.photo.photo_small || {empty: true});
    }
  }

  function saveApiUsers ( apiUsers){
    angular.forEach(apiUsers, saveApiUser);
  }

  function getUserStatusForSorting ( status ){
    if(status){
      var expires = status.expires || status.was_online;
      if(expires){
        return expires;
      }
      var timeNow = tsNow(true) + serverTimeOffset;

      switch( status._){
        case 'userStatusRecently':
          return tsNow(true) + serverTimeOffset - 86400 * 3;
        case 'userStatusLastWeek':
          return tsNow(true) + serverTimeOffset - 86400 * 7;
        case 'userStatusLastMonth':
          return tsNow(true) + serverTimeOffset - 86400 * 30;
      }
    }
    return 0;
  }

  function getUser ( id ){
    if (angular.isObject(id)){
      return id;
    }
    return users[id] || {id : id , deleted: true, num: 1 };
  }

  function getSelf(){ return getUser(myID); }

  function hasUser(id){ return angular.isObject(users[id]);}

  function getUserPhoto ( id , placeholder ){
    var user = getUser(id);
    
    if(id == 333000) {
      return {
        placeholder : 'img/placeholders/' //default placeholder
      }
    };

    if(cachedPhotoLocations[id] === undefined){
      cachedPhotoLocations[id] = user && user.photo && user.photo.photo_small || { empty : true};
    }

    return {
      num : user.num,
      placeholder : 'img/placeholders/'+ user.num + '.png',
      location : cachedPhotoLocations[id]
    };
  }
  
  function getUserString( id){
    var user = getUser(id);
    return 'u' + id + (user.access_hash ? '_' + user.access_hash : '');
  }


  function getUserInput(id){
    var user = getUser(ID);
    if (user._ == 'userSelf'){
      return { _: 'inputUserSelf'};
    }
    return {
      _: 'inputUserForeign',
      user_id: id,
      access_hash: user.access_hash || 0
    };
  }

  function updateUserStatuses (){
    var timeNow = tsNow(true) + serverTimeOffset;
    angular.forEach( users, function(user) {
      if(user.status && user.status._ === 'userStatusOnline' &&
        user.status.expires < timeNow){
        user.status = user.status.wasStatus || 
        { _: 'userStatusOffline', was_online: user.status.expires };
        delete user.status.wasStatus;

        $rootScope.$broadcast('user_update', user.id);
      }
    });
  }

  function setUserStatus ( userID, offline){
    var user = users(userID);
    if(user){
      var status = offline ? {
        _:'userStatusOffline',
        was_online : tsNow(true) + serverTimeOffset }
        :
        {
          _:'userStatusOnline',
          expires: tsNow(true) + serverTimeOffset + 500
        };
      user.status = status;
      user.sortStatus = getUserStatusForSorting(user.status);

      $rootScope.$broadcast('user_update', userID);
    }
  }


  function forceUserOnline (id){
    var user = getUser(id);
    if(user && user.status && user.status._ != 'userStatusOnline'
      && user.status._ != 'userStatusEmpty'){

      var wasStatus;
      if(user.status._ != 'userStatusOffline'){
        delete user.status.wasStatus;
        wasStatus != angular.copy(user.status);
      }
      user.status = {
        _: 'userStatusOnline',
        expires: tsNow(true) + serverTimeOffset + 60,
        wasStatus: wasStatus
      };
      user.sortStatus = getUserStatusForSorting(user.status);

      $rootScope.$broadcast('user_update', id);
    }
  }

  function wrapForFull (id){
    var user = getUser(id);

    return user;
  }

  function openUser (userID , override){
    var scope = $rootScope.$new();
    scope.userID = userID;
    scope.override = override || {};

    var modalInstance = $modal.open({
      templateUrl: templateUrl('user_modal'),
      controller: 'UserModalController',
      scope: scope,
      windowClass: 'user_modal_window mobile_modal'
    }); 
  }

  function importContact (phone, username){
    return ApiManager.invokeApi('contacts.importContacts', 
    {
      contacts : [{
        _: 'inputPhoneContact',
        client_id: '1',
        phone: phone,
        username: username
      }],
      replace : false
    }).then(function (results){
      saveApiUsers(results.users);

      var gotUserID = false;
      angular.forEach(results.imported, function(importedContact) {
        onContactUpdated(gotUserID = importedContact.user_id, true);
      });

      return gotUserID || false;
    });
  }

  function importContacts (contacts) {
    var inputContacts = [],
        i, j;

    for (i = 0; i < contacts.length; i++) {
      for (j = 0; j < contacts[i].phones.length; j++) {
        inputContacts.push({
          _: 'inputPhoneContact',
          client_id: (i << 16 | j).toString(10),
          phone: contacts[i].phones[j],
          username: contacts[i].username
        });
      }
    }

    return ApiManager.invokeApi('contacts.importContacts', {
      contacts: inputContacts,
      replace: false
    }).then(function (importedContactsResult) {
      saveApiUsers(importedContactsResult.users);

      var result = [];
      angular.forEach(importedContactsResult.imported, function (importedContact) {
        onContactUpdated(importedContact.user_id, true);
        result.push(importedContact.user_id);
      });

      return result;
    });
  }

  function deleteContacts ( userIDs){
    var ids = [];
    angular.forEach(userIDS, function(userID) {
      ids.push({_:'inputUserContact', user_id: userID})
    });
    return ApiManager.invokeApi('contacts.deleteContacts', {
      id: ids
    }).then(function(){
      angular.forEach(userIDs, function(userID) {
        onContactUpdated(userID, false);
      });
    });
  }

  function onContactUpdated (userID, isContact){
    if(angular.isArray(contactsList)){
      var curPosition = curIsContact = contactsList.indexOf(parseInt(userID)),
          curIsContact= curPosition != -1;

      if(isContact != curIsContact){
        if (isContact) {
          contactsList.push(userID);
          SearchIndexManager.indexObject(userID, getUserSearchText(userID), contactsIndex)
        }else{
          contactsList.splice(curPosition, 1);
        }

        $rootScope.$broadcast('contact_update', userID);
      }
    }
  }


  $rootScope.$on('apiUpdate', function(e, update){
    switch (update._){

      case 'updateUserStatus':
        var userID = update.user_id,
            user = users[userID];
        if(user){
          user.status = update.status;
          user.sortStatus = getUserStatusForSorting(user.status);

          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updataUserPhoto':
        var userID = update.user_id;
        if(users[userID]){
          forceUserOnline(userID);
          safeReplaceObject(user[userID].photo , update.photo);

          if(cachedPhotoLocations[userID] !== undefined){
            safeReplaceObject(cachedPhotoLocations[userID], update.photo && update.photo.photo_small || {empty: true});
          }

          $rootScope.$broadcast('user_update', userID);
        }
        break;

      case 'updateContactLink':
        onContactUpdated(update.user_id, update.my_link._ == 'contactLinkContact');
        break;
    }
  });

  setInterval(updateUserStatuses, 40000); //40 seconds

  return {
    getContacts: getContacts,
    saveApiUser: saveApiUser,
    saveApiUsers: saveApiUsers,
    getUser: getUser,
    getSelf: getSelf,
    getUserInput: getUserInput,
    setUserStatus: setUserStatus,
    forceUserOnline: forceUserOnline,
    getUserPhoto: getUserPhoto,
    getUserString: getUserString,
    getUserSearchText: getUserSearchText,
    hasUser: hasUser,
    deleteContacts: deleteContacts,
    wrapForFull: wrapForFull,
    openUser: openUser,
    resolveUsername: resolveUsername,
    importContact: importContact,
    importContacts: importContacts
  };

})

.service('StatusManager', function ($timeout, $rootScope, ApiManager, UsersManager) {

  var toPromise;
  var lastOnlineUpdated = 0;
  var started = false;
  var myID = 0;
  var myOtherDeviceActive = false;

  ApiManager.getUserID().then(function (id) {
    myID = id;
  });

  $rootScope.$on('apiUpdate', function (e, update) {
    if (update._ == 'updateUserStatus' && update.user_id == myID) {
      myOtherDeviceActive = tsNow() + (update.status._ == 'userStatusOnline' ? 300000 : 0);
    }
  });

  

  function start() {
    if (!started) {
      started = true;
      $rootScope.$watch('idle.isIDLE', checkIDLE);
      $rootScope.$watch('offline', checkIDLE);
    }
  }

  function sendUpdateStatusReq(offline) {
    var date = tsNow();
    if (offline && !lastOnlineUpdated ||
        !offline && (date - lastOnlineUpdated) < 50000 ||
        $rootScope.offline) {
      return;
    }
    lastOnlineUpdated = offline ? 0 : date;
    UsersManager.setUserStatus(myID, offline);
    return ApiManager.invokeApi('account.updateStatus', {
      offline: offline
    }, {noErrorBox: true});
  }

  function checkIDLE() {
    toPromise && $timeout.cancel(toPromise);
    if ($rootScope.idle.isIDLE) {
      toPromise = $timeout(function () {
        sendUpdateStatusReq(true);
      }, 5000);
    } else {
      sendUpdateStatusReq(false);
      toPromise = $timeout(checkIDLE, 60000);
    }
  }

  function isOtherDeviceActive() {
    if (!myOtherDeviceActive) {
      return false;
    }
    if (tsNow() > myOtherDeviceActive) {
      myOtherDeviceActive = false;
      return false;
    }
    return true;
  }

  return {
    start: start,
    isOtherDeviceActive: isOtherDeviceActive
  };

})

.service('RichTextProcessor', function($sce, $sanitize){
  var emojiMap = {},
      emojiData = Config.Emoji,
      emojiIconSize = 18,
      emojiSupported = navigator.userAgent.search(/OS X|iPhone|iPad|iOS|Android/i) != -1,
      enojiCode;

  var emojiRegex = '\\u0023\\u20E3|\\u00a9|\\u00ae|\\u203c|\\u2049|\\u2139|[\\u2194-\\u2199]|\\u21a9|\\u21aa|\\u231a|\\u231b|\\u23e9|[\\u23ea-\\u23ec]|\\u23f0|\\u24c2|\\u25aa|\\u25ab|\\u25b6|\\u2611|\\u2614|\\u26fd|\\u2705|\\u2709|[\\u2795-\\u2797]|\\u27a1|\\u27b0|\\u27bf|\\u2934|\\u2935|[\\u2b05-\\u2b07]|\\u2b1b|\\u2b1c|\\u2b50|\\u2b55|\\u3030|\\u303d|\\u3297|\\u3299|[\\uE000-\\uF8FF\\u270A-\\u2764\\u2122\\u25C0\\u25FB-\\u25FE\\u2615\\u263a\\u2648-\\u2653\\u2660-\\u2668\\u267B\\u267F\\u2693\\u261d\\u26A0-\\u26FA\\u2708\\u2702\\u2601\\u260E]|[\\u2600\\u26C4\\u26BE\\u23F3\\u2764]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83C[\\uDDE8-\\uDDFA\uDDEC]\\uD83C[\\uDDEA-\\uDDFA\uDDE7]|[0-9]\\u20e3|\\uD83C[\\uDC00-\\uDFFF]';

  for (emojiCode in emojiData) {
    emojiMap[emojiData[emojiCode][0]] = emojiCode;
  }

  var regexAlphaChars = "a-z" +
                        "\\u00c0-\\u00d6\\u00d8-\\u00f6\\u00f8-\\u00ff" + // Latin-1
                        "\\u0100-\\u024f" + // Latin Extended A and B
                        "\\u0253\\u0254\\u0256\\u0257\\u0259\\u025b\\u0263\\u0268\\u026f\\u0272\\u0289\\u028b" + // IPA Extensions
                        "\\u02bb" + // Hawaiian
                        "\\u0300-\\u036f" + // Combining diacritics
                        "\\u1e00-\\u1eff" + // Latin Extended Additional (mostly for Vietnamese)
                        "\\u0400-\\u04ff\\u0500-\\u0527" +  // Cyrillic
                        "\\u2de0-\\u2dff\\ua640-\\ua69f" +  // Cyrillic Extended A/B
                        "\\u0591-\\u05bf\\u05c1-\\u05c2\\u05c4-\\u05c5\\u05c7" +
                        "\\u05d0-\\u05ea\\u05f0-\\u05f4" + // Hebrew
                        "\\ufb1d-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40-\\ufb41" +
                        "\\ufb43-\\ufb44\\ufb46-\\ufb4f" + // Hebrew Pres. Forms
                        "\\u0610-\\u061a\\u0620-\\u065f\\u066e-\\u06d3\\u06d5-\\u06dc" +
                        "\\u06de-\\u06e8\\u06ea-\\u06ef\\u06fa-\\u06fc\\u06ff" + // Arabic
                        "\\u0750-\\u077f\\u08a0\\u08a2-\\u08ac\\u08e4-\\u08fe" + // Arabic Supplement and Extended A
                        "\\ufb50-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb" + // Pres. Forms A
                        "\\ufe70-\\ufe74\\ufe76-\\ufefc" + // Pres. Forms B
                        "\\u200c" +                        // Zero-Width Non-Joiner
                        "\\u0e01-\\u0e3a\\u0e40-\\u0e4e" + // Thai
                        "\\u1100-\\u11ff\\u3130-\\u3185\\uA960-\\uA97F\\uAC00-\\uD7AF\\uD7B0-\\uD7FF" + // Hangul (Korean)
                        "\\u3003\\u3005\\u303b" +           // Kanji/Han iteration marks
                        "\\uff21-\\uff3a\\uff41-\\uff5a" +  // full width Alphabet
                        "\\uff66-\\uff9f" +                 // half width Katakana
                        "\\uffa1-\\uffdc";                  // half width Hangul (Korean)

  var regexAlphaNumericChars  = "0-9\.\_" + regexAlphaChars;

  // Based on Regular Expression for URL validation by Diego Perini
  var urlRegex =  "((?:https?|ftp)://|mailto:)?" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // sindresorhus/ip-regex
      "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[" + regexAlphaChars + "0-9]+)" +
      // domain name
      "(?:\\.(?:[" + regexAlphaChars + "]-*)*[" + regexAlphaChars + "0-9]+)*" +
      // TLD identifier
      "(?:\\.(xn--[0-9a-z]{2,16}|[" + regexAlphaChars + "]{2,24}))" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:/(?:\\S*[^\\s.;,(\\[\\]{}<>\"'])?)?";

  var regExp = new RegExp('(^|\\s)((?:https?://)?telegram\\.me/|@)([a-zA-Z\\d_]{5,32})|(' + urlRegex + ')|(\\n)|(' + emojiRegex + ')|(^|\\s)(#[' + regexAlphaNumericChars + ']{2,64})', 'i');

  var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?youtu(?:|\.be|be\.com|\.b)(?:\/v\/|\/watch\\?v=|e\/|(?:\/\??#)?\/watch(?:.+)v=)(.{11})(?:\&[^\s]*)?/;
  var vimeoRegex = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  var instagramRegex = /^https?:\/\/(?:instagr\.am\/p\/|instagram\.com\/p\/)([a-zA-Z0-9\-\_]+)/i;
  var vineRegex = /^https?:\/\/vine\.co\/v\/([a-zA-Z0-9\-\_]+)/i;
  var twitterRegex = /^https?:\/\/twitter\.com\/.+?\/status\/\d+/i;
  var facebookRegex = /^https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:.+?\/posts\/\d+|(?:story\.php|permalink\.php)\?story_fbid=(\d+)(?:&substory_index=\d+)?&id=(\d+))/i;
  var gplusRegex = /^https?:\/\/plus\.google\.com\/\d+\/posts\/[a-zA-Z0-9\-\_]+/i;
  var soundcloudRegex = /^https?:\/\/(?:soundcloud\.com|snd\.sc)\/([a-zA-Z0-9%\-\_]+)\/([a-zA-Z0-9%\-\_]+)/i;
  var spotifyRegex = /(https?:\/\/(open\.spotify\.com|play\.spotify\.com|spoti\.fi)\/(.+)|spotify:(.+))/i;

  function wrapPlainText (text, options) {
    if (emojiSupported) {
      return text;
    }
    if (!text || !text.length) {
      return '';
    }

    options = options || {};

    text = text.replace(/\ufe0f/g, '', text);

    var match,
        raw = text,
        text = [],
        emojiTitle;

    while ((match = raw.match(regExp))) {
      text.push(raw.substr(0, match.index));

      if (match[8]) {
        if ((emojiCode = emojiMap[match[8]]) &&
            (emojiTitle = emojiData[emojiCode][1][0])) {
          text.push(':' + emojiTitle + ':');
        } else {
          text.push(match[0]);
        }
      } else {
        text.push(match[0]);
      }
      raw = raw.substr(match.index + match[0].length);
    }
    text.push(raw);

    return text.join('');
  }

  function getEmojiSpritesheetCoords(emojiCode) {
    var i, row, column, totalColumns;
    for (var cat = 0; cat < Config.EmojiCategories.length; cat++) {
      totalColumns = Config.EmojiCategorySpritesheetDimens[cat][1];
      i = Config.EmojiCategories[cat].indexOf(emojiCode);
      if (i > -1) {
        row = Math.floor(i / totalColumns);
        column = (i % totalColumns);
        return { category: cat, row: row, column: column };
      }
    }
    console.error('emoji not found in spritesheet', emojiCode);
    return null;
  }

  function wrapRichText(text, options) {
    if (!text || !text.length) {
      return '';
    }

    options = options || {};

    var match,
        raw = text,
        html = [],
        url,
        emojiFound = false,
        emojiTitle,
        emojiCoords;

    // var start = tsNow();

    while ((match = raw.match(regExp))) {
      html.push(encodeEntities(raw.substr(0, match.index)));

      if (match[3]) { // telegram.me links
        if (!options.noLinks) {
          var attr = '';
          if (options.highlightUsername &&
              options.highlightUsername.toLowerCase() == match[3].toLowerCase() &&
              match[2] == '@') {
            attr = 'class="im_message_mymention"';
          }
          html.push(
            match[1],
            '<a ' + attr + ' href="#/im?p=',
            encodeURIComponent('@' + match[3]),
            '">',
            encodeEntities(match[2] + match[3]),
            '</a>'
          );
        } else {
          html.push(
            match[1],
            encodeEntities(match[2] + match[3])
          );
        }
      }
      else if (match[4]) { // URL & e-mail
        if (!options.noLinks) {
          if (emailRegex.test(match[4])) {
            html.push(
              '<a href="',
              encodeEntities('mailto:' + match[4]),
              '" target="_blank">',
              encodeEntities(match[4]),
              '</a>'
            );
          } else {
            var url = false,
                protocol = match[5],
                tld = match[6],
                excluded = '';

            if (tld) {
              if (!protocol && (tld.substr(0, 4) === 'xn--' || Config.TLD.indexOf(tld.toLowerCase()) !== -1)) {
                protocol = 'http://';
              }

              if (protocol) {
                var balanced = checkBrackets(match[4]);

                if (balanced.length !== match[4].length) {
                  excluded = match[4].substring(balanced.length);
                  match[4] = balanced;
                }

                url = (match[5] ? '' : protocol) + match[4];
              }
            } else { // IP address
              url = (match[5] ? '' : 'http://') + match[4];
            }

            if (url) {
              html.push(
                '<a href="',
                encodeEntities(url),
                '" target="_blank">',
                encodeEntities(match[4]),
                '</a>',
                excluded
              );

              if (options.extractUrlEmbed &&
                  !options.extractedUrlEmbed) {
                options.extractedUrlEmbed = findExternalEmbed(url);
              }
            } else {
              html.push(encodeEntities(match[0]));
            }
          }
        } else {
          html.push(encodeEntities(match[0]));
        }
      }
      else if (match[7]) { // New line
        if (!options.noLinebreaks) {
          html.push('<br/>');
        } else {
          html.push(' ');
        }
      }
      else if (match[8]) {
        if ((emojiCode = emojiMap[match[8]]) &&
            (emojiCoords = getEmojiSpritesheetCoords(emojiCode))) {

          emojiTitle = encodeEntities(emojiData[emojiCode][1][0]);
          emojiFound = true;
          html.push(
            '<span class="emoji emoji-',
            emojiCoords.category,
            '-',
            (emojiIconSize * emojiCoords.column),
            '-',
            (emojiIconSize * emojiCoords.row),
            '" ',
            'title="',emojiTitle, '">',
            ':', emojiTitle, ':</span>'
          );
        } else {
          html.push(encodeEntities(match[8]));
        }
      }
      else if (match[10]) {
        if (!options.noLinks) {
          html.push(
            encodeEntities(match[9]),
            '<a href="#/im?q=',
            encodeURIComponent(match[10]),
            '">',
            encodeEntities(match[10]),
            '</a>'
          );
        } else {
          html.push(
            encodeEntities(match[9]),
            encodeEntities(match[10])
          );
        }
      }
      raw = raw.substr(match.index + match[0].length);
    }

    html.push(encodeEntities(raw));

    // var timeDiff = tsNow() - start;
    // if (timeDiff > 1) {
    //   console.log(dT(), 'wrap text', text.length, timeDiff);
    // }

    text = $sanitize(html.join(''));

    // console.log(3, text, html);

    if (emojiFound) {
      text = text.replace(/\ufe0f|&#65039;/g, '', text);
      text = text.replace(/<span class="emoji emoji-(\d)-(\d+)-(\d+)"(.+?)<\/span>/g,
                          '<span class="emoji emoji-spritesheet-$1" style="background-position: -$2px -$3px;" $4</span>');
    }

    return $sce.trustAs('html', text);
  }

  function checkBrackets(url) {
    var urlLength = url.length,
        urlOpenBrackets = url.split('(').length - 1,
        urlCloseBrackets = url.split(')').length - 1;

    while (urlCloseBrackets > urlOpenBrackets &&
           url.charAt(urlLength - 1) === ')') {
      url = url.substr(0, urlLength - 1);
      urlCloseBrackets--;
      urlLength--;
    }
    if (urlOpenBrackets > urlCloseBrackets) {
      url = url.replace(/\)+$/, '');
    }
    return url;
  }

  function findExternalEmbed(url) {
    var embedUrlMatches,
        result;

    if (embedUrlMatches = url.match(youtubeRegex)) {
      return ['youtube', embedUrlMatches[1]];
    }
    if (embedUrlMatches = url.match(vimeoRegex)) {
      return ['vimeo', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(instagramRegex)) {
      return ['instagram', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(vineRegex)) {
      return ['vine', embedUrlMatches[1]];
    }
    else if (embedUrlMatches = url.match(soundcloudRegex)) {
      var badFolders = 'explore,upload,pages,terms-of-use,mobile,jobs,imprint'.split(',');
      var badSubfolders = 'sets'.split(',');
      if (badFolders.indexOf(embedUrlMatches[1]) == -1 &&
          badSubfolders.indexOf(embedUrlMatches[2]) == -1) {
        return ['soundcloud', embedUrlMatches[0]];
      }
    }
    else if (embedUrlMatches = url.match(spotifyRegex)) {
      return ['spotify', embedUrlMatches[3].replace('/', ':')];
    }

    if (!Config.Modes.chrome_packed) { // Need external JS
      if (embedUrlMatches = url.match(twitterRegex)) {
        return ['twitter', embedUrlMatches[0]];
      }
      else if (embedUrlMatches = url.match(facebookRegex)) {
        if (embedUrlMatches[2]!= undefined){
          return ['facebook', "https://www.facebook.com/"+embedUrlMatches[2]+"/posts/"+embedUrlMatches[1]];
        }
        return ['facebook', embedUrlMatches[0]];
      }
      // Sorry, GPlus widget has no `xfbml.render` like callback and is too wide.
      // else if (embedUrlMatches = url.match(gplusRegex)) {
      //   return ['gplus', embedUrlMatches[0]];
      // }
    }

    return false;
  }

  return {
    wrapRichText: wrapRichText,
    wrapPlainText: wrapPlainText
  };
})

.service('PeerManager', function(UsersManager, ChatsManager, ApiManager){
  return {
    getPeer : function(peerID){
      return peerID > 0
       ? UsersManager.getUser(peerID) 
       : ChatsManager.getChat(-peerID);
    },
    getPeerID : function (peerString){
      if(angular.isObject(peerString)){
        return peerString.user_id ? peerString.user_id : -peerString.chat_id;
      }

      var isUser = peerString.charAt(0) == 'u',
        peerParams = peerString.substr(1).split('_');

      return isUser ? peerParams[0]: -peerParams[0] || 0;
    },

    getPeerPhoto : function ( peerID, userThumbnail, chatPlaceHolder){
      return peerID > 0 
      ? UsersManager.getUsersPhoto(peerID, userThumbnail)
      : ChatsManager.getChatPhoto(peerID, chatPlaceholder);
    },
    getPeerString : function (peerID){
      if(peerID > 0){
        return UsersManager.getUserString(peerID);
      }
      return ChatManager.getChatString(-peerID);
    },
    getInputPeer : function (peerString){
      var isUser = peerString.charAt(0) == 'u',
          peerParams = peerString.substr(1).split('_');

      return isUser ? 
      { _ : 'inputPeerUser', user_id : peerParams[0], access_hash: peerParams[1]}
      :{ _: 'inputPeerChat', chat_id : peerParams[0]};
    },
    getInputPeerByID : function (peerID){
      if(peerID > 0){
        return {
          _: 'inputPeerUser',
          user_id: peerID,
          access_hash: UsersManager.getUser(peerID).access_hash || 0
        };
      }
      else if (peerID < 0){
        return {
          _: 'inputPeerChat',
          chat_id: -peerID
        };
      }
    },
    getOutputPeer : function (peerID){
      return peerID > 0 
        ? { _: 'peerUser', user_id: peerID}
        : { _: 'peerChat', chat_id: -peerID};
    }

  }
})

.service('PeersSelectService', function ($rootScope, $modal) {

  function selectPeer (options) {
    var scope = $rootScope.$new();
    scope.multiSelect = false;
    scope.noMessages = true;
    if (options) {
      angular.extend(scope, options);
    }

    return $modal.open({
      templateUrl: templateUrl('peer_select'),
      controller: 'PeerSelectController',
      scope: scope,
      windowClass: 'peer_select_window mobile_modal',
      backdrop: 'single'
    }).result;
  }

  function selectPeers (options) {
    return selectPeer(options).then(function (peerString) {
      return [peerString];
    });
  }

  return {
    selectPeer: selectPeer,
    selectPeers: selectPeers
  };
})

.service('ChatsManager', function ( $q, $modal, $rootScope, ApiFileManager, ApiManager, UsersManager, RichTextProcessor, PhotosManager ){
  var chats = {},
      chatsFull = {},
      chatsFullPromises = {},
      cachedPhotoLocations = {};

  function saveApiChats ( apiChats){
    angular.forEach(apiChats , saveApiChat);
  }

  function saveApiChat(apiChat){
    if(!angular.isObject(apiChat)){
      return;
    }
    apiChat.rTitle =  RichTextProcessor.wrapRichText(apiChat.title,
     { noLinks: true, noLinebreaks:true }) || _('chat_title_deleted');

    var titleWords = SearchIndexManager.cleanSearchText(apiChat.title || '').split(' ');
    var firstWord = titleWords.shift();
    var lastWord = titleWords.pop();
    apiChat.initials = firstWord.charAt(0) + (lastWord ? lastWord.charAt(0) : firstWord.charAt(1));
    apiChat.num = (Math.abs(apiChat.id >> 1) % 4) +1;

    if(chats[apiChat.id] === undefined){
      chats[apiChat.id] = apiChat;
    }else{
      safeReplaceObject(chats[apiChat.id], apiChat);
      $rootScope.$broadcast('cha_update', apiChat.id);
    }

    if(cachedPhotoLocations[apiChat.id] !== undefined){
      safeReplaceObject(cachedPhotoLocations[apiChat.id], apiChat && apiChat.photo && apiChat.photo_small || {empty : true});
    }
  }

  function getChat(id){
    return chats[id] || {id : id , deleted: true};
  }

  function getChatFull(id){
    if (chatsFull[id] !== undefined) {
      if(chats[id].version == chatsFull[id].participants.version ||
        chats[id].left){
        return $q.when(chatsFull[id]);
      }
    }

    if(chatsFullPromises[id]!== undefined){
      return chatsFullPromises[id];
    }
    //
    //get full chat from the server.
    return chatsFullPromises[id] = ApiManager.invokeApi('messages.getFullChat', { chat_id:id})
    .then(function(result){
      saveApiChats(result.chats);
      UsersManager.saveApiUsers(result.users);
      if (result.full_chat && result.full_chat.chat_photo.id) {
        PhotosManager.savePhoto(result.full_chat.chat_photo);
      }
      delete chatsFullPromises[id];
      $rootScope.$broadcast('chat_full_update', id);

      return chatsFull[id] = result.full_chat;
    });
  }

  function hasChat(id){
    return angular.isObject(chats[id]);
  }

  function getChatPhoto(id, placeholder){
    var chat = getChat(id);
    if(cachedPhotoLocations[id] === undefined){
      cachedPhotoLocations[id] = chat && chat.photo && chat.photo.photo_small || { empty : true };
    }
    return {
      placeholder : 'img/placeholders/',
      location : cachedPhotoLocations[id]
    };
  }

  function getChatString( id ){
    var chat = getChat(id);
    return 'g'+id;
  }

  function wrapForFull (id, fullChat){

  }
  function openChat (chatID, accessHash){
    var scope = $rootScope.$new();
    scope.chatID = chatID;

    var modalInstance = $modal.open({
      templateUrl : templateUrl('chat_modal'),
      controller : 'ChatModalController',
      scope : scope,
      windowClass : 'chat_modal_window mobile_modal'
    });
  }

  $rootScope.$on('apiUpdate', function (e, update) {
    // console.log('on apiUpdate', update);
    switch (update._) {
      case 'updateChatParticipants':
        var participants = update.participants;
        var chatFull = chatsFull[participants.id];
        if (chatFull !== undefined) {
          chatFull.participants = update.participants;
          $rootScope.$broadcast('chat_full_update', chatID);
        }
        break;

      case 'updateChatParticipantAdd':
        var chatFull = chatsFull[update.chat_id];
        if (chatFull !== undefined) {
          var participants = chatFull.participants.participants || [];
          for (var i = 0, length = participants.length; i < length; i++) {
            if (participants[i].user_id == update.user_id) {
              return;
            }
          }
          participants.push({
            _: 'chatParticipant',
            user_id: update.user_id,
            inviter_id: update.inviter_id,
            date: tsNow(true)
          });
          chatFull.participants.version = update.version;
          $rootScope.$broadcast('chat_full_update', update.chat_id);
        }
        break;

      case 'updateChatParticipantDelete':
        var chatFull = chatsFull[update.chat_id];
        if (chatFull !== undefined) {
          var participants = chatFull.participants.participants || [];
          for (var i = 0, length = participants.length; i < length; i++) {
            if (participants[i].user_id == update.user_id) {
              participants.splice(i, 1);
              chatFull.participants.version = update.version;
              $rootScope.$broadcast('chat_full_update', update.chat_id);
              return;
            }
          }
        }
        break;
    }
  });
})

.service('ProfileManager', function(UsersManager, ChatsManager, PhotosManager, ApiManager, RichTextProcessor){
  return {
    getProfile : getProfile
  };

  function getProfile (id, override){
    return ApiManager.invokeApi('users.getFullUser', {id: UsersManager.getUserInput(id)})
    .then(function(results){
      if(override && override.phone_number){
        results.user.phone = override.phone_number;
        if(override.username){
          results.user.username = override.username;
        }
        UsersManager.saveApiUser(results.user);
      }else{
        UsersManager.saveApiUser(results.user, true);
      }
      PhotosManager.savePhoto(results.profile_photo, {user_id:id});
      
      return results;
    });
  }
})
/*
.service('PhotosManager', function( $modal, $window, $rootScope, ApiManager, ApiFileManager, FileManager){

})*/

.service('ContactsService', function($q, Profile, ErrorService) { //$sce needed for photo urls
  return{
    getContacts: getContacts,
    findContact: findContact,
    pickContact: pickContact
  };

  function getContacts(){
    var deferred = $q.defer();
    var phonebook = [];
    try{
      function onSuccess(contact){
        if(!contact.length || contact.length === null ){
          return phonebookPromise = deferred.reject();
        }
        var defaults = [];
        defaults = Profile.getDefaultPhoto();
        var contacts = {};
        for ( var i = 0; i < contact.length; i++) {
          for(var j = 0; j< contact[i].phoneNumbers.length; j++){
            if(contact[i].phoneNumbers[j].number.indexOf('&')!= -1 ||
              contact[i].phoneNumbers[j].number.indexOf('#') != -1 || contact[i].phoneNumbers[j].number.indexOf(';')!= -1 ||
              contact[i].phoneNumbers[j].number.indexOf('*') != -1 || contact[i].phoneNumbers[j].number.indexOf(',') != -1||
              contact[i].phoneNumbers[j].number.indexOf('/') != -1 || contact[i].phoneNumbers[j].number.indexOf('.') != -1 )
             continue; 

            else{
              contacts = {
                id: i,
                name: contact[i].displayName !== null ? contact[i].displayName : " ",
                photo:  defaults, //contact[i].photos !== null ? contact[i].photos[0].value :
                phone: contact[i].phoneNumbers[j].number
              };
            }
            phonebook.push(contacts); 
          }

        }

        deferred.resolve(phonebook);
      }

      function onError( e ){
        console.log("PHONEBOOK ERROR OCCURED: "+e.stack);
        deferred.reject(e);
      }

      //var options = new ContactFindOptions();
      //options.multiple = true;
      //var fields = ["displayName", "phoneNumbers", "photos"];
      //var phoneBookPromise = navigator.contacts.find( fields, onSuccess, onError, options);

      var phonebookPromise = navigator.contactsPhoneNumbers.list(onSuccess, onError);
      return phonebookPromise = deferred.promise; 
    }
    catch(e){
      return $q.reject(e);   
    }
  }

  function findContact ( param ){
    var deferred = $q.defer();
    var contact = [];
    try{
      var contactPromise = getContacts().then(function(phonebook){
        contact = _.find( phonebook, { "phone" : param });
        deferred.resolve(contact);
      },
      function(error){
        deferred.reject(error);
      });

      return contactPromise = deferred.promise;

    }catch(e){
      return $q.reject(e);
    }
  }

  function pickContact(){
    var deferred = $q.defer();
    try {
      var contactPromise  = navigator.contacts.pickContact(function(contact){
        deferred.resolve(contact);
      } , function(error){
        deferred.reject(error);
      });

      return contactPromise = deferred.promise;
    }catch(e){
      $q.reject(e);
    }
  }
})

.service('ContactsSelectService', function ($rootScope, $modal) {

  function select (multiSelect, options) {
    options = options || {};

    var scope = $rootScope.$new();
    scope.multiSelect = multiSelect;
    angular.extend(scope, options);
    if (!scope.action && multiSelect) {
      scope.action = 'select';
    }

    return $modal.open({
      templateUrl: templateUrl('contacts_modal'),
      controller: 'ContactsModalController',
      scope: scope,
      windowClass: 'contacts_modal_window mobile_modal',
      backdrop: 'single'
    }).result;
  }


  return {
    selectContacts: function (options) {
      return select (true, options);
    },
    selectContact: function (options) {
      return select (false, options);
    }
  }
})

.service('CameraService', function($q, $window, ErrorService ){

  return {
    takePicture: takePicture,
    getPicture : getPictureFromGallery,
    getManyPics: getManyPictures,
    captureVideo: captureVideo
  };

  function captureVideo(options){
    var deferred = $q.defer();
    options = options || {};
    options.limit = 1;
    options.correctOrientation = true;
    try{
      var videoCapturePromise = navigator.device.capture.captureVideo(
        function captureSuccess(video){
          deferred.resolve(video);
        },
        function captureError(error){
          deferred.reject(error);
        },options);

      return videoCapturePromise = deferred.promise;

    }catch(e){
      return $q.reject(e);
    }
  }
  function takePicture(options){
    options = options || {};
    options = {
      quality: 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      //allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 250,
      targetHeight: 250,
      popoverOptions: CameraPopoverOptions,
      ContentType: 'image/jpeg',
      correctOrientation: true,
      saveToPhotoAlbum: true
    };

    var deferred = $q.defer();
    try{

      var cameraPromise = navigator.camera.getPicture(
        function cameraSuccess(imageData){
          var image = "data:image/jpeg;base64," + imageData;
          deferred.resolve(image);
        }, 
        function cameraError(e){
          deferred.reject(e);
        }, options);
      return cameraPromise  = deferred.promise;

    }catch(e){
      ErrorService.alert("Somethings wrong with your camera", "Oops...", "OK");
      deferred.reject(e);
    }
  }

  function getPictureFromGallery(){
    var deferred = $q.defer();
    try{

      var picturePromise = navigator.camera.getPicture(
        function onSucess( imageData ){
          deferred.resolve(imageData);
        }, 
        function onFail( message ){
          deferred.reject(message);
        }, {
          destinationType: Camera.DestinationType.DATA_URL,
          sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
          popoverOptions: new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY)
        });


      window.onorientationchange = function() {
        var cameraPopoverOptions = new CameraPopoverOptions(0, 0, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY);
        cameraPopoverHandle.setPosition(cameraPopoverOptions);
      };

      if(picturePromise){
        navigator.camera.cleanup(
          function onSuccess(){ ErrorService.alert('Cleaned up the camera... twas really dirty!', 'Yeah!', 'OK');},
          function onFail(e){ ErrorService.alert('Housekeeping issue: '+e, 'Oops', 'OK');
        });
      }
      return picturePromise = deferred.promise;
    }
    catch(e){
      ErrorService.alert('Weird! Could not retrieve pic','Oops', 'OK');
      return $q.reject(e);
    }
  }

  function getManyPictures(options){
    options = options || {};
    options.maximumImagesCount = 100;

    var deferred = $q.defer();
    var images = [];
    try{
      
      var imagePickerPromise = window.imagePicker.getPictures(
      function(results){
        for(var i = 0; i < results.length; i++){
          images.push(results[i]);
        }
        deferred.resolve(images);
      },
      function(error){
        deferred.reject(error);
      }, options);
      return imagePickerPromise = deferred.promise;

    }catch(e){
      return $q.reject(e);
    }
  }
})

.service('VideoService', function( $q ){
  //TBD
  var deferred = $q.defer(),
      promise  = deferred.promise;

  //handle the data for me please.. thanx :-P
  promise.success = function(data){
    promise.then(data);
    return promise;
  };
  promise.error = function(fn){
    promise.then(null, fn);
    return promise;
  };
  return{
    saveVideo: function(data){
      createFileEntry(data[0].localURL);
      return promise;
    }
  };

  //resolve localURL to local file and start copying 
  function createFileEntry(fileURI){
    window.resolveLocalFileSystemURL(fileURI, function(localURL){
      var name = localURL.fullPath.substr(localURL.fullPath.lastIndexOf('/')+1);
      var newName = nextRandomInt(0XFFFFFFFF) + name;
      
      //copy recorded video to app directory
      window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
      function( fileSystem2 ){
        localURL.copyTo( fileSystem2, newName, function(success){

          return onCopySuccess(success);

        }, function(error){
          deferred.reject(error);
        });
      },
      function(error){
        deferred.reject(error);
      });
    }, 
    function(error){
      deferred.reject(error);
    });
  }

  //called on successful copying. create thumbnail for video.
  //window.PKVideoThumbnail.createThumbnail ( sourceVideoPath, targetThumbnailPath, success, failure );
  
  function onCopySuccess(entry){
    var name = entry.nativeURL.slice(0, -4);
    window.VideoThumbnail.getThumbnail(function (imageData){
      //generate url to local video file.
      //var correctURL = imageData.slice(0, -4);
      //correctURL += '.mp4';
      //deferred.resolve(correctURL);

      var imageSrc = "data:image/jpeg;base64," + imageData;
      deferred.resolve(imageSrc);
    },
    function (err){
      deferred.reject(err);
    }, entry.nativeURL);
  }
})

.service('AudioService', function($cordovaCapture, $q, $sce, ErrorService, ApiFileManager ){
  
  var audios = {};
  var audiosForHistory = {};

  return {
    captureAudio : captureAudio,
    saveAudioFile : saveAudioFile,
    downloadAudio : downloadAudio,
    wrapForHistory: wrapForHistory,
    saveAudio : saveAudio
  };

  function saveAudio (apiAudio) {
    audios[apiAudio.id] = apiAudio;
  }

  function wrapForHistory (audioID) {
    if (audiosForHistory[audioID] !== undefined) {
      return audiosForHistory[audioID];
    }

    var audio = angular.copy(audios[audioID]);

    return audiosForHistory[audioID] = audio;
  }

  function saveAudioFile( audioID){
    var audio = audios[audioID],
        mimeType = audio.mime_type || 'audio/ogg',
        fileExt  = mimeType.split('.')[1] || 'ogg',
        fileName = 'audio'+ audioID +'.'+ fileExt,
        historyAudio = audioForHistory[audioID] || audio || {};

    FileManager.chooseSave(fileName, fileExt, mimeType).then(function(writeFileEntry){
      if(writeFileEntry){
        downloadAudio(audioID, writeFileEntry);
      }
    }, function(){
      downloadAudio(audioID).then(function(audioBlob){
        FileManager.download(audioBlob , mimeType, fileName);
      });
    });
  }

  function captureAudio(options){
    options = options || {};
    options.limit = 1;
    var deferred = $q.defer();
    var audioPromise = $cordovaCapture.captureAudio(options).then(function(audio){
      deferred.resolve(audio);
    },function(error){
      return deferred.reject(error);
    });

    return audioPromise = deferred.promise;
  }

  function downloadAudio( audioID, toFileEntry ){
    var audio = audios[audioID],
        audioHistory = audioForHistory[audioID] || audio || {},
        mimeType = audio.mime_type || 'audio/ogg',
        inputFileLocation = {
          _:'inputAudioFileLocation',
          id : audioID,
          access_hash : audio.access_hash
        };

    if( audioHistory.downloaded && !toFileEntry ){
      var cachedBlob = ApiFileManager.getCachedFile(inputFileLocation);
      if(cachedBlob){
        return promises.when(cachedBlob);
      }
    }

    audioHistory.progress = {
      enabled : !audioHistory.downloaded,
      percent : 1,
      total   : audio.size
    };

    var downloadPromise = ApiFileManager.downloadFile(audio.dc_id, inputFileLocation, audio.size, 
    {
      mime : mimeType,
      toFileEntry : toFileEntry
    });

    downloadPromise.then(function(audioBlob){
      FileManager.getFileCorrectURL(audioBlob , mimeType).then(function(url){
            audioHistory.url = $sce.trustAsResourceUrl(url);
      });
      delete audioHistory.progress;
      audioHistory.downloaded = true;
      console.log('audio save done');
    }, function(e){
          console.log('audio download failed' , e);
          audioHistory.progress.enabled = false;
    }, function(progress){
          console.log('dl progress', progress);
          audioHistory.progress.enabled = true;
          audioHistory.progress.done =progress.done;
          audioHistory.progress.percent = Math.max(1, Math.floor(100 * progress.done / progress.total))
          $rootScope.$broadcast('history_update');
    });

    audioHistory.progress.cancel = downloadPromise.cancel;

    return downloadPromise;
  }

  function updateAudioDownloaded (audioID) {
    var audio = audios[audioID],
        historyAudio = audiosForHistory[audioID] || audio || {},
        inputFileLocation = {
          _: 'inputAudioFileLocation',
          id: audioID,
          access_hash: audio.access_hash
        };

    // historyAudio.progress = {enabled: !historyAudio.downloaded, percent: 10, total: audio.size};

    if (historyAudio.downloaded === undefined) {
      ApiFileManager.getDownloadedFile(inputFileLocation, audio.size).then(function () {
        historyAudio.downloaded = true;
      }, function () {
        historyAudio.downloaded = false;
      });
    }
  }
})

.service('promises', function(){
  return {
    when: function(result){
      return { then: function(callback){
        return callback(result);
      }};
    },
    reject: function(result){
      return{ then: function(cb, thecb){
        return thecb(result);
      }};
    }
  };
})

.provider('Storage', function(){
  this.setPrefix = function (prefix){
    TellefileStorage.prefix(prefix); 
  };
  this.$get = ['$q', function($q){
    var protocol_methods = {};
    angular.forEach([ 'set', 'get', 'remove'] , function(method){
      protocol_methods[method] = function(){
        var deferred = $q.defer(),
            args = Array.prototype.slice.call(arguments);
        args.push(function(result){
          deferred.resolve(result);
        });
        TellefileStorage[method].apply(TellefileStorage, args);

        return deferred.promise;
      };  
    });
    return protocol_methods;
  }];
})


.service('FileManager', function($window, $q, $timeout, promises){
  $window.URL = $window.URL || $window.webkitURL;
  $window.BlobBuilder = $window.BlobBuilder || $window.WebKitBlobBuilder || $window.MozBlobBuilder;
  var unknownBlob = navigator.userAgent.indexOf('Safari') != -1 &&
                         navigator.userAgent.indexOf('Chrome') == -1;
  var blobSupported = true;

  try{
    createBlob([], '');
  }
  catch(e){
    blobSupported  = false;
  }

  function isBlobPresent(){
    return blobSupported;
  }
  function fileCopy(fromFile, toFile){
    return getFileWriter(toFile).then(function(fileWriter){
      return fileWriteData(fileWriter, fromFile).then(function(){
        return fileWriter;
      }, function(error){
        return $q.reject(error);
        fileWriter.truncate(0);
      });
    });
  }

  function fileWriteData(fileWriter, bytes){
    var deferred = $q.defer();

    fileWriter.onwriteend = function(e){
      deferred.resolve();
    };
    fileWriter.onerror = function(e){
      deferred.reject(e);
    };

    if(bytes.file) {
      bytes.file(function(file){
        fileWriter.write(file);
      }, function(err){
        deferred.reject(err);
      });
    }
    //if is file of bytes
    else if (bytes instanceof Blob) {
      fileWriter.write(bytes);
    }
    else{
      try{
        var blob = createBlob([bytesToArrayBuffer(bytes)]);
        fileWriter.write(blob);
      }
      catch(e){
        deferred.reject(e);
      }
    }

    return deferred.promise;
  }

  function chooseSaveFile(fileName, ext, mimeType){
    var deferred = $q.defer();

  }
  function getFileWriter(entry){
    var deferred = $q.defer();

    entry.createWriter(function(fileWriter){
      deferred.resolve(fileWriter);
    },
    function(err){
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function getFakeFileWriter(mimeType, save_fileCallback){
    var blobParts = [];
    var fakeFileWriter = {
      write: function(blob){
        if (!blobSupported) {
          if (fakeFileWriter.onerror) {
            fakeFileWriter.onerror(new Error('Blob not supported'));
          }
          return false;
        }
        blobParts.push(blob);

        setZeroTimeout(function(){
          if(getFakeFileWriter.onwriteend){
           fakeFileWriter.onwriteend();
          }
        });
      },
      truncate: function(){
        blobParts = [];
      },
      finalize: function(){
        var blob = blobConstruct(blobParts, mimeType);
        if(save_fileCallback){
          save_fileCallback(blob);
        }
        return blob;
      }

    };
  
    return fakeFileWriter;  
  }

  function getUrl(fileData, mime){
    //
    if(fileData.toURL(mime)){
      return fileData.toURL(mime);
    }
    if (fileData instanceof Blob) {
      return URL.createObjectURL(data);
    }
    return 'data'+mime+';base64,'+bytesToBase64(fileData);
  }
  
  function getByteArray(fileData){
    if(fileData instanceof Blob){
      var deferred = $q.defer();
      try{
        var reader = new FileReader();
        reader.onloadend = function(e){
          deferred.resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = function(e){
          deferred.reject(e);
        };
        reader.readAsArrayBuffer(fileData);

        return deferred.promise;
      }
      catch(error){
        return $q.reject(error);    
      }
    }
    return $q.when(fileData);
  }  

  function getDataUrl(blob){
    var deferred;

    try{
      var reader = new FileReader();
      reader.onloadend = function(){
        deferred.resolve(reader.result);
      }
      reader.readAsDataURL(blob);
    }catch(e){
      return $q.reject(e);
    }
  }

  function getFileCorrectURL(blob, mime){
    if(unknownBlob && blob instanceof Blob){
      var mimeType = blob.type || blob.mimeType || mime || '';
      if(!mimeType.match(/image\/(jgep|gif|bmp)|video\/quicktime/)){
        return getDataUrl(blob);
      }
    }
    return promises.when(getUrl(blob, mimeType));
  }

  function downloadFile (blob, mimeType, fileName) {
    if (window.navigator && navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, fileName);
      return false;
    }

    if (window.navigator && navigator.getDeviceStorage) {
      var storageName = 'sdcard';
      switch (mimeType.split('/')[0]) {
        case 'video': storageName = 'videos'; break;
        case 'audio': storageName = 'music'; break;
        case 'image': storageName = 'pictures'; break;
        case 'application': storageName = 'application'; break;

      }
      var deviceStorage = navigator.getDeviceStorage(storageName);
      var request = deviceStorage.addNamed(blob, fileName);

      request.onsuccess = function () {
        console.log('Device storage result -->', this.result);
      };
      request.onerror = function () {
      };
      return;
    }

    var popup = false;
    if (window.safari) {
      popup = window.open();
    }

    getFileCorrectURL(blob, mimeType).then(function (url) {
      if (popup) {
        try {
          popup.location.href = url;
          return;
        } catch (e) {}
      }
      var anchor = document.createElementNS('http://www.w3.org/1999/xhtm', 'a');
      anchor.href = url;
      anchor.target  = '_blank';
      anchor.download = fileName;
      if (anchor.dataset) {
        anchor.dataset.downloadurl = ["video/quicktime", fileName, url].join(':');
      }
      $(anchor).css({position: 'absolute', top: 1, left: 1}).appendTo('body');

      try {
        var clickEvent = document.createEvent('MouseEvents');
        clickEvent.initMouseEvent( 'click', true, false, window,
         0, 0, 0, 0, 0, false, false, false, false, 0, null );
        anchor.dispatchEvent(clickEvent);
      } catch (e) {
        console.error('Download click error', e);
        try {
          anchor[0].click();
        } catch (e) {
          window.open(url, '_blank');
        }
      }
      $timeout(function () {
        $(anchor).remove();
      }, 100);
    });
  }

  return {
    isAvailable: isBlobPresent,
    copy: fileCopy,
    write: fileWriteData,
    getFileWriter: getFileWriter,
    getFakeFileWriter: getFakeFileWriter,
    chooseSave: chooseSaveFile,
    getUrl: getUrl,
    getDataUrl: getDataUrl,
    getByteArray: getByteArray,
    getFileCorrectUrl: getFileCorrectURL,
    download: downloadFile
  };

})

.service('VideoManager', function($q, $rootScope, $window, $modal, ApiFileManager, UsersManager){

})

.factory('SQLiteStorage', function($q, $ionicPlatform, FileManager){
  
  function isAvailable(){
    var deferred = $q.defer();
    var dbPromise = $ionicPlatform.ready(function(){
      try{
        var storageIsAvailable = window && window.sqlitePlugin.openDatabase({ name: "tellefile.db", androidDatabaseImplementation: 2 });
        deferred.resolve(storageIsAvailable);
      }catch(e){
         deferred.reject(e);
      }
    });  
    return dbPromise = deferred.promise; 
  }
  return {
    isAvailable : isAvailable,
  };
})

.service('TempStorage' , function($q, $window, FileManager){
  $window.requestFileSystem = $window.requestFileSystem || $window.webkitRequestFileSystem;

  var requestFsPromise,
      fileSystem,
      storageIsAvailable = $window.requestFileSystem !== undefined;

  function requestFS(){
    if(requestFsPromise){ return requestFsPromise; }

    if(!$window.requestFileSystem){
      return requestFsPromise = $q.reject({ 
        type: 'FS_BROWSER_UNSUPPORTED',
        description: 'requestFileSystem missing! PANIC MODE!' });
    }

    var deferred = $q.defer();

    $window.requestFileSystem($window.TEMPORARY, 700 * 1024 * 1024,function (file_system){
      fs = file_system;
      deferred.resolve();
    }, function(error){
      storageIsAvailable = false;
      deferred.reject(error);
    });

    return requestFsPromise = deferred.promise;
  }

  function isAvailable(){ return storageIsAvailable; }

  function getFile( file_name, size){
    size = size || 1;
    return requestFS().then(function(){
    console.log(dt(), 'getting the file --->', file_name);
    var deferred  = $q.defer();

    fs.root.getFile( file_name, {create: false},
      function(fileEntry){
        fileEntry.file( function(file){
          if(file.size >= size){
            deferred.resolve(fileEntry);
          }
          else{
            deferred.reject(new Error('FILE_NOT_FOUND'));
          }
        }, function(e){
          console.log(dt(), 'ERROR: ' + e);
          deferred.reject(e);
        });
      } , function(){
        deferred.reject(new Error('FILE_NOT_FOUND'));
      });
      return deferred.promise;
    });
  }

  function saveFile( file_name, blob){
    return writeFile(file_name).then(function (fileWriter){
      return FileManager.write(fileWriter, blob).then(function(){
        return fileWriter.finalize();
      });
    });
  }

  function writeFile(file_name){
    console.log(dt(), 'start writing file -->', file_name);

    return requestFS().then(function(){
      var deferred = $q.defer();

      fs.root.getFile( file_name, {create: true}, function (fileEntry){
        FileManager.getFileWriter(fileEntry).then(function(writeFile){
          writeFile.finalize = function(){ return fileEntry; };

          deferred.resolve(writeFile);
        }, function(e){
          storageIsAvailable =  false;
          deferred.reject(e);
        });

      }, function(error){
        storageIsAvailable = false;
        deferred.reject(error);
      });

      return deferred.promise;
    });
  }

  requestFS();
  
  return {
    isAvailable : isAvailable,
    saveFile : saveFile,
    writeFile : writeFile,
    getFile : getFile
  };

})

.service('MemoryStorage', function($q, FileManager){
  var memStorage = {};

  function isAvailable(){
    return true;
  }
  function getFile( file_name, size){
    if(memStorage[file_name]){
      var result = memStorage[file_name];
      return $q.when(result);
    }
    return $q.reject(new Error('FILE_NOT_FOUND'));
  }

  function saveFile(file_name, blob){
    return $q.when(memStorage[file_name] = blob);
  }

  function writeFile(file_name , mime_type){
    var writer = FileManager.getFakeFileWriter(mime_type, function(blob){
      saveFile(file_name, blob);
    });
    return $q.when(writer);
  }

  return {
    isAvailable : isAvailable,
    saveFile : saveFile,
    getFile : getFile,
    writeFile : writeFile
  };
})

.service('IndexedDBStorage', function($q, $window, FileManager){
  $window.indexedDB = $window.indexedDB || $window.webkitIndexedDB || $window.OIndexedDB || $window.msIndexedDB;
  $window.IDBTransaction = $window.IDBTransaction || $window.webkitIDBTransaction || $window.msIDBTransaction;

  var db_name = 'cachedFiles';
  var db_storeName = 'files';
  var db_version  = 1;
  var getIndexedDBPromise;
  var storageIsAvailable = $window.indexedDB !== undefined && $window.IDBTransaction !== undefined;

  if( storageIsAvailable && 
      navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1 ){
    storageIsAvailable = false;
  }

  var storeBlob = storageIsAvailable || false;

  function isAvailable(){
    return storageIsAvailable;
  }
  function openDB(){
    if(getIndexedDBPromise){
      return getIndexedDBPromise;
    }
    try {
      var request = indexedDB.open(db_name, db_version);
      var deferred = $q.defer();
      var createObjStore = function (db){
        db.createObjectStore(db_storeName);
      };
      if(!request){
        throw new Exception();
      }
    }catch(e){
      storageIsAvailable = false;
      return $q.reject(e);
    }

    request.onsuccess = function(event){
      db = request.result;

      db.onerror = function(err){
        storageIsAvailable = false;
        console.error('Error accessing IndexDB', err);
        deferred.reject(err);
      };

      //create objectstore in Chrome.(temp solution) Will be deprecated.
      if(db.setVersion){
        if(db.version != db_version){
          db.setVersion(db_version).onsuccess = function(){
            createObjStore(db);
            deferred.resolve(db);
          };
        }
        else{
          deferred.resolve(db);
        }
      }
      else{
        deferred.resolve(db);
      }
    };

    request.onerror =function(e){
      storageIsAvailable = false;
      console.error('Error accessing indexDB' , e);
      deferred.reject(e);
    }

    request.onupgradeneeded = function(evt){
      createObjStore(evt.target.result);
    };

    return getIndexedDBPromise = deferred.promise;
  };

  function saveFile(file_name, blob){
    return openDB().then(function(db){
      if(!storeBlob){
        return saveBase64(db, file_name, blob);
      }
      try{
        var objectStore = db.transaction([db_storeName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(db_storeName);
        var request = objectStore.put(bob, file_name);
      }catch(err){
        if(storeBlob){
          storeBlob = false;
          return saveBase64(db, file_name, blob);
        }
        storageIsAvailable = false;
        return $q.reject(err);
      }
      var deferred = $q.defer();

      request.onsuccess = function(evt){
        deferred.resolve(blob);
      };

      request.onerror = function(err){
        deferred.reject(err);
      };

      return deferred.promise;
    });
  };

  function saveBase64(db, file_name, blob){
    try{
      var reader = new FileReader();
      reader.readAsDataURL(blob);
    }catch(err){
      storageIsAvailable = false;
      return $q.reject(err);
    }
    var deferred = $q.defer();

    reader.onloadend = function(){
      try {
        var objectStore = db.transaction([db_storeName], IDBTransaction.READ_WRITE || 'readwrite').objectStore(db_storeName);
        var request = objectStore.put(reader.result, file_name);
      }catch(err){
        storageIsAvailable = false;
        deferred.reject(err);
        return;
      }
      request.onsuccess = function(evt){
        deferred.resolve(blob);
      };
      request.onerror = function(err){
        deferred.reject(err);
      };
    }
    return deferred.promise;
  }

  function getFile(file_name){
    return openDB().then(function(db){
      var deferred = $q.defer();
      var objectStore = db.transaction([db_storeName], IDBTransaction.READ || 'readonly').objectStore(db_storeName);
      var request = objectStore.get(file_name);

      request.onsuccess = function(evt){
        var result = evt.target.result;
        if(result === undefined){
          deferred.reject();
        }
        else if( typeof result === 'string' && result.substr(0,5) ==='data:'){
          deferred.resolve(dataUrlToBlob(result));
        }else{
          deferred.resolve(result);
        }
      };

      request.onerror = function (err){
        deferred.reject(err);
      };

      return deferred.promise;

    });
  }

  function writeFile(file_name, mime_type){
    var writer = FileManager.getFakeFileWriter(mime_type, function(blob){
      saveFile(file_name, blob);
    });
    return $q.when(writer);
  }
  openDB();

  return {
    isAvailable : isAvailable,
    getFile : getFile,
    writeFile : writeFile, 
    saveFile : saveFile
  };
})

.service('CryptoWorker', function($timeout, $q){
  var mobileWorker = false,
      naClEmbed = false,
      waiting = {},
      taskID = 0,
      mobileCrypto = window.crypto && (window.crypto.subtle || window.crypto.webkitSubtle),
      useSha1Crypto = mobileCrypto && mobileCrypto.digest !== undefined,
      useSha256Crypto = mobileCrypto && mobileCrypto.digest !== undefined,
      finishTask = function ( taskID, result){
        var deferred = waiting[taskID];
        if(deferred !== undefined){
          console.log(dt(), 'Crypto Worker done');
          deferred.resolve(result);
          delete waiting[taskID];
        }
      };

  if(navigator.mimeTypes && navigator.mimeTypes['application/x-nacl']!== undefined){
    var listener = $('<div id = "naclListener"><embed id="protocol_crypto" width="0" height="0" src="nacl/proto_crypto.nmf" type="application/x-pnacl" /></div>').appendTo($('body'))[0];
    
    listener.addEventListener('load', function(e){
      naClEmbed = listener.firstChild;
      console.log(dt(), 'NaCL is ready ...');
    }, true);

    listener.addEventListener('message', function( e){
      finishTask(e.data.taskID, e.data.result);
    }, true);

    listener.addEventListener('error', function(e){
      console.error('NaCL error', e);
    }, true);
  }

  if(window.Worker){
    var tempWorker = new Worker('js/crypto-worker.js'); 
    tempWorker.onmessage = function(e){
      if(!mobileWorker) //webWorker
      {
        mobileWorker = tempWorker;
      }else{
        finishTask(e.data.taskID, e.data.result);
      }
    };

    tempWorker.onerror = function(e){
      console.error("CryptoWorker Error: ",e, e.stack);
      mobileWorker = false;
    };
  }

  function doTaskWorker( task, params, embed){
    console.log(dt(), "Crypto Worker started: ", task);
    
    var deferred = $q.defer();
    waiting[taskID] = deferred;

    params.task = task;
    params.taskID = taskID;
    (embed || mobileWorker).postMessage(params);

    taskID++;

    return deferred.promise;
  }

  return {
    sha1Hash: function(bytes){
      if(useSha1){
        var deferred = $q.defer();
        var typedArrayBytes = Array.isArray(bytes) ? convertToUint8Array(bytes): bytes;

        mobileCrypto.digest({ name: 'SHA-1'}, typedArrayBytes).then(function(digest){
          console.log(dt(), "Sha-1 done ...");
          deferred.resolve(digest);
        },
        function (e){
          console.error('Crypto digest error: ', e);
          useSha1 = false;
          deferred.resolve(sha1HashSync(bytes));
        });

        return deferred.promise;
      }

      return $timeout(function(){
        return sha1HashSync(bytes);
      });
    },
    aesEncrypt: function( bytes, key_bytes, iv_bytes){
      if(naClEmbed){
        return doTaskWorker('aes-encrypt', {
          bytes: addPadding(convertToArrayBuffer(bytes)),
          key_bytes : convertToArrayBuffer(key_bytes),
          iv_bytes: convertToArrayBuffer(iv_bytes)
        }, naClEmbed);
      }
      return $timeout(function(){
        return convertToArrayBuffer(aesEncryptSync(bytes, key_bytes, iv_bytes));
      });
    },

    aesDecrypt : function(encr_bytes, key_bytes, iv_bytes){
      if(naClEmbed){
        return doTaskWorker('aes-decrypt',{
          encr_bytes : addPadding(convertToArrayBuffer(encr_bytes)),
          key_bytes : convertToArrayBuffer(key_bytes),
          iv_bytes : convertToArrayBuffer(iv_bytes)
        }, naClEmbed);
      }
    },
    factorize: function(bytes){
      bytes = convertToByteArray(bytes);
      if(naClEmbed && bytes.length <=8){
        return doTaskWorker('factorize', {
          bytes: bytes
        }, naClEmbed);

      }
      if(mobileWorker){
        return doTaskWorker('factorize', {bytes: bytes})
      }
      return $timeout(function (){
        return pqPrimeFactorization(bytes);
      });
    },
    modPow: function (x, y, j){
      if(mobileWorker){
        return doTaskWorker('mod-pow', {
          x:x,
          y:y,
          m:j
        });
      }
      return $timeout(function(){
        return bytesModPow(x, y, m);
      });
    }
  };
})

.service('AppRuntimeManager', function($window){

  return{
    reload: function(){
      try{
        location.reload();
      } catch(e){
        console.log("Could not reload: ",e);
      };

      if($window.chrome && chrome.runtime && chrome.runtime.reload){
        chrome.runtime.reload();
      }

    },
    close: function(){
      try{
        $window.close();
      }catch(err){
        console.error('Could not close window: ',err);        
      } 
    },
    focus: function () {
      if (window.navigator.mozApps && document.hidden) {
        // Get app instance and launch it to bring app to foreground
        window.navigator.mozApps.getSelf().onsuccess = function() {
          this.result.launch();
        };
      } else {
        if (window.chrome && chrome.app && chrome.app.window) {
          chrome.app.window.current().focus();
        }
        window.focus();
      }
    }
  };
})

.service ('ExternalResourcesManager', function($q, $http){
  var promises = {};

  function downloadImg ( url ){
    if(promises[url] !==undefined){
      return promises[url];
    }

    return promises[url] = $http.get( url, {
        responseType: 'blob', 
        transformRequest : null 
    })
  }
  return { 
    downloadImage : downloadImg 
  };
})

.factory('Images', function(){
  var logos = [{
    id:0,
    image: 'img/Betterlogo.png',
    contact: 'img/android-contact.png'
  }];

  return {
    all: function() {
      return logos;
    },
    get: function(logoId) {
      // Simple index lookup
      return logos[logoId];
    }
  };
})
.factory('Profile', function(){
  var profile_photo  = 'img/android-contact.png';
  return {
    getDefaultPhoto: function(){
      return profile_photo;
    }
  };

})

.factory('MockService', ['$http','$q', function($http, $q){
  var me = {};

  me.getUserMessages = function(d){
    var deferred = $q.defer();

    setTimeout(function(){ deferred.resolve(getMockMessages());}, 0);
    return deferred.promise;
  
  };
  
  me.getMockMessage = function(){
    return {
      userId: '1',
      date: new Date(),
      file: 'img/jeeseat.jpg',
      filename:'image.jpg',
      filesize:'670.90 kb'
    };
  };
  return me;
}])


function getMockMessages(){
  return {"messages":[
  {"_id":"2","dataUrl":'img/one.jpg',"size":'200.44 kb',"type":'image/jpeg',
  "userId":"1","date":"2014-11-17T20:19:15.289Z","read":true, 'mid':"1",
  "time":"06:55"},
  {"_id":"1","dataUrl":'img/ryan_dahl.jpg',"size":'357.32 kb',"type":'image/jpeg',
  "userId":"2","date":"2014-11-26T21:18:17.591Z","read":true,'mid':"2",
  "time":"07:27"}
  ]};
}

(function (window){

  var keyStarter = '';
  var noStarter = false;
  var cache = {};
  var useChromeStorage  = !!(window.chrome && chrome.storage && chrome.storage.local);
  var useLocalStorage = !useChromeStorage && !!window.localStorage;

  function setStarter (starter){
    keyStarter = starter;
  }
  function setNoStarter (){
    noStarter = true;
  }
  function storageGetStarter(){
    if(noStarter){
      noStarter = false;
      return '';
    }
    return keyStarter; 
  }

  function setItem( object,  callback ){
    var keyValues = {},
      starter = storageGetStarter(),
      key, 
      value;

    for(key in object){
      if(object.hasOwnProperty(key)){
        value = object[key];
        key = starter + key;
        cache[key] = value;
        value = JSON.stringify(value);

        if(useLocalStorage){
          try{
            localStorage.setItem(key, value);
          }catch(e){
            useLocalStorage = false;
          }
        }
        else{
          keyValues[key] = value;
        }
      }
    }
    if(useLocalStorage || !useChromeStorage){
      if(callback){
        callback();
      }
      return;
    }
    chrome.storage.local.set(keyValues,  callback);
  };

  function getItem (){
    var keys = Array.prototype.slice.call(arguments);
    var callback = keys.pop(),
      result = [],
      value,
      single = keys.length == 1,
      found = true,
      starter = storageGetStarter(),
      i,
      key;

    for( i = 0; i < keys.length; i++){
      key = keys[i] = starter + keys[i];

      if(key.substr(0,3) != 'xt_' && cache[key] !== undefined){
        result.push(cache[key]);
      }
      else if (useLocalStorage){
        try{
          value = localStorage.getItem(key);
        }catch(e){
          useLocalStorage = false;
        }
        try{
          value = (value === undefined || value === null) ? false : JSON.parse(value);    
        }catch(e){
          value = false;
        }
        result.push(cache[key] = value);
      }
      else if (!useChromeStorage){
        result.push(cache[key] = false);
      }
      else {
        found = false;
      }
    }
    if(found){
      return callback ( single ? result[0] : result);
    }

    chrome.storage.local.get(keys, function(resultObject){
      var value;
      result = [];
      for(i = 0; i < keys.length; i++){
        key = keys[i];
        value = resultObject[key];
        value = value === undefined || value === null ? false : JSON.parse(value);
        result.push(cache[key] = value);
      }

      callback(single ? result[0] : result);
    });
  };

  function removeItem (){
    var keys = Array.prrototype.slice.call(arguments);
    var starter = storageGetStarter();
    var i, key, callback;

    if(typeof keys[keys.length - 1] === 'function') {
      callback = keys.pop();
    }

    for(i = 0; i < keys.length; i++){
      key = keys[i] = prefix + keys[i];
      delete cache[key];

      if(useLocalStorage){
        try{
          localStorage.removeItem(key);
        }catch(e){
          useLocalStorage = false;
        }
      }
    }
    if(useChromeStorage){
      chrome.storage.local.remove(keys, callback);
    }
    else if ( callback ){
      callback();
    }
  };

  window.TellefileStorage = {
    prefix : setStarter, 
    noPrefix : setNoStarter, 
    set : setItem,
    get : getItem,
    remove : removeItem
  };

})(this);