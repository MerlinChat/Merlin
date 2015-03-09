app= angular.module("MerlinChat")
app.controller("rosterController",($scope,$rootScope)->


	xmpp.registerHandler('presence',(presence)->
		$rootScope.$broadcast('rosterUpdate',{})
		return
	)
	xmpp.registerHandler('roster',(iq)->
		$rootScope.$broadcast('rosterUpdate',{})
		xmpp.presence()
		return
	)
	xmpp.registerHandler('message',(message)->
		$rootScope.$broadcast('newMessage',{message:message})
		return
	)


	xmpp.registerHandler('vcard',(iq)->
		$rootScope.$broadcast('rosterUpdate',{})
		return
	)


	xmpp.setupHandlers()

	xmpp.fetchRoster()


	$scope.roster=xmpp.getDefaultRoster()

	$scope.getRoster=->
		$scope.roster

	$scope.getStatusIcon=(jid)->

		classIcon= "fa "
		if $scope.roster[jid]
			if $scope.roster[jid].status=="online"
				classIcon += ' online fa-circle'

			else if $scope.roster[jid].status=="away"
				classIcon += ' away fa-arrow-circle-right'

			else if $scope.roster[jid].status=="offline"
				classIcon += ' offline fa-times-circle'

			else if $scope.roster[jid].status=="dnd"
				classIcon += 'dnd fa-minus-circle'

			else
				classIcon +=$scope.roster[jid].status

		classIcon
	$scope.$on("rosterUpdate",(event,body)->
		$scope.roster=xmpp.getDefaultRoster()
		if !$scope.$$phase
			$scope.$apply()
		return

	)
	$scope.$on("newMessage",(event,body)->
		$scope.roster=xmpp.getDefaultRoster()
		if!$scope.$$phase
			$scope.$apply()
		return
	)
	return


)