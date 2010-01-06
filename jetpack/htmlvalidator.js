// Settings - seems like it has to be global
var manifest = {
	settings : [
		{
			name : "autorun",
			type : "boolean",
			label : "Autorun",
			default : true
		}
	]
}

// HTML Validator functionality
var htmlValidator = function () {
	var validationErrorCount = null;	
	return {
		init : function () {
			jetpack.tabs.onFocus(function () {
				if (validationErrorCount && validationErrorCount.length > 0) {
					validationErrorCount.html("Validate");
				}
			});

			jetpack.statusBar.append({
				html : '<style type="text/css">#html-validation-icon{vertical-align: middle; margin-right: 5px} #validation-error-count{cursor: default}</style><img id="html-validation-icon" src="http://github.com/robnyman/HTML-Validator/raw/master/jetpack/images/icon-16.png"><span id="validation-error-count">Validate</span>',
				width : 80,
				onReady : function (doc) {
					// Check for settings once it works properly with Jetpack...
					//jetpack.storage.settings.autorun

					var showResultsPresentation = function () {
							resultsPresentation.css("visibility", "visible").animate({
								height : 200
							}, 100);
						},
						hideResultsPresentation = function () {
							resultsPresentation.slideUp(100, function () {
								resultsPresentation.css({
									height : 0
								});
							});
						};

					var validate = function () {
						var url = "http://validator.nu/?doc=" + jetpack.tabs.focused.contentWindow.location.href.replace(/#[^\?]+/, "") + "&out=json", // Replace hash for bookmarks since it throws the validator
							cleanUrl = url.replace(/&out=json/, ""),
							xhr = new XMLHttpRequest(),
							errorCount = $(doc).find("#validation-error-count"),
							contentDoc = jetpack.tabs.focused.contentDocument;

						validationErrorCount = errorCount;	

						$(contentDoc).keydown(function (evt) {
							if (evt.keyCode === 27) {
								hideResultsPresentation();
							}
						});	

						// If the result is finished, send validation results to the page
						xhr.onreadystatechange = function () {
							if (xhr.readyState === 4) {
								var results = JSON.parse(xhr.responseText),
									messages = results.messages,
									errors = [],
									resultsPresentationContent,
									message,
									error,
									errorLength,
									validationInfoLink;

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
								// Have this as an option in the future
								//jetpack.notifications.show(errorLength + " validation errors");

								errorCount.html(errorLength + " errors");

								resultsPresentation = $(contentDoc).find("#html-validation-results");
								if (resultsPresentation.length === 0) {
									resultsPresentation = $('<div id="html-validation-results" />', contentDoc.body);
									$(contentDoc.body).append(resultsPresentation);

									// Ugly CSS insertion
									$(contentDoc).find("head").append('<style type="text/css">#html-validator-loading {	position : absolute;	width: 150px;	z-index : 10000;	color: #fff;	font-size: 14px;	text-align: center;	background: #000;	opacity: 0.8;	border: 1px solid #000;	padding: 10px;	margin: 0 auto;	display: none;	font: 14px Helvetica, Verdana, sans-serif !important;	-moz-border-radius : 10px;	border-radius : 10px;}#html-validator-loading img {	position : absolute !important;	left: 10px !important;	top: 10px !important;}#html-validator-message {	position : absolute;	width: 300px;	z-index : 10000;	color: #fff;	font-size: 14px;	text-align: center;	background: #000;	opacity: 0.8;	border: 1px solid #000;	padding: 10px;	margin: 0 auto;	display: none;	font: 14px Helvetica, Verdana, sans-serif !important;	-moz-border-radius : 10px;	border-radius : 10px;}#html-validation-message-close {	position: absolute;	top: 3px;	right: 5px;	width: 16px;	height: 16px;	font-weight: bold;	text-align: center;	color: #fff;	background: #d23d24;	-moz-border-radius : 5px;	border-radius : 5px;	background: -moz-linear-gradient(top, #fff, #d23d24);	border: 1px solid #000;	padding-top: 3px;	cursor: pointer;}#html-validator-message a {	color: #fff;	font-weight: bold;	text-decoration: underline;	white-space: nowrap;}#html-validation-results {	position : fixed;	left: 0;	bottom: 0;	width: 100%;	height: 0;	font: 12px Helvetica, Verdana, sans-serif !important;	color: #333 !important;	background: -moz-linear-gradient(top, #fff, #111);	text-align: left;	padding: 10px;	z-index: 10001;	opacity: 0.95;	border-top: 2px solid #ccc;	margin: 0;	overflow: hidden;	-moz-box-shadow: inset 0 3px 5px #ccc; visibility: hidden}#html-validation-results h1 {	font: 16px "Gill Sans", Trebuchet, Calibri, sans-serif !important;	text-transform: uppercase;	border-bottom: 1px solid #ccc;	margin: 0;	padding: 0 10px 5px;}#html-validation-results h1 .valid {	color: #55b05a;}#html-validation-results h1 .invalid {	color: #d23d24;}#html-validation-close {	float: right;	width: 16px;	height: 16px;	font-weight: bold;	text-align: center;	color: #fff;	background: #d23d24;	-moz-border-radius : 5px;	border-radius : 5px;	background: -moz-linear-gradient(top, #fff, #d23d24 50%, #d23d24);	border: 1px solid #000;	margin: -3px 15px 0 0;	padding-top: 3px;	cursor: pointer;}#html-validation-results-content {	height: 180px;	overflow: auto;	margin: 0 10px 10px;	padding: 10px;}.html-validation-error {	background: #eee;	border: 1px solid #bbb;	border-top-width: 0;	padding: 10px;}.html-validation-error:nth-child(even) {	background: #ccc;}#html-validation-source {	font-style: italic;	color: #55b05a;	background: #eee;	border: 1px solid #bbb;	-moz-border-radius : 5px;	border-radius : 5px;	margin: 100px 0 20px;	padding: 5px 10px;}</style>');
								}

								resultsPresentation[0].innerHTML = '<span id="html-validation-close" title="Close">X</span><h1 class="">Validation Output: ' + ((errorLength === 0)? '<span class="valid">This document is valid!</span>' : '<span class="invalid">' + errorLength + ' errors</span>') + '</h1>';
								resultsPresentationContent = $('<div id="html-validation-results-content" />', contentDoc.body).appendTo(resultsPresentation);
								resultsPresentationContent[0].innerHTML = '';

								for (var j=0, jl=errorLength; j<jl; j++) {
									error = errors[j];
									resultsPresentationContent.append($('<div class="html-validation-error">Line ' + error.line
									 	+ ', column ' + error.column + ': '
									 	+ '<b>' + error.message + '</b>'
									 + ' </div>', contentDoc.body));
								}

								validationInfoLink = $('<div id="html-validation-source">Validation provided by <a href="http://validator.nu/?doc=' + cleanUrl + '" title="Validate this URL at the Validator.nu web site" target="_blank">Validator.nu</a></div>', contentDoc.body).appendTo(resultsPresentationContent);

								$("#html-validation-close", contentDoc.body).click(function () {
									hideResultsPresentation();
								});
							}
						};

						errorCount.html("<i>Validating</i>");

						xhr.open("GET", url, true);
						xhr.send(null);	

						// Opens the W3C validator with the URL of the current tab - should be setting-controlled
						//jetpack.tabs.open("http://validator.w3.org/check?uri=" + jetpack.tabs.focused.contentWindow.location.href);
					}

					// Automatically validates every page - shold be a setting in the future
					jetpack.tabs.onReady(validate);

					$(doc).click(function () {
						showResultsPresentation();
					});	
				} 
			});
		}
	}
}();
htmlValidator.init();