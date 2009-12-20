var htmlvalidator = function () {
	var hasBeenValidated = false,
	
	init = function () {
		chrome.extension.sendRequest({
				autoruncheck : true
			}
		);
		
		$(document).keydown(function (evt) {
			if ((evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.keyCode === 86) {
				if (!hasBeenValidated) {
					validate();
				}
				else {
					hasBeenValidated = false;
					resultsPresentation.animate({
						height : 0
					}, 100);
				}
			}	
		});
			
		chrome.extension.onRequest.addListener(receiveRequest);
		
		loading = $('<div id="html-validator-loading"><img src="' + chrome.extension.getURL("images/loading.gif") + ' " />Validating...</div>').appendTo(document.body);
		loading.css({
			left : ($(document).width() / 2) - (loading.width() / 2),
			top : "30%"
		});
	},

	validate = function () {
		chrome.extension.sendRequest({
				//html : document.documentElement.firstChild.nodeValue.replace(/[\n\r\t]/g, "")
				validate : true
			}
		);
	},
	
	receiveRequest = function (request, sender, sendResponse) {
		var requestResults = request.results;
		if (typeof requestResults === "object") {
			var requestResultsMessage = requestResults.message;
			if (requestResultsMessage === "show-loading") {
				//loading.show();
			}
			else if (requestResultsMessage === "hide-loading") {
				//loading.hide();
			}
			else {
				//loading.hide();
				alert(requestResultsMessage);
			}
		}
		else {
			//loading.hide();
			hasBeenValidated = true;
			var results = JSON.parse(requestResults),
				messages = results.messages,
				url = results.url,
				errors = [],
				resultsPresentation = $("#html-validation-results"),
				resultsPresentationContent,
				message,
				error,
				errorLength,
				hasErrors,
				validationInfoLink;

			for (var i=0, il=messages.length; i<il; i++) {
				message = messages[i];
				if (message.type === "error") {
					errors.push({
						"line" : message.lastLine,
						"column" : message.lastColumn,
						"message" : message.message
					})
				}
			}

			errorLength = errors.length;
			hasErrors = errorLength > 0;

			if (resultsPresentation.length === 0) {
				resultsPresentation = $('<div id="html-validation-results" />');
				$(document.body).append(resultsPresentation);
			}

			resultsPresentation[0].innerHTML = '<span id="html-validation-close" title="Close">X</span><h1 class="">Validation Output: ' + ((errorLength === 0)? '<span class="valid">This document is valid!</span>' : '<span class="invalid">' + errorLength + ' errors</span>') + '</h1>';
			resultsPresentationContent = $('<div id="html-validation-results-content" />').appendTo(resultsPresentation);
			resultsPresentationContent[0].innerHTML = '';

			for (var j=0, jl=errorLength; j<jl; j++) {
				error = errors[j];
				resultsPresentationContent.append($('<div class="html-validation-error">Line ' + error.line
				 	+ ', column ' + error.column + ': '
				 	+ '<b>' + error.message + '</b>'
				 + ' </div>'));
			}

			validationInfoLink = $('<div id="html-validation-source">Validation provided by <a href="http://validator.nu/?doc=' + url + '" title="Validate this URL at the Validator.nu web site" target="_blank">Validator.nu</a></div>').appendTo(resultsPresentationContent);

			resultsPresentation.animate({
				height : 200
			}, 100);

			$("#html-validation-close").click(function () {
				resultsPresentation.animate({
					height : 0
				}, 100);
			});
		}
	};
	
	return {
		init : init
	};
}();
htmlvalidator.init();