importScripts('//cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.8/xlsx.full.min.js');postMessage({t:'ready'});onmessage=function(e){var v;try {v=XLSX.read(e.data.d, e.data.b);}catch(r){postMessage({t:"e",d:r.stack});} postMessage({t:e.data.t, d:JSON.stringify(v)});}
