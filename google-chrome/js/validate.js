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
		chrome.runtime.sendMessage({
				setBadgeValues : true,
				errors : ""
			}
		);
		
		chrome.runtime.sendMessage({
				autoruncheck : true
			}
		);
		
		$(document).keydown(function (evt) {
			if ((evt.ctrlKey || evt.metaKey) && evt.shiftKey) {
				if (evt.keyCode === 86) {
					validate("new-tab");
				}
				else if (evt.keyCode === 65) {
					receiveRequest({
						results : {
							"message" : "validate-local-html"
						}
					});
				}
			}
			else if (evt.keyCode === 27) {
				hideResultsPresentation();
			}
		});
			
		chrome.runtime.onMessage.addListener(receiveRequest);
		
		if (!(/acid3.acidtests.org|\.(png|gif|jpe?g)$/.test(location.href))) {
			// Insert CSS manually to avoid the invalid code Google Chrome uses to do it
			var cssParent = document.getElementsByTagName("head")[0],
				extensionCSS = document.createElement("link");
			if (!cssParent) {
				cssParent = document.body;
			}
			
			extensionCSS.rel = "stylesheet";
			extensionCSS.type = "text/css";
			extensionCSS.href = chrome.extension.getURL("css/validation.css");
			cssParent.appendChild(extensionCSS);
			
			// Loading element
			loading = $('<div id="html-validator-loading"><img src="' + chrome.extension.getURL("images/loading.gif") + ' " />Validating...</div>').appendTo(body);
		
			// Presenting messages
			messagePresentation = $('<div id="html-validator-message"><span id="html-validation-message-close">X</span><div id="html-validator-message-content"></div></div>').appendTo(body);
			messagePresentationContent = $("#html-validator-message-content");
			$("#html-validation-message-close").click(function () {
				messagePresentation.fadeOut("fast");
			});
		}	
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
		chrome.runtime.sendMessage({
				validate : true,
				validation : validation || "inline"
			}
		);
	},
	
	getPageHTMLCode = function () {
		var documentDocType = document.doctype,
			doctype = '<!DOCTYPE ' + documentDocType.name,
			documentHtmlElement = document.documentElement,
			htmlElement = "<html",
			pageHTMLCode;

		// Getting doctype (doctype retrieval inspired by Dario Cangialosi, http://linkedin.com/in/dariocangialosi)
		if (documentDocType.publicId) {
			doctype += ' PUBLIC "' + documentDocType.publicId + '"';
		}
		if (documentDocType.systemId) {
			doctype += ' "' + documentDocType.systemId + '"';
		}
		doctype += '>';

		// Get HTML element attributes
		for (var i=0, il=documentHtmlElement.attributes.length, attribute; i<il; i++) {
			attribute = documentHtmlElement.attributes[i];
			htmlElement += ' ' + attribute.name + '="' + attribute.value + '"';
		};
		htmlElement += ">";

		// Concatenate all to get page code
		pageHTMLCode = doctype + htmlElement + documentHtmlElement.innerHTML;
		
		// Replace invalid code inserted with extension file URLs
		pageHTMLCode = pageHTMLCode.replace(/<[^>]*chrome\-extension:\/\/[^>]*>/g, "");
		return pageHTMLCode;
	},
	
	receiveRequest = function (request, sender, sendResponse) {
		var requestResults = request.results,
			showFailedValidation = function () {
				chrome.runtime.sendMessage({
						setBadgeValues : true,
						errors : "X"
					}
				);
				showMessage('Validation failed. Please try again or <a href="http://validator.w3.org/check?uri=' + encodeURIComponent(location.href) + '" target="_blank">validate this page at W3C</a>');
			};
		if (typeof requestResults === "object") {
			var requestResultsMessage = requestResults.message;
			if (requestResultsMessage === "show-loading") {
				loading.show();
			}
			else if (requestResultsMessage === "hide-loading") {
				loading.hide();
			}
			else if (requestResultsMessage === "hide-message") {
				messagePresentation.hide();
			}
			else if (requestResultsMessage === "show-failed-validation") {
				loading.hide();
				showFailedValidation();
			}
			else if (requestResultsMessage === "create-error-list") {
				createErrorList();
			}
			else if (requestResultsMessage === "hide-error-list") {
				hideResultsPresentation();
			}
			else if (requestResultsMessage === "validate-local-html") {
				// Code to validate generated source put on hold since Chrome's generated source omits closing slashes on meta, img and other quick-close elements
				
				if (request.results.inline) {
					// Post page itself to get entire source code
					var xhr = new XMLHttpRequest();

					// If the result is finished, send complete page HTML code to W3C validator
					xhr.onreadystatechange = function () {
						if (xhr.readyState === 4) {
							chrome.runtime.sendMessage({
								validateLocal : true,
								html : xhr.responseText
							});	
						}
					};

					// Send XHR request to itself to get the entire HTML code
					xhr.open("GET", location.href, true);
					xhr.send(null);
				}
				else {
					chrome.runtime.sendMessage({
						openNewTabForForm : true,
						url : location.href
					});
				}
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
					showFailedValidation();
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
					chrome.runtime.sendMessage({
							setBadgeValues : true,
							errors : "X"
						}
					);
					errorLength = "Can't validate this document";
					return showMessage('Validation failed since this is a <br>protecteded page/local file. <br><br>Please use the option "Validate local HTML" in the menu instead');
				}
			}

			errorLength = errors.length;
			
			if (showErrorList === "showerrorlist") {
				createErrorList();
			}
		}
		return requestResults;
	},
	
	postForm = function () {
		loading.hide();
		
		$('<div id="html-validation-overlay"><div id="html-validator-overlay-loading"><img src="' + chrome.extension.getURL("images/loading.gif") + ' " />Validating...</div></div>').appendTo(body);
		
		// Post page itself to get entire source code
		var xhr = new XMLHttpRequest();

		// If the result is finished, send complete page HTML code to W3C validator
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				
				var htmlForm = document.createElement("form"),
					htmlInput = document.createElement("input");

				htmlForm.action = "http://validator.w3.org/check";
				htmlForm.method = "post";
				htmlForm.enctype = "multipart/form-data";

				htmlInput.type = "text";
				htmlInput.name = "fragment";
				htmlInput.value = xhr.responseText;

				htmlForm.appendChild(htmlInput);

				document.body.appendChild(htmlForm);
				htmlForm.submit();
				htmlForm.parentNode.removeChild(htmlForm);
			}
		};

		// Send XHR request to itself to get the entire HTML code
		xhr.open("GET", location.href, true);
		xhr.send(null);
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

		if (!(/Form Submission/).test(url)) {
			validationInfoLink = $('<div id="html-validation-source">Validation provided by <a href="http://validator.w3.org/check?uri=' + url + '" title="Validate this URL at the W3C Validator web site" target="_blank">W3C Validator</a></div>').appendTo(resultsPresentationContent);
		}

		resultsPresentation.animate({
			height : 200
		}, 100);

		$("#html-validation-close").click(function () {
			hideResultsPresentation();
		});
		
		return true;
	};
	
	return {
		init : init,
		postForm : postForm
	};
}();
htmlvalidator.init();