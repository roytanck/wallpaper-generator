document.addEventListener( 'DOMContentLoaded', draw, false );

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
	"wl"
];

/**
 * Generate a set of randomized values to create a wallpaper from.
 */
function generateValues( width ){
	// line segments (either few, or fluent lines (200))
	const segments = ( Math.random() < 0.5 ) ? 1 + Math.floor( 9 * Math.random() ) : 200;
	// wavelength
	const wl = width / ( 5 + ( 15 * Math.random() ) );

	// other random values
	return {
		segments,
		wl,
		layers: 3 + Math.floor( 10 * Math.random() ),
		hueStart: 360 * Math.random(),
		hueIncrement: 20 - ( 40 * ( Math.random() ) ),
		ampl: ( 0.1 * wl ) + ( 0.9 * wl ) * Math.random(),
		offset: width * Math.random(),
		offsetIncrement: width / 20 + ( width / 10 ) * Math.random(),
		sat: 15 + ( 35 * Math.random() ),
		light: 15 + ( 45 * Math.random() ),
		lightIncrement: ( Math.random() < 0.5 ) ? ( 2 + ( 4 * Math.random() ) ) : -( 2 + ( 4 * Math.random() ) )
	};
}

/**
 * Draw the wallpaper onto the canvas, using values from the URL or a fresh set.
 */
function draw(){
	const canvas = document.querySelector( 'canvas' );
	const ctx = canvas.getContext( '2d' );
	const width = 3840;
	const height = 2160;

	const values = getDataFromUrl() ?? generateValues( width );
	const {
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
	} = values;

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

	setLinks( canvas.toDataURL(), encodeValues(values) );
}

/**
 * Set the href for the download and share links
 */
 function setLinks( imageData, encodedValues ){
	// Allows to download the image, whatever the device
	const dlLink = document.querySelector( 'a#download' );
	dlLink.href = imageData;
	// Allows to share a given wallpaper, generating the exact same one
	// We could push the query parameter automatically with "window.history.pushState"
	const shareLink = document.querySelector( 'a#share' );
	shareLink.href = "?share=" + encodedValues;
	// Allows to refresh the page, no matter where the website is hosted (dev,
	// prod, new domain name, etc.)
	const newLink = document.querySelector( 'a#new' );
	newLink.href = window.location.pathname;
}

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
	const data = window.atob( encoded );
	// Quick validation for malformed "share" query parameter
	if( data.match(/,/g).length !== 10 ){
		return null;
	}
	// Should have sorted keys based on "keysReference"
	const values = data.split( ',' );
	const mappedValues = keysReference.reduce( ( obj, key, index ) => ({
		...obj,
		[ key ]: Number( values[ index ] )
	}), {});
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
