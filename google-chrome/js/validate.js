var htmlvalidator = function () {
	var hasBeenValidated = false,
		body = $(document.body),
		resultsPresentation,
		loading,
		messagePresentation,
	
	init = function () {
		chrome.extension.sendRequest({
				setBadgeValues : true,
				errors : ""
			}
		);
		
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
					hideResultsPresentation();
				}
			}	
		});
			
		chrome.extension.onRequest.addListener(receiveRequest);
		
		loading = $('<div id="html-validator-loading"><img src="' + chrome.extension.getURL("images/loading.gif") + ' " />Validating...</div>').appendTo(body);
		loading.css({
			left : ($(document).width() / 2) - (loading.width() / 2),
			top : "30%"
		});
		
		messagePresentation = $('<div id="html-validator-message" />').appendTo(body);
		messagePresentation.css({
			left : ($(document).width() / 2) - (messagePresentation.width() / 2),
			top : "30%"
		});
	},
	
	hideResultsPresentation = function () {
		hasBeenValidated = false;
		resultsPresentation.slideUp(100, function () {
			resultsPresentation.css({
				height : 0
			});
		});
	},
	
	showMessage = function (message) {
		messagePresentation[0].innerHTML = message;
		messagePresentation.fadeIn("fast");
	},

	validate = function (validation) {
		chrome.extension.sendRequest({
				//html : document.documentElement.firstChild.nodeValue.replace(/[\n\r\t]/g, "")
				validate : true,
				validation : validation || "inline"
			}
		);
	},
	
	receiveRequest = function (request, sender, sendResponse) {
		var requestResults = request.results;
		if (typeof requestResults === "object") {
			var requestResultsMessage = requestResults.message;
			if (requestResultsMessage === "show-loading") {
				loading.show();
			}
			else if (requestResultsMessage === "hide-loading") {
				loading.hide();
			}
			else {
				loading.hide();
				showMessage(requestResultsMessage);
			}
		}
		else {
			loading.hide();
			hasBeenValidated = true;
			try {
				var results = JSON.parse(requestResults),
					messages = results.messages,
					showErrorList = request.showErrorList,
					url = results.url,
					errors = [],
					resultsPresentationContent,
					message,
					error,
					errorLength,
					validationInfoLink;
				}
				catch (e) {
					showMessage('Validation failed. Please try again or <a href="http://validator.w3.org/check?uri=' + encodeURIComponent(location.href) + '" target="_blank">validate this page at W3C</a>');
				}	

			for (var i=0, il=messages.length; i<il; i++) {
				message = messages[i];
				if (message.type === "error") {
					errors.push({
						"line" : message.lastLine,
						"column" : message.lastColumn,
						"message" : message.message
					});
				}
			}

			errorLength = errors.length;
			chrome.extension.sendRequest({
					setBadgeValues : true,
					errors : errorLength
				}
			);
			
			if (showErrorList === "showerrorlist") {
				resultsPresentation = $("#html-validation-results");
				if (resultsPresentation.length === 0) {
					resultsPresentation = $('<div id="html-validation-results" />');
					body.append(resultsPresentation);
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
					hideResultsPresentation();
				});
			}
		}
	};
	
	return {
		init : init
	};
}();
htmlvalidator.init();


window.htmlvalidator = htmlvalidator;