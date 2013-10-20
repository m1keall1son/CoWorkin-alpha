
var working = false;
var showInfo = false;
var startTime = 0;
var timer = null;
var curWorkingTime =0 ;
 var signin_button;
  var revoke_button;
  var revoke_button_token;
  var user_info_div;
  var myName;
  var date = new Date();
  var currentUsers;
  //mmddyyyy
  var today = String(date.getMonth()+1) + String(date.getDate()) + String(date.getFullYear());

var runClock = function() {
        curWorkingTime = Math.round((new Date - startTime) / 1000);
        setCurTime(curWorkingTime);
        updateTime(curWorkingTime, true);
     }

function setWorkingIcon(isWorking) {

    if(isWorking){
      showInfo = true;
      curWorkingTime = 0;
      startTime = new Date();
      chrome.browserAction.setIcon({path:"working.png"});
      addNewWorkblock(curWorkingTime);      
      //timer = setInterval( function(){ runClock(); } , 15000);
  }else{
      showInfo = false;
      updateTime(curWorkingTime, false);
      chrome.browserAction.setIcon({path:"notworking.png"});
      //clearInterval( timer );
  }

}

function setCurTime(time){
 // $.('#sql').text(time);
 var min = (time%60);
 //needs better formatting, math round jumps from 30 sec to 1 min
 var formattedTime = Math.round((time / 60))+":"+(min<10 ? "0"+min : min);
 console.log(time);
}

function setWorking(){
   working = !working;
   console.log(myName);
   setWorkingIcon(working);
}

chrome.browserAction.onClicked.addListener(setWorking);

chrome.idle.setDetectionInterval(30);
chrome.idle.onStateChanged.addListener(function (state){
  if(state == 'idle' && working ){
    var logout = false;
    var i = 0;
    var timeout = setInterval(function(){ 
      logout = checkTimeout() 
    },1000);
    if(!logout){
    if(!confirm('Are you still workin?')) {
      clearInterval(timeout);
      logMeOut();
    }
    }else{
      clearInterval(timeout);
      logMeOut();
    }
  }

  function checkTimeout(){
    if(i > 30) return true;
    else return false;
    i++;
  }

});


function logMeOut() {
  setWorking();
  console.log('log me out');
}
 



function updateTime(time, isWorking) {
  var work;
  if(isWorking)work = 1;
  else work = 0;

  var request = $.ajax({
    url: "http://michaelpallison.com/test/update.php",
    type: "POST",
    data: { q: myName, t: time, w: work }
  });
   
  request.done(function( responseText ) {
      console.log(responseText);
      getData(today);
  });
   
  request.fail(function( jqXHR, textStatus ) {
    alert( "time out Request failed: " + textStatus );
  });

}


function addNewWorkblock (time) {
  var timeIn = new Date();   

var request = $.ajax({
  url: "http://michaelpallison.com/test/insert.php",
  type: "POST",
  data: { q: myName, ti: timeIn, to: time, d: today }
});
 
request.done(function( responseText ) {
    console.log(responseText);
    getData(today);
});
 
request.fail(function( jqXHR, textStatus ) {
  alert( "add block Request failed: " + textStatus );
});


}


var checkDbforUser = function (username) {
  //new request
  username = username.replace(" ", "_");
  //save that to a global variable
  //myName = username;

 var request = $.ajax({
    url: "http://michaelpallison.com/test/checkUser.php",
    type: "POST",
    data: { q: username }
  });
   
  request.done(function( responseText ) {
      console.log(responseText);
     // getData();
  });
   
  request.fail(function( jqXHR, textStatus ) {
    alert( "check Request failed: " + textStatus );
  });


}


  function showButton(button) {
    button.disabled = false;
    button.style.display = 'inline';
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;
    getToken();

    function getToken() {
      chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        // Save the token globally for the revoke button.
        revoke_button_token = token;

        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token },
                                              getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    //this gets called first with interactive=false, meaning it not ask if you want to connect to the app
    //fire this function with the parameters below
    xhrWithAuth('GET',
                'https://www.googleapis.com/plus/v1/people/me',
                interactive,
                onUserInfoFetched);
    //the last item is the function that fires when the request comes back
  }





  function onUserInfoFetched(error, status, response) {
    //the request from OAuth2 came back and heres the stuff
    //if not an error, proceed
    if (!error && status == 200) {
      //log the personal info we got back
      console.log("Got the following user info: " + response);
      //parse the info so we can use it
      var user_info = JSON.parse(response);

      var user = user_info.displayName;
      user = user.replace(" ", "_");
      myName = user;
      checkDbforUser(user);



      populateUserInfo(user_info);
      //hide the sign in button
      hideButton(signin_button);
      //show the revoke token button
      showButton(revoke_button);
    } else {
      //the request had an error so you have to sign in manually

      //popup

      showButton(signin_button);

    }
  }

  function populateUserInfo(user_info) {
     var elem = user_info_div;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = "<b>Hello " + user_info.displayName + "</b>";
    elem.appendChild(nameElem);
    fetchImageBytes(user_info);
  }

  function fetchImageBytes(user_info) {
    if (!user_info || !user_info.image || !user_info.image.url) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', user_info.image.url, true);
    xhr.responseType = 'blob';
    xhr.onload = onImageFetched;
    xhr.send();
  }

  function onImageFetched(e) {
    var elem = user_info_div;
    if (!elem) return;
    if (this.status != 200) return;
    var imgElem = document.createElement('img');
    imgElem.src = window.webkitURL.createObjectURL(this.response);
    elem.appendChild(imgElem);
  }


  function interactiveSignIn() {
    disableButton(signin_button);
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      if (chrome.runtime.lastError) {
        showButton(signin_button);
      } else {
        getUserInfo(true);
      }
    });
  }

  function revokeToken() {
    if (revoke_button_token) {
      // Make a request to revoke token
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
               revoke_button_token);
      xhr.send();
      // Update the user interface accordingly
      revoke_button_token = null;
      hideButton(revoke_button);
      user_info_div.textContent = '';
      showButton(signin_button);
    }
  }

   function init () {

      //set up the initial button states and the functions attached to them
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;

      revoke_button = document.querySelector('#revoke');
      revoke_button.onclick = revokeToken;

      getUserInfo(false);
      user_info_div = document.getElementById('sql');
      chrome.browserAction.setIcon({path:"notworking.png"});

      //chrome.tabs.executeScript(null, {file: "content.js"});
      //chrome.tabs.insertCSS(null, {file: "coworkin.css"});

    
  }

window.onload=function(){ init() };
