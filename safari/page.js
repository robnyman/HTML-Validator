var htmlValidatorPage = function () {
	var errors = null,
		init = function () {
			if (location.href === top.location.href) {
				// Check autorun
				safari.self.tab.dispatchMessage("autorun", true);
			
				// Handle messages
				safari.self.addEventListener("message", handleMessage, false);
			
				// Update error count on window focus
				window.addEventListener("focus", updateErrorCount, true);
			}
		},
		
		handleMessage = function (e) {
			var name = e.name,
				msg = e.message;
			if (name === "validate-local") {

				var documentDocType = document.doctype,
					doctype = '<!DOCTYPE ' + documentDocType.name,
					documentHtmlElement = document.documentElement,
					htmlElement = "<html",
					pageHTMLCode;

				// Getting doctype	
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

				// Create form to post content to W3C
				var form = document.getElementById("html-validator-extension"),
					formText = document.getElementById("html-validator-extension-code");
				if (!form) {
					form = document.createElement("form");
					formText = document.createElement("input");

					form.id = "html-validator-extension";
					form.action = "http://validator.w3.org/check";
					form.enctype = "multipart/form-data";
					form.method = "POST";
					//form.target = "_blank";
					form.target = "_top";

					formText.id = "html-validator-extension-code";
					formText.name = "fragment";

					form.appendChild(formText);
				}

				formText.value = pageHTMLCode;
				form.submit();
			}
			else if (name === "cache-errors") {
				errors = msg;
				updateErrorCount();
			}
			else if (name === "get-errors") {
				updateErrorCount();
			}
		},
		
		updateErrorCount = function () {
			safari.self.tab.dispatchMessage("display-errors", errors);
		};
	
	return {
		init : init
	};
}();
htmlValidatorPage.init();