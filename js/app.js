/**
 * May 14, 2015
 * app.js 
 * @author mzereba
 */

var app = angular.module('AppManager', ['ui.bootstrap.modal', 'ui.bootstrap.dropdown', 'ui.bootstrap.tooltip']);

app.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});

app.controller('AppManagerController', function ($scope, $http, $sce) {
	$scope.apps = [];
	$scope.workspaces = [];
    $scope.loggedin = false;
    $scope.current_selected = -1;
    $scope.last_selected = -1;
    $scope.currentapp = {};
    $scope.userProfile = {};
        
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    // Define the appuri, used as key when saving to sessionStorage
    $scope.appuri = window.location.origin;
    
    // Save profile object in sessionStorage after login
    $scope.saveCredentials = function () {
        var app = {};
        var _user = {};
        app.userProfile = $scope.userProfile;
        sessionStorage.setItem($scope.appuri, JSON.stringify(app));
    };

    // Clear sessionStorage on logout
    $scope.clearLocalCredentials = function () {
        sessionStorage.removeItem($scope.appuri);
    };
    
    $scope.logout = function() {
    	$scope.apps.length = 0;
    	$scope.workspaces.length = 0;
    	$scope.userProfile = {};
    	$scope.clearLocalCredentials();
    	$scope.loggedin = false;
    	$scope.current_selected = -1;
    	$scope.last_selected = -1;
    	//notify('Success', 'Logged out user.');
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.loggedin = true;
            notify('Success', 'Authenticated user.');
        } else {
            notify('Failed', 'Authentication failed.');
        }
    };
    
    $scope.status = {
    	isopen: false
	};

	$scope.toggled = function(open) {
		$log.log('Dropdown is now: ', open);
	};

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
	
	// Simply search list for given id
    // and returns the object if found
    $scope.get = function (id) {
        for (i in $scope.apps) {
            if ($scope.apps[i].id == id) {
                return $scope.apps[i];
            }
        }
    };
	
	$scope.select = function (index, app) {
		$scope.last_selected = $scope.current_selected; 
		$scope.current_selected = index;
		$scope.currentapp = angular.copy(app);
	};
	
	$scope.isChecked = function (storage) {
		var workspaces = $scope.currentapp.enabled_workspaces;
		for (i in workspaces) {
			if(storage.indexOf(workspaces[i]) >= 0)
				return true;
		}
		return false;
	};
	
	$scope.setStyle = function (index) {
		if ($scope.current_selected == index) {
			return {'border': '1px solid #888888', 'box-shadow': '0 5px 10px rgba(0, 0, 0, 0.2)'}
		}
		if ($scope.last_selected == index) {
			return {}
		}
	};
	
	$scope.focus = function(){
	    $scope.isFocused = true;
	};
	    
    $scope.renameStorage = function(newstorage, indexstorage) {
    	$scope.isFocused = false;
    	for (var i in $scope.currentapp.storage) {
            if (i == indexstorage) {
            	$scope.currentapp.storage[i] = newstorage;
            }
        }
    	
    	var metadata = $scope.metadataTemplate($scope.currentapp);
    	$scope.update(metadata);
    	
    };
    
    $scope.enableWorkspace = function(storage, checked) {
    	if(checked){
    		for (i in $scope.userProfile.workspaces) {
    			if(storage.indexOf($scope.userProfile.workspaces[i]) >= 0)
    				$scope.currentapp.enabled_workspaces.push($scope.userProfile.workspaces[i]);
    		}
    		
    		var metadata = $scope.metadataTemplate($scope.currentapp);
        	$scope.update(metadata);
        	
    	} else {
    		$scope.removeWorkspace(storage);
    	}
    };
    
    $scope.removeStorage = function(storage, index) {
    	 for (var i in $scope.currentapp.storage) {
             if (i == index) {
            	 var indexOf = $scope.currentapp.storage.indexOf(storage);
            	 if (indexOf !== -1) {
            		 $scope.currentapp.storage.splice(indexOf, 1);
            	 }
            	 
            	 $scope.removeWorkspace(storage);
             }
         }
    	 
    	 var metadata = $scope.metadataTemplate($scope.currentapp);
    	 $scope.update(metadata);
    };
    
    $scope.removeWorkspace = function(storage) {
    	if($scope.currentapp.enabled_workspaces.length == 1) {
    		notify('Error', 'Removing only storage visible.');
    	} else {
	    	for (i in $scope.currentapp.enabled_workspaces) {
				if(storage.indexOf($scope.currentapp.enabled_workspaces[i]) >= 0) {
					var indexOf = $scope.currentapp.enabled_workspaces.indexOf($scope.currentapp.enabled_workspaces[i]);
	    	    	if (indexOf !== -1) {
	    	    		$scope.currentapp.enabled_workspaces.splice(indexOf, 1);
	    	    	}
				}
			}
	    	
	    	var metadata = $scope.metadataTemplate($scope.currentapp);
	    	$scope.update(metadata);
    	}
    };
    
    $scope.updateView = function() {
    	 for (i in $scope.apps) {
             if ($scope.apps[i].id == $scope.currentapp.id)
                 $scope.apps[i] = angular.copy($scope.currentapp);
         }
    };
    
    $scope.revertView = function() {
    	for (i in $scope.apps) {
            if ($scope.apps[i].id == $scope.currentapp.id)
            	$scope.currentapp = angular.copy($scope.apps[i]);
        }
    };
    
    $scope.reset = function() {
    	if($scope.apps.length > 0){
    		$scope.select(0, $scope.apps[0]);
    		$scope.$digest();
    	} else {
    		$scope.current_selected = -1;
        	$scope.last_selected = -1;
    	}
    	
    	//var myEl = angular.element( document.querySelector( '#app_pannel' ) );
    	//myEl.addClass('hovering');
    	//myEl.attr("style", "border: 1px solid #888888; box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2)");
    };
    
    $scope.openAuth = function() {
    	$scope.authenticationModal = true;	 
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
    };
    
    // Getting user info
    $scope.getUserInfo = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    var uri = ($scope.userProfile.webid.indexOf('#') >= 0)?$scope.userProfile.webid.slice(0, $scope.userProfile.webid.indexOf('#')):$scope.userProfile.webid;
	    
	    f.nowOrWhenFetched(uri ,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
			var FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
	
			var evs = g.statementsMatching($rdf.sym($scope.userProfile.webid), RDF('type'), FOAF('Person'));
			if (evs.length > 0) {
				for (var e in evs) {
					var prfs = g.anyStatementMatching(evs[e]['subject'], SPACE('preferencesFile'))['object']['value'];
					var fullname = g.anyStatementMatching(evs[e]['subject'], FOAF('name'))['object']['value'];
					var image = g.anyStatementMatching(evs[e]['subject'], FOAF('img'))['object']['value'];
					
					if (prfs && prfs.length > 0) {
                        $scope.userProfile.preferencesFile = prfs;
                        $scope.getWorkspaces(prfs);

                        var split = $scope.userProfile.preferencesFile.split("/");
                        var prfsDir = "";
                        for(var i=0; i<split.length-1; i++){
                            prfsDir += split[i] + "/";
                        }
                        
                        $scope.userProfile.preferencesDir = prfsDir;
                    } 
					
					$scope.userProfile.fullname = fullname;
					$scope.userProfile.image = image;
					$scope.saveCredentials();
                    $scope.$apply();
                }
			}
			
			//$scope.getWorkspaces();
	    });
    };
    
    // Getting user preferences
    $scope.getPreferences = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    $scope.apps.length = 0;
	    var uri = $scope.userProfile.preferencesDir;
	    
	    f.nowOrWhenFetched(uri + '*',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var APP = $rdf.Namespace('https://example.com/');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), APP('application'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					
					var title = g.anyStatementMatching(evs[e]['subject'], DC('title'))['object']['value'];
					
					var types = g.anyStatementMatching(evs[e]['subject'], APP('types'))['object']['value'];
					
					var logo = g.anyStatementMatching(evs[e]['subject'], APP('logo'))['object']['value'];
					
					var app_url = g.anyStatementMatching(evs[e]['subject'], APP('app-url'))['object']['value'];
					
					var index = g.anyStatementMatching(evs[e]['subject'], APP('index'))['object']['value'];
					
					var storages_array = g.statementsMatching(evs[e]['subject'], SPACE('storage'));
					var storages = [];
					for (var s in storages_array) {
						storages.push(storages_array[s]['object']['value']);
					}
					
					var workspaces_array = g.statementsMatching(evs[e]['subject'], SPACE('workspace'));
					var workspaces = [];
					for (var w in workspaces_array) {
						workspaces.push(workspaces_array[w]['object']['value']);
					}
					
					var app = {
					    id: id,
					    title: title,
					    types: types,
					    storage: storages,
					    enabled_workspaces: workspaces,
					    logo: logo,
					    url: app_url,
					    index_file: index
					};

					$scope.apps.push(app);
                    $scope.$apply();
                }
			}
			
			$scope.reset();
	    });
    };
    
    // Gets workspaces
    $scope.getWorkspaces = function (uri) {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching($rdf.sym($scope.userProfile.webid), SPACE('preferencesFile'), $rdf.sym(uri));
			if (evs.length > 0) {
                var workspaces = [];
				for (var e in evs) {
					var ws = g.statementsMatching(evs[e]['subject'], SPACE('workspace'));
					
					for (var s in ws) {
						var workspace = ws[s]['object']['value'];
						workspaces.push(workspace);
					}
                    //$scope.$apply();
                }
                $scope.userProfile.workspaces = workspaces;
			}
			
			$scope.getPreferences();
	    });
    };
       
    // Updates a resource
    $scope.update = function (resource) {
	    var uri = $scope.currentapp.id;
        $http({
          method: 'PUT', 
          url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
        	notify('Success', 'Resource updated.');
        	//update view
        	$scope.updateView();
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status + data);
          }
          //revert view
          $scope.revertView();     	 
        });
    };
        
    // Deletes a resource
    $scope.remove = function () {
        var uri = $scope.currentapp.id;
    	$http({
    	      method: 'DELETE',
    	      url: uri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	notify('Success', 'Resource deleted.');
    	        //update view
    	    	var indexOf = $scope.apps.indexOf($scope.get($scope.currentapp.id));
    	    	if (indexOf !== -1) {
    	    		$scope.apps.splice(indexOf, 1);
    	    	}
    	    	//update view
    	    	$scope.reset();
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  notify('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  console.log('Failed', status + data);
    	      }
    	      //revert view
    	      //$scope.revertView();
    	});
    };
           
    // Composes an RDF template for the resource
    $scope.metadataTemplate = function (app) {
    	var storage_string = "";
    	for(i in app.storage){
    		storage_string += "<" + app.storage[i] + ">";
    		if(i != app.storage.length-1)
    			storage_string += ", ";
 		}
    	
    	var workspace_string = "";
    	for(i in app.enabled_workspaces){
    		workspace_string += "<" + app.enabled_workspaces[i] + ">";
    		if(i != app.enabled_workspaces.length-1)
    			workspace_string += ", ";
 		}
    	
    	var rdf = "<" + app.id + ">\n" +
          		 "a <https://example.com/application> ;\n" +
          		 "<http://purl.org/dc/elements/1.1/title> \"" + app.title + "\" ;\n" +
          		 "<https://example.com/app-url> <" + app.url + "> ;\n" + 
          		 "<https://example.com/index> <" + app.index_file + "> ;\n" +
          		 "<https://example.com/logo> <" + app.logo + "> ;\n" +
          		 "<https://example.com/types> <" + app.types + "> ;\n" +
          		 "<http://www.w3.org/ns/pim/space#storage> " + storage_string + " ;\n" +
    			 "<http://www.w3.org/ns/pim/space#workspace> " + workspace_string + " .";
       
       return rdf;
    };
          
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.userProfile.webid = e.data.slice(5);
            //get user information
            $scope.getUserInfo();
        }
        
        $scope.closeAuth();
    },false);
    
    // Retrieve from sessionStorage
    if (sessionStorage.getItem($scope.appuri)) {
        var app = JSON.parse(sessionStorage.getItem($scope.appuri));
        if (app.userProfile) {
          //if (!$scope.userProfile) {
          //  $scope.userProfile = {};
          //}
          $scope.userProfile = app.userProfile;
          $scope.getUserInfo();
          $scope.loggedin = true;
        } else {
          //clear sessionStorage in case there was a change to the data structure
          sessionStorage.removeItem($scope.appuri);
        }
    }
    
});

