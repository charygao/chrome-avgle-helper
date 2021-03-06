import helper from "./inject_utils";

export function getInjectScript(errorStr, paramters) {
	const injectHelperName = 'chromeAvgleHelper';

	return `
		${helper.getInjectCodes(injectHelperName)};
		(${inject2player.toString()})(
			${injectHelperName},
			${JSON.stringify(errorStr)},
			${JSON.stringify(paramters)}
		);`;
}

/**
 * @param {helper} utilsContext
 * @param {string} errorStr
 * @param {*} paramters
 */
function inject2player(utilsContext, errorStr, paramters = {}) {
	/** @type {'avgle'|'xvideos'} */
	const pageType = paramters.pageType;

	const tabURL = String(paramters.tabURL || '');
	const m3u8URLBase64 = String(paramters.m3u8URLBase64 || '');
	const decodeOpt = paramters.needDecode ? 'decode=true' : '';

	let videoTitleDOM = document.querySelector('.container .row .col-lg-12 h1');

	let command = '';

	if (pageType === 'avgle') {
		// add car number for main title
		for (let node of videoTitleDOM.childNodes) {
			if (node.nodeType != Node.TEXT_NODE)
				continue;

			let videoTitle = node.textContent;
			let carNumber = utilsContext.parseCarNumber(videoTitle);
			if (!carNumber) {
				carNumber = getDefaultCarNumber();
			} else if (!document.querySelector('.chrome-avgle-extension.car-number')) {
				// if has not insert car number badge
				let carNumDOM = document.createElement('b');
				carNumDOM.className = 'text-success chrome-avgle-extension car-number';
				carNumDOM.innerText = carNumber;
				carNumDOM.style.margin = '0 .5em';
				node.parentNode.insertBefore(carNumDOM, node);
			}

			command = [
				`AvgleDownloader ${decodeOpt} name=${carNumber} url=${m3u8URLBase64};`,
				`Avgle ${carNumber}; # combine video files`
			].join('\n');
		}

	} else if (pageType === 'xvideos') {
		let carNumber = getDefaultCarNumber();
		command = [
			`AvgleDownloader type=xvideos ${decodeOpt} name=${carNumber} url=${m3u8URLBase64};`,
			`Avgle ${carNumber}; # combine video files`
		].join('\n');
	}

	let injectDiv = document.createElement('div');
	injectDiv.className = 'col-lg-12';
	if (errorStr) {
		injectDiv.className += "chrome-avgle-extension download-commands alert-danger";
		injectDiv.innerHTML = `
			Get Download Command Failed:
			<pre><code>${errorStr}</code></pre>
		`;
	} else {
		injectDiv.className += " chrome-avgle-extension download-commands";

		let css = '';
		if (pageType === 'xvideos') {
			injectDiv.className = injectDiv.className.replace('col-lg-12', '');
			css = getBootstrapStyles('.chrome-avgle-extension.download-commands');
		}
		injectDiv.innerHTML = `
			<style>${css}</style>
			Download Command:<br/>
			<pre><code>${command}</code></pre>
		`;
	}


	if (pageType === 'avgle') {
		const injectContainer = videoTitleDOM.parentNode.parentNode; // .row
		injectContainer.appendChild(injectDiv);

		const videoColumn = document.querySelector('.video-container').parentNode.parentNode;
		videoColumn.className = "col-lg-12 col-md-12 col-sm-12";

	} else if (pageType === 'xvideos') {
		const injectContainer = document.querySelector('.video-metadata.video-tags-list');
		if ((injectContainer.lastElementChild.className || '').indexOf('chrome-avgle-extension') >= 0)
			injectContainer.lastElementChild.remove();
		injectContainer.appendChild(injectDiv);
	}

	// End of injection process
	// =======================================
	//#region Helper function

	function getDefaultCarNumber() {
		if (pageType === 'avgle') {
			const avgleId = tabURL.match(/\/video\/(\w+)\//);
			return `avgle-${avgleId ? avgleId[1] : 'unknown'}`;
		}
		if (pageType === 'xvideos') {
			const videoId = tabURL.match(/\/(video\w+)\//);
			return `xvideos-${videoId ? videoId[1] : 'unknown'}`;
		}
		return 'unknown';
	}
	function getBootstrapStyles(wrapperClass = '') {
		return `
			${wrapperClass} pre {
				display: block;
				padding: 9.5px;
				margin: 0 0 10px;
				font-size: 13px;
				line-height: 1.42857143;
				word-break: break-all;
				word-wrap: break-word;
				color: #282828;
				background-color: #f5f5f5;
				border: 1px solid #ccc;
				border-radius: 4px;
			}
			${wrapperClass} pre code {
				padding: 0;
				font-size: inherit;
				color: inherit;
				white-space: pre-wrap;
				background-color: transparent;
			}
		`
	}

	//#endregion
}
