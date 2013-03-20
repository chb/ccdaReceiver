angular.module('ccdaPlayground').factory('Submitter', function($http) {
	var Submitter = {};

	Submitter.submit = function(data, cb){
		var pid = guid();
		
    return $http({
      method: "POST",
      data: data,
      url: "/internal/addPatient/"+pid+"?playgroundOnly=true",
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    }).success(function(){
			cb(pid);
		});
	};
  return Submitter;
});

angular.module('ccdaPlayground').controller("MainController", 
  function($scope,  Submitter){
		$scope.submitted = false;
		$scope.loading = false;

		var _pid = null;
		$scope.patientId = function(){
			return _pid;
		}

		$scope.runApps = function(){
			$scope.loading = true;
			$scope.submitted = false;
			Submitter.submit($scope.submission, function(pid){
				_pid = pid;
				console.log("SEt pid", pid);
				$scope.submitted = true;
				$scope.loading = false;
			});
		};

  }
);

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}
