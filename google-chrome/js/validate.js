function validate () {
	chrome.extension.sendRequest({
			//html : document.documentElement.firstChild.nodeValue.replace(/[\n\r\t]/g, "")
			validate : true
		}
	);
}

chrome.extension.sendRequest({
		autoruncheck : true
	}
);

document.onkeydown = function (evt) {
	if ((evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.keyCode === 86) {
		validate();
	}
};

chrome.extension.onRequest.addListener(
	function (request, sender, sendResponse) {
		var results = JSON.parse(request.results),
			messages = results.messages,
			errors = [],
			resultsPresentation = $("#html-validation-results"),
			resultsPresentationContent,
			message,
			error,
			errorLength,
			hasErrors;
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
		resultsPresentation.show("fast");
		
		$("#html-validation-close").click(function () {
			resultsPresentation.hide("fast");
		});
	}
);