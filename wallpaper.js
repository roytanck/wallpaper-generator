let settings = {
	width: 1920*2,
	height: 1080*2,
}

/**
 * Load and Initialize
 */
document.addEventListener('DOMContentLoaded', () => {

	settings = getDataFromUrl() ?? {...settings, ...generateValues( settings.width )}

	const gui = new dat.GUI()
	// Dimensions
	gui.add(settings, 'width').min(128).max(7680).step(1).onChange(draw)
	gui.add(settings, 'height').min(128).max(7680).step(1).onChange(draw)
	// Colors
	settings.color = {
		h: settings.hueStart,
		s: settings.sat / 30,
		v: settings.light / 45,
	}
	gui.addColor(settings, 'color').onChange((color) => {
		settings.hueStart = color.h
		settings.sat = color.s * 30
		settings.light = color.v * 45
		draw()
	})
	gui.add(settings, 'hueIncrement').min(-40).max(40).step(1).onChange(draw)
	gui.add(settings, 'lightIncrement').min(-6).max(6).step(.1).onChange(draw)
	//
	gui.add(settings, 'wl').min(1).max(settings.width).step(1).onChange(draw)
	gui.add(settings, 'layers').min(2).max(20).step(1).onChange(draw)
	gui.add(settings, 'segments').min(1).max(200).step(1).onChange(draw)
	gui.add(settings, 'offset').min(0).max(settings.width).step(1).onChange(draw)
	gui.add(settings, 'offsetIncrement').min(0).max(settings.width).step(1).onChange(draw)

	draw()

}, false);

// Keeping the keys in a specific order to avoid issues when encoding/decoding
// the data.
const keysReference = [
	"ampl",
	"hueIncrement",
	"hueStart",
	"layers",
	"light",
	"lightIncrement",
	"offset",
	"offsetIncrement",
	"sat",
	"segments",
	"wl",
	"width",
	"height",
]

/**
 * Encodes the generated values to Base64 to be sharable. It takes an object in
 * parameters, sort the keys based on "keysReference" to make sure the encoding
 * and decoding step are consistent, join the values and encode it in base64.
 */
function encodeValues( values ){
	const joinedValues = keysReference.reduce( ( str, key, index ) =>
		str + values[ key ] + ( index < keysReference.length - 1 ? ',' : '' )
	, '');
	return window.btoa( joinedValues );
}

/**
 * Parses an base64 encoded string to get all the variables for a wallpaper.
 * See "encodeValues" for the content.
 */
function getValuesFromBase64( encoded ){
	const data = window.atob(encoded);
	// Quick validation for malformed "share" query parameter
	if(
		// with width and height
		data.match( /,/g ).length !== 12
		// without
		|| data.match( /,/g ).length === 10
	){
		return null;
	}
	// Should have sorted keys based on "keysReference"
	const values = data.split( ',' );
	const mappedValues = keysReference.reduce( ( obj, key, index ) => ({
		...obj,
		[ key ]: Number( values[ index ] )
	}), {})
	mappedValues.width = mappedValues.width || settings.width;
	mappedValues.height = mappedValues.height || settings.height;
	return mappedValues;
}

/**
 * It ill check the "share" query parameter to retrieve variables used to generate
 * a wallpaper. If present, it will parse it and return all the decoded variables.
 * Otherwise, it will return null
 */
function getDataFromUrl(){
	const params = new URLSearchParams( window.location.search );
	// Set from the "share" link, in "setLinks" function
	const share = params.get( 'share' );
	if( !share ){
		return null;
	}
	return getValuesFromBase64( share );
}

function generateValues( width ){
	// line segments (either few, or fluent lines (200))
	let segments = 1 + Math.floor( 9 * Math.random() );
	if( Math.random() < 0.5 ){
		segments = 200;
	}

	const wl = width / ( 5 + ( 10 * Math.random() ) );

	// other random values
	return {
		segments,
		wl,
		layers: 3 + Math.floor( 10 * Math.random() ),
		hueStart: 360 * Math.random(),
		hueIncrement: 20 - ( 40 * Math.random() ),
		ampl: ( 0.1 * wl ) + ( 0.9 * wl ) * Math.random(),
		offset: width * Math.random(),
		offsetIncrement: width/20 + (width/10) * Math.random(),
		sat: 10 + ( 30 * Math.random() ),
		light: 15 + ( 45 * Math.random() ),
		lightIncrement: ( Math.random() < 0.5 ) ? ( 2 + ( 4 * Math.random() ) ) : -( 2 + ( 4 * Math.random() ) )
	};
}

function setLinks( imageData, encodedValues ){
	// Allows to download the image, whatever the device
	const dlLink = document.querySelector( 'a#download' );
	dlLink.href = imageData;

	// Allows to share a given wallpaper, generating the exact same one
	// We could push the query parameter automatically with "window.history.pushState"
	const shareLink = document.querySelector( 'a#share' );
	shareLink.href = "?share=" + encodedValues;
}

function draw(){
	const canvas = document.querySelector('canvas');
	const ctx = canvas.getContext('2d');

	const {
		width,
		height,
		segments,
		layers,
		hueStart,
		hueIncrement,
		wl,
		ampl,
		offset,
		offsetIncrement,
		sat,
		light,
		lightIncrement
	} = settings;

	canvas.width = width;
	canvas.height = height;

	// background
	ctx.fillStyle = 'hsl( ' + hueStart + ', ' + sat + '%, ' + light + '% )';
	ctx.fillRect( 0, 0, width, height );

	// draw the layers
	for( let l=0; l<layers; l++ ){
		let h = hueStart + ( (l+1) * hueIncrement );
		let s = sat;
		let v = light + ( (l+1) * lightIncrement );
		ctx.fillStyle = 'hsl( ' + h + ', ' + s + '%, ' + v + '% )';
		ctx.beginPath();
		let layerOffset = offset + ( offsetIncrement * l );
		let offsetY = ( (l+0.5) * ( height / layers ) );
		let startY = offsetY + ( ampl * Math.sin( layerOffset / wl ) );
		ctx.moveTo( 0, startY );
		for( let i=0; i<=segments; i++ ){
			let x = i * ( width / segments );
			ctx.lineTo( x , startY + ( ampl * Math.sin( ( layerOffset + x ) / wl ) ) );
		}
		ctx.lineTo( width, height );
		ctx.lineTo( 0, height );
		ctx.lineTo( 0, startY );
		ctx.fill();
	}

	setLinks( canvas.toDataURL(), encodeValues(settings) );
}
