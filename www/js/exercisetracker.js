var track_id = '';      // Name/ID of the exercise
var watch_id = null;    // ID of the geolocation
var tracking_data = []; // Array containing GPS position objects


document.addEventListener("deviceready", function(){
	if(navigator.connection.type == Connection.NONE){
		$("#home_network_button").text('No Internet Access').attr("data-icon", "delete").button('refresh');
	}
});

 
$("#startTracking_start").live('click', function(){

	var element = document.getElementById('in_progress');
	element.innerHTML = 'GPS capture in progress...';
     
    // Start tracking the User
    watch_id = navigator.geolocation.watchPosition(
    
        // Success
        function(position){
        	tracking_data.push(position);
        },
         
        // Error
        function(error){
            console.log(error);
        },
         
        // Settings
        { frequency: 10000, enableHighAccuracy: false });
     
    // Tidy up the UI
    track_id = $("#track_id").val();
     
    $("#track_id").hide();
     
    $("#startTracking_status").html("Tracking workout: <strong>" + track_id + "</strong>");

});


$("#startTracking_stop").live('click', function(){

	var element = document.getElementById('in_progress');
	element.innerHTML = '';

	// Soluciona el problema de la cnversión Object -> JSON por medio de
	// stringify que retorna un JSON vacío
	function cloneAsObject(obj) {
	    if (obj === null || !(obj instanceof Object)) {
	        return obj;
	    }
	    var temp = (obj instanceof Array) ? [] : {};
	    // ReSharper disable once MissingHasOwnPropertyInForeach
	    for (var key in obj) {
	        temp[key] = cloneAsObject(obj[key]);
	    }
	    return temp;
	}
	 
  	// Stop tracking the user
  	navigator.geolocation.clearWatch(watch_id);
  
  	// Save the tracking data
  	window.localStorage.setItem(track_id, JSON.stringify(cloneAsObject(tracking_data)));

	// Tiempo de retardo antes de vaciar las variables que almacenan el ultimo
	// registro capturado 
	var delay=1000;

	// Función de retardo, la cual permite que se almacenen los ultimos datos
	// capturados antes de ser vaciadas las variables watch_id y tracking_data
	setTimeout(function() {
		// Reset watch_id and tracking_data 
	  	var watch_id = null;
	  	var tracking_data = null;
	}, delay);

	// Tidy up the UI
  	$("#track_id").val("").show();

  	$("#startTracking_status").html("Stopped tracking workout: <strong>" + track_id + "</strong>");
 
});


$("#home_clearstorage_button").live('click', function(){
    window.localStorage.clear();
});

 
$("#home_seedgps_button").live('click', function(){
    window.localStorage.setItem('Sample block',
    	'[{"timestamp":1335700802000, "coords":{"heading":null,"altitude":null,"longitude":170.33488333333335,"accuracy":0,"latitude":-45.87475166666666,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700803000,"coords":{"heading":null,"altitude":null,"longitude":170.33481666666665,"accuracy":0,"latitude":-45.87465,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700804000,"coords":{"heading":null,"altitude":null,"longitude":170.33426999999998,"accuracy":0,"latitude":-45.873708333333326,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700805000,"coords":{"heading":null,"altitude":null,"longitude":170.33318333333335,"accuracy":0,"latitude":-45.87178333333333,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700806000,"coords":{"heading":null,"altitude":null,"longitude":170.33416166666666,"accuracy":0,"latitude":-45.871478333333336,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700807000,"coords":{"heading":null,"altitude":null,"longitude":170.33526833333332,"accuracy":0,"latitude":-45.873394999999995,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700808000,"coords":{"heading":null,"altitude":null,"longitude":170.33427333333336,"accuracy":0,"latitude":-45.873711666666665,"speed":null,"altitudeAccuracy":null}},{"timestamp":1335700809000,"coords":{"heading":null,"altitude":null,"longitude":170.33488333333335,"accuracy":0,"latitude":-45.87475166666666,"speed":null,"altitudeAccuracy":null}}]');
});


// When the user views the history page
$('#history').live('pageshow', function () {

	// Count the number of entries in localStorage and display this information to the user
  	tracks_recorded = window.localStorage.length;
  	$("#tracks_recorded").html("<strong>" + tracks_recorded + "</strong> workout(s) recorded");
   
  	// Empty the list of recorded tracks
  	$("#history_tracklist").empty();
   
  	// Iterate over all of the recorded tracks, populating the list
  	for(i=0; i<tracks_recorded; i++){
    	$("#history_tracklist").append("<li><a href='#track_info' data-ajax='false'>" + window.localStorage.key(i) + "</a></li>");
  	}
   
  	// Tell jQueryMobile to refresh the list
  	$("#history_tracklist").listview('refresh');

});


$("#history_tracklist li a").live('click', function(){

	$("#track_info").attr("track_id", $(this).text());
   
});
 

// When the user views the Track Info page
$('#track_info').live('pageshow', function(){

	// Find the track_id of the workout they are viewing
  	var key = $(this).attr("track_id");
   
  	// Update the Track Info page header to the track_id
  	$("#track_info div[data-role=header] h1").text(key);
   
  	// Get all the GPS data for the specific workout
  	var data = window.localStorage.getItem(key);
   
  	// Turn the stringified GPS data back into a JS object
  	data = JSON.parse(data);



  	function gps_distance(lat1, lon1, lat2, lon2){

  		// http://www.movable-type.co.uk/scripts/latlong.html
	    var R = 6371; // km
	    var dLat = (lat2-lat1) * (Math.PI / 180);
	    var dLon = (lon2-lon1) * (Math.PI / 180);
	    var lat1 = lat1 * (Math.PI / 180);
	    var lat2 = lat2 * (Math.PI / 180);
	 
	    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	    var d = R * c;
	     
	    return d;
	}

	// Calculate the total distance travelled
	total_km = 0;

	// Listas que almacenarán los valores de las distancias recorridas en cada tramo
	// y sus respectivos tiempos
	var distances_list = [];
	var times_in_seconds_list = [];
	var times_in_minutes_list = [];

	for(i = 0; i < data.length; i++){

	     
	    if(i == (data.length - 1)){
	        break;
	    }

	    // Almacenamos las distancias recorridas en cada uno de los tramos
	    distances_list.push((gps_distance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i+1].coords.longitude)).toFixed(2));
	    
	    stretch_start_time = new Date(data[i].timestamp).getTime();
	    stretch_end_time = new Date(data[i+1].timestamp).getTime();
	    stretch_time = stretch_end_time - stretch_start_time;
	    stretch_time_seconds = stretch_time / 1000;
	    console.log(((stretch_time_seconds)/60).toFixed(2)+" minutos");
	    stretch_time_minutes = Math.floor(stretch_time_seconds / 1000);
	    stretch_time_seconds_final = stretch_time_seconds - (stretch_time_minutes * 60);
	    times_in_seconds_list.push(stretch_time_seconds);
	    times_in_minutes_list.push(stretch_time_minutes);

	    //console.log("Tramo: "+i
	    //	+"\n Distancia en Km: "+distances_list[i]
	    //	+"\n Tiempo en minutos: "+times_in_minutes_list[i]
	    //	+"\n Tiempo en segundos: "+times_in_seconds_list[i]);

	    total_km += gps_distance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i+1].coords.longitude);
	}

	// Calculate the total time taken for the track
	start_time = new Date(data[0].timestamp).getTime();
	end_time = new Date(data[data.length-1].timestamp).getTime();
	 
	total_time_ms = end_time - start_time;
	total_time_s = (total_time_ms / 1000);
	 
	total_time_m = total_time_s / 60;
	//final_time_s = total_time_s - (total_time_m * 60);
	 
	// Display total distance and time
	$("#track_info_info").html('Travelled <strong>' + total_km.toFixed(2) +
							' km</strong> in <strong>' + total_time_m.toFixed(2) +
							' m</strong> and <strong>' + total_time_s.toFixed(2) + 
							' s</strong> and <strong>' + (total_km/(total_time_m/60)).toFixed(2) +
							' km/h</strong>');



	// MAP PRINT ============================================================================================
	// Set the initial Lat and Long of the Google Map
	var myLatLng = new google.maps.LatLng(data[0].coords.latitude, data[0].coords.longitude);
	 
	// Google Map options
	var myOptions = {
		zoom: 15,
	  	center: myLatLng,
	  	mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	 
	// Create the Google Map, set options
	var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);	

	var trackCoords = [];

	var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var labelIndex = 0;
 
	// Add each GPS entry to an array
	for(i=0; i<data.length; i++){
	    trackCoords.push(new google.maps.LatLng(data[i].coords.latitude, data[i].coords.longitude));

	    var actual_coord = trackCoords[i];

	    var marker = new google.maps.Marker({
		    position: actual_coord,
		    map: map,
		    label: labels[labelIndex++ % labels.length],
		});
	}
	 
	// Plot the GPS entries as a line on the Google Map
	var trackPath = new google.maps.Polyline({
		path: trackCoords,
	  	strokeColor: "#FF0000",
	  	strokeOpacity: 1.0,
	  	strokeWeight: 2
	});
	 
	// Apply the line to the map
	trackPath.setMap(map);
});