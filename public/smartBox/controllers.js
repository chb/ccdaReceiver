angular.module('smartBox').controller("PatientViewController", function($scope, patient, app, patientSearch, $routeParams, $rootScope, $location) {
  $scope.patient = {};
  $scope.publicUri = publicUri;
  $scope.all_apps = [];
  app.getApps().then(function(apps) {
    $scope.all_apps = apps.data;
  });
  $scope.patientHelper = patient;
  $scope.patientView = function() {
    return ($scope.patient && angular.toJson($scope.patient, true));
  };

  $scope.givens = function(name) {
    return name && name.givens.join(" ");
  };

  $scope.$watch("patientId()", function(newPid) {
    patientSearch.getOne(newPid).success(function(p) {
      $scope.patient = p;
      $scope.$apply();
    });
  });
});
