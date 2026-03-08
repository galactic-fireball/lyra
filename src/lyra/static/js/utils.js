export function log(msg) {
	console.log(msg);
}


function showElement(el) {
	el.classList.remove('hidden');
}


function hideElement(el) {
	el.classList.add('hidden');
}


export function showLoading() {
	showElement(document.querySelector('#loading-overlay'));
}


export function hideLoading() {
	hideElement(document.querySelector('#loading-overlay'));
}
