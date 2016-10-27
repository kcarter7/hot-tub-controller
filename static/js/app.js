'use strict';

/* App Module */

var itubApp = angular.module('itubApp', [])
    .controller('itubController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
        $scope.loaded = false;
        $scope.two_speed_pump = false;
        $scope.second_pump = false;

	var refreshLabels = function() {
	   $http.get('/getstatus').then(function(response) {
                $scope.loaded = true;
                var status = response.data;
               	$scope.tubOnOff = status.tubOnOff; 
		if ($scope.tubOnOff == 0) {
			$scope.tubOnOffLabel = "Turn On";
		} else {
	   		$scope.tubOnOffLabel = "Turn Off";
	   	}
		$scope.heater = status.heater;
                $scope.pump1 = status.pump1;
                $scope.pump2 = status.pump2;
                $scope.tempAir = status.tempAir;
                $scope.tempIn = status.tempIn;
                $scope.tempOut = status.tempOut;
                $scope.tempSet = status.tempSet;
                $scope.freeze_status = status.freeze_status;
                $scope.filter_status = status.filter_status;
            }).catch(function (err) {
                // alert("Error retrieving status. " + err.statusText);
           });
	};	
	
	var refresh = function() {
	   refreshLabels();
           $timeout(refresh, 5000);
            $http.get('/getconfig').then(function(response) {
                var config = response.data;
                $scope.two_speed_pump = config.two_speed_pump;
                $scope.second_pump = config.second_pump;
            }).finally(function () {
                $scope.heater_options = $scope.two_speed_pump ?
                    [{'label': 'Off', 'value': 0}, {'label': 'Low', 'value': 1}, {'label': 'High', 'value': 2}] :
                    [{'label': 'Off', 'value': 0}, {'label': 'On', 'value': 1}]

            })
        };

        refresh();

	$scope.onchangeTubOnOff = function() {
            var url = "/tub_";
            var urlSuffix = ($scope.tubOnOff == 1) ? "off" : "on";
    	    url += urlSuffix; 
           $http.get(url).then(function(response) {
          	if ($scope.tubOnOff == 1) {  	
	    	   $scope.tubOnOff = 0;
		} else {
		   $scope.tubOnOff = 1;
		}		
		refreshLabels();	
		console.log("Tub turned " + urlSuffix);
            }).catch(function (err) {
                alert("Error turning tub on/off");
            });
        };

	$scope.onchangeHeater = function() {
            var url = "/heater_";
            url += ($scope.heater == -1) ? "off" : (($scope.heater == 0) ? "pool" : "spa");
            $http.get(url).then(function(response) {
                console.log("Heat control changed");
            }).catch(function (err) {
                alert("Error updating heat control");
            });
        };

        $scope.onchangePump1 = function() {
            var url = "/pump1_";
            var val = $scope.pump1;
            if (val === 0) {
                url += "off";
            } else if (val === 1) {
                url += "low";
            } else if (val === 2) {
                url += "high";
            } else {
                alert("Unexpected pump1 value");
                return;
            }
            $http.get(url).then(function(response) {
                console.log("pump1 changed");
            }).catch(function (err) {
                alert("Error updating pump1");
            });
        };

        $scope.onchangePump2 = function() {
            var url = "/pump2_";
            if ($scope.pump2 === 0) {
                url += "off";
            } else if ($scope.pump2 === 1) {
                url += "on";
            } else {
                alert("Unexpected pump2 value");
                return;
            }
            $http.get(url).then(function(response) {
                console.log("pump2 changed");
            }).catch(function (err) {
                alert("Error updating pump2");
            });
        };

    }]);
