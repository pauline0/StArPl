// generelle JS-Funktionen, die nicht seitenspeziefisch sind
// muss zwangsläufig vor der seitenzugehörigen .js-Datei eingebunden werden

// GET-Paras
function getGetParas()
{
	var n=window.location.search.substring(1).split("&");
	if(n.length)
	{
		for(var t={},e=0;e<n.length;e++)
		{
			var a=n[e].split("=");
			t[unescape(a[0])]=unescape(a[1])
		}
		window.$_GET=function(n)
		{
			return n?t[n]:t
		}
	}
}