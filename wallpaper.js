document.addEventListener('DOMContentLoaded', draw, false);

function draw(){
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const width = 1920*2;
	const height = 1080*2;
	canvas.height = height;
	canvas.width = width;

	// line segments (either few, or fluent lines (200))
	let segments = 1 + Math.floor( 9 * Math.random() );
	if( Math.random() < 0.5 ){
		segments = 200;
	}
	
	// other random values
	const layers = 3 + Math.floor( 10 * Math.random() );
	const hueStart = 360 * Math.random();
	const hueIncrement = 20 - ( 40 * Math.random() );
	const wl = width / ( 5 + ( 10 * Math.random() ) );
	const ampl = ( 0.1 * wl ) + ( 0.9 * wl ) * Math.random();
	const offset = width * Math.random();
	const offsetIncrement = width/20 + (width/10) * Math.random();
	const sat = 10 + ( 30 * Math.random() );
	const light = 15 + ( 45 * Math.random() );
	const lightIncrement = ( Math.random() < 0.5 ) ? ( 2 + ( 4 * Math.random() ) ) : -( 2 + ( 4 * Math.random() ) );

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
	const pngURL = canvas.toDataURL();
	const container = document.querySelector("#container");
	const img = document.createElement("img");
	img.src = pngURL;
	img.id = "result";
	container.appendChild(img);
}