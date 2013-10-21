var panel = document.createElement('div');
panel.id = 'panel';
panel.className = 'showPanel';
var container = document.createElement('div');
container.id = 'coworking_container';

var text = document.createTextNode("No one is workin' right now.  Slackers. ");	
container.appendChild(text);
panel.appendChild(container);

console.log(panel);

document.querySelector('body').appendChild(panel);

var masterInfo;
var update;

var firstContact = false;

getData();

$( "#panel" ).mouseenter(function() {
	$( "#panel" ).animate({left:'10px'}, 200, function(){ getData(); } );
});
$( "#panel" ).click(function(){
	$( "#panel" ).animate({left:'-490px'}, 200);
});


function getData() {

	if(!firstContact){
		update = setInterval(function(){ parseInfo(masterInfo); }, 1000);
		firstContact = true;
	}
    //new request
    // var xmlhttp=new XMLHttpRequest();

  //clearInterval(getInfoTimer);
  var date = new Date();
  var today = String(date.getMonth()+1) + String(date.getDate()) + String(date.getFullYear());
  console.log("getting data");
  var request = $.ajax({
    url: "http://michaelpallison.com/test/getDBInfo.php",
    type: "POST",
    data: { q: today }
  });
   
  request.done(function( responseText ) {
      masterInfo = responseText;
      console.log(responseText);
  });
   
  request.fail(function( jqXHR, textStatus ) {
    alert( "get info Request failed: " + textStatus );
  });

}

function secondsTimeSpanToHMS(s) {
    var h = Math.floor(s/3600); //Get whole hours
    s -= h*3600;
    var m = Math.floor(s/60); //Get remaining minutes
    s -= m*60;
    return h+":"+(m < 10 ? '0'+m : m)+"<span class='sec'>:"+(s < 10 ? '0'+s : s)+"</span>"; //zero padding on minutes and seconds
}

function parseInfo (text) {

      var db_info = text;
      var info = JSON.parse(db_info);
     // console.log(info);

      var theDiv = document.createElement('div');

      var newUser = false;
      //loop through the data, for each person in info
      for(var person in info){

        //make sure that the person has workblocks for the day
        if(info[person].workBlock[0] != null){
            //get the current username

            if(info[person].workBlock[0].WORKING == 1 )
            {
              var startTime = new Date(info[person].workBlock[0].TIMEIN);
              var curWorkingTime = Math.round((new Date - startTime) / 1000);
			  var time = secondsTimeSpanToHMS(curWorkingTime);
              var para = document.createElement('div');
              para.className = 'item';
              para.innerHTML = "<span class='username'>"+info[person].userName+"</span> <span class='clock'>"+time+"</span>";
              theDiv.appendChild(para);
          }
          }
        }

        if(!theDiv.hasChildNodes()){
        	var text = document.createTextNode("No one is workin' right now.  Slackers. ");	
			container.appendChild(text);
        }
        container.innerHTML = theDiv.innerHTML;
}
