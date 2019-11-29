'use strict';

/* App Module */

var itubApp = angular.module('itubApp', [])
    .controller('itubController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
        $scope.loaded = false;
        $scope.two_speed_pump = false;
        $scope.second_pump = false;
	$scope.showConfig = false;

	var refreshOptions = function() {
		$scope.heater_options = 
		    [{'label': 'Off', 'value': -1}, {'label': $scope.poolModeLabel, 'value': 0}, {'label': $scope.spaModeLabel, 'value': 1}]
		$scope.main_pump_options = $scope.two_speed_pump ?
		    [{'label': 'Off', 'value': 0}, {'label': 'Low', 'value': 1}, {'label': 'High', 'value': 2}] :
		    [{'label': 'Off', 'value': 0}, {'label': 'On', 'value': 1}]
	};

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
		$scope.currentTime = status.currentTime;
		$scope.tempSet = status.tempSet;
		$scope.freeze_status = status.freeze_status;
		$scope.filter_status = status.filter_status;
	    }).catch(function (err) {
		alert("Error retrieving status. " + err.statusText);
	   });
	   $http.get('/getconfig').then(function(response) {
		if ($scope.showConfig == false || $scope.loaded == false) { 
			var config = response.data;
			$scope.two_speed_pump = config.two_speed_pump;
			$scope.second_pump = config.second_pump;
			$scope.poolModeLabel = config.poolModeLabel;
			$scope.poolModeTemp = config.poolModeTemp;
			$scope.spaModeLabel = config.spaModeLabel;
			$scope.spaModeTemp = config.spaModeTemp;
			$scope.freezeCtrlTemp = config.freezeCtrlTemp;
		}
	   }).finally(function () {
 		refreshOptions();
		$scope.loaded = true;
	   });
	};	
	
	var refresh = function() {
	   refreshLabels();
	   $timeout(refresh, 5000);
        };

        refresh();

	$scope.onchangePoolModeLabel = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.poolModeLabel = $scope.poolModeLabel;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	   refreshOptions();
	}	

	$scope.onchangePoolModeTemp = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.poolModeTemp = $scope.poolModeTemp;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	}	

	$scope.onchangeSpaModeLabel = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.spaModeLabel = $scope.spaModeLabel;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	   refreshOptions();
	}	

	$scope.onchangeSpaModeTemp = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.spaModeTemp = $scope.spaModeTemp;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	}	

	$scope.onchangeFreezeCtrlTemp = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.freezeCtrlTemp = $scope.freezeCtrlTemp;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	}	

	$scope.onchangeTwoSpeedPump = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.two_speed_pump = $scope.two_speed_pump;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	   refreshOptions();
	}	

	$scope.onchangeSecondPump = function () {
	   var config;
	   $http.get('/getconfig').then(function(response) {
		config = response.data;
		config.second_pump = $scope.second_pump;
		$http.post('/setconfig', config).then(function(response) { }).catch(function (err) {
			alert("Error posting config values");
	   	});
	   }).catch(function (err) {
		 alert("Error retrieving config values");
	   });
	   refreshOptions();
	}	

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
