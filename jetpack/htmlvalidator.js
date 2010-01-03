var manifest = {
	settings : [
		{
			name : "autorun",
			type : "boolean",
			label : "autorun",
			default : true
		}
	]
};

jetpack.statusBar.append({
	html : 'HTML Validator<span id="validation-error-count">Hejsan</span>',
	onReady : function (widget) {
		
		// Check for settings once it works properly with Jetpack...
		//jetpack.storage.settings.autorun
				
		var validate = function () {
			var url = "http://validator.nu/?doc=" + jetpack.tabs.focused.contentWindow.location.href + "&out=json",
				xhr = new XMLHttpRequest();
				
			// If the result is finished, send validation results to the page
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					
					try {
						var results = JSON.parse(xhr.responseText),
							messages = results.messages,
							errors = [],
							resultsPresentationContent,
							message,
							error,
							errorLength,
							validationInfoLink;
						}
						catch (e) {
							console.log('Validation failed. Please try again or <a href="http://validator.w3.org/check?uri=' + encodeURIComponent(location.href) + '" target="_blank">validate this page at W3C</a>');
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
					jetpack.notifications.show(errorLength + " validation errors");
					
					// This doesn't work...
					$(widget).find("#validation-error-count").html(" - " + errorLength + " errors");
					
					resultsPresentation = $(jetpack.tabs.focused.contentDocument).find("#html-validation-results");
					if (resultsPresentation.length === 0) {
						resultsPresentation = $('<div id="html-validation-results" />', jetpack.tabs.focused.contentDocument.body);
						$(jetpack.tabs.focused.contentDocument.body).append(resultsPresentation);
						// TODO: Insert CSS styling some way
					}

					resultsPresentation[0].innerHTML = '<span id="html-validation-close" title="Close">X</span><h1 class="">Validation Output: ' + ((errorLength === 0)? '<span class="valid">This document is valid!</span>' : '<span class="invalid">' + errorLength + ' errors</span>') + '</h1>';
					resultsPresentationContent = $('<div id="html-validation-results-content" />', jetpack.tabs.focused.contentDocument.body).appendTo(resultsPresentation);
					resultsPresentationContent[0].innerHTML = '';

					for (var j=0, jl=errorLength; j<jl; j++) {
						error = errors[j];
						resultsPresentationContent.append($('<div class="html-validation-error">Line ' + error.line
						 	+ ', column ' + error.column + ': '
						 	+ '<b>' + error.message + '</b>'
						 + ' </div>', jetpack.tabs.focused.contentDocument.body));
					}

					validationInfoLink = $('<div id="html-validation-source">Validation provided by <a href="http://validator.nu/?doc=' + url + '" title="Validate this URL at the Validator.nu web site" target="_blank">Validator.nu</a></div>', jetpack.tabs.focused.contentDocument.body).appendTo(resultsPresentationContent);

					resultsPresentation.animate({
						height : 200
					}, 100);

					$("#html-validation-close", jetpack.tabs.focused.contentDocument.body).click(function () {
						hideResultsPresentation();
					});
				}
			};
				
			xhr.open("GET", url, true);
			xhr.send(null);	
			
			// Opens the W3C validator with the URL of the current tab - should be setting-controlled
			//jetpack.tabs.open("http://validator.w3.org/check?uri=" + jetpack.tabs.focused.contentWindow.location.href);
		}
		
		$(widget).click(function () {
			validate();
		});	
	} 
});