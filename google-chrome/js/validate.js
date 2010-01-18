var htmlvalidator = function () {
	var hasBeenValidated = false,
		body = $(document.body),
		resultsPresentation,
		loading,
		messagePresentation,
		messagePresentationContent,
		url, 
		errors, 
		errorLength,
	
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
			else if (evt.keyCode === 27) {
				hideResultsPresentation();
			}
		});
			
		chrome.extension.onRequest.addListener(receiveRequest);
		
		loading = $('<div id="html-validator-loading"><img src="' + chrome.extension.getURL("images/loading.gif") + ' " />Validating...</div>').appendTo(body);
		loading.css({
			left : ($(document).width() / 2) - (loading.width() / 2),
			top : "30%"
		});
		
		messagePresentation = $('<div id="html-validator-message"><span id="html-validation-message-close">X</span><div id="html-validator-message-content"></div></div>').appendTo(body);
		messagePresentation.css({
			left : ($(document).width() / 2) - (messagePresentation.width() / 2),
			top : "30%"
		});
		messagePresentationContent = $("#html-validator-message-content");
		$("#html-validation-message-close").click(function () {
			messagePresentation.fadeOut("fast");
		});
	},
	
	hideResultsPresentation = function () {
		hasBeenValidated = false;
		if (resultsPresentation.length > 0) {
			resultsPresentation.slideUp(100, function () {
				resultsPresentation.css({
					height : 0
				});
			});
		}
	},
	
	showMessage = function (message) {
		messagePresentationContent[0].innerHTML = message;
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
			else if (requestResultsMessage === "create-error-list") {
				createErrorList();
			}
			else if (requestResultsMessage === "hide-error-list") {
				hideResultsPresentation();
			}
			else if (requestResultsMessage === "validate-local-html") {
				var xhr = new XMLHttpRequest();

				// If the result is finished, send complete page HTML code to W3C validator
				xhr.onreadystatechange = function () {
					if (xhr.readyState === 4) {
						var htmlForm = $("#post-html-for-validation");
						if (htmlForm.length === 0) {
							htmlForm = $('<form id="post-html-for-validation" method="post" action="' + "http://validator.w3.org/check" + '" target="_blank"><input type="text" id="fragment" name="fragment" value=\'' + xhr.responseText.replace(/'/g, "&#145;") + '\'></form>').appendTo(document.body);
						}
						htmlForm[0].submit();
					}
				};

				// Send XHR request to itself to get the entire HTML code
				xhr.open("GET", location.href, true);
				xhr.send(null);
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
					resultsPresentationContent,
					message,
					error,
					validationInfoLink;
					
					url = results.url;
					errors = [];
				}
				catch (e) {
					chrome.extension.sendRequest({
							setBadgeValues : true,
							errors : "X"
						}
					);
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
				else if (message.type === "non-document-error" && message.message.indexOf("HTTP resource not retrievable") !== -1) {
					chrome.extension.sendRequest({
							setBadgeValues : true,
							errors : "X"
						}
					);
					errorLength = "Can't validate this document";
					return showMessage('Validation failed since this is a <br>protecteded page/local file. <br><br>Please use the option "Validate local HTML" in the menu instead');
				}
			}

			errorLength = errors.length;
			chrome.extension.sendRequest({
					setBadgeValues : true,
					errors : errorLength
				}
			);
			
			if (showErrorList === "showerrorlist") {
				createErrorList();
			}
		}
		return requestResults;
	},
	
	createErrorList = function () {
		
		if (typeof errorLength === "undefined") {
			return setTimeout(function () {
				createErrorList();
			}, 100);
		}
		
		resultsPresentation = $("#html-validation-results");
		if (resultsPresentation.length === 0) {
			resultsPresentation = $('<div id="html-validation-results" />');
			body.append(resultsPresentation);
		}
		
		resultsPresentation[0].innerHTML = '<span id="html-validation-close" title="Close">X</span><h1 class="">Validation Output: ' + ((errorLength === 0)? '<span class="valid">This document is valid!</span>' : '<span class="invalid">' + ((typeof errorLength === "number")? (errorLength + " errors") : errorLength) + ' </span>') + '</h1>';
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
		
		return true;
	};
	
	return {
		init : init
	};
}();
htmlvalidator.init();