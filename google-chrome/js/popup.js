var htmlvalidatorpopup = function () {
	var backgroundPage = chrome.extension.getBackgroundPage().htmlvalidatorbackground,
		
	init = function () {
		document.getElementById("inline-validation").onclick = function () {
			backgroundPage.validate("inline");
		};
		document.getElementById("new-tab-validation").onclick = function () {
			backgroundPage.validate("new-tab");
		};
		document.getElementById("validate-local-html").onclick = function () {
			backgroundPage.validate("validate-local-html");
		};
		
		if (backgroundPage.getPref("iconclick") === "iconvalidate") {
			backgroundPage.validate();
		}
		
		
		var errorList = backgroundPage.getPref("errorlist");
		if (typeof errorList === "undefined" || errorList === "showerrorlistatclick") {
			backgroundPage.createErrorList();
		}
		
		document.getElementById("showerrorlist").onclick = reloadTab;
		document.getElementById("noerrorlist").onclick = reloadTab;
	},

	hideResultsPresentation = function () {
		backgroundPage.hideResultsPresentation();
	},

	reloadTab = function () {
		chrome.tabs.getSelected(null, function (tab) {
			chrome.tabs.update(tab.id, {
				url : tab.url
			});
		});
	};

	return {
		init : init,
		hideResultsPresentation : hideResultsPresentation
	};
	}();
	window.onload = function () {
	htmlvalidatorpopup.init();
	if (typeof htmlvalidatoroptions !== "undefined") {
		htmlvalidatoroptions.init();
	}	
	};

	document.onkeydown = function (evt) {
	if (evt.keyCode === 27) {
		htmlvalidatorpopup.hideResultsPresentation();
	}
	};