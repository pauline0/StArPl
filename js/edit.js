$.Mustache.add('tag-template', '<span data-sw="" class="label label-{{labelClass}}" {{{additionalAttr}}}> {{value}} {{{icon}}}</span>');
var searchword = {
   inputId: "#schlagwort",
   readdIcon: ' <span class="glyphicon glyphicon-repeat glyph-button" onclick="searchword.removeDeleteRequest($(this))"></span>',
   removeNewIcon: ' <span class="glyphicon glyphicon-remove glyph-button" onclick="searchword.removeNew($(this))"></span>',
   deleteIcon: ' <span class="glyphicon glyphicon-remove glyph-button" onclick="searchword.delete($(this))"></span>',

   getLabel : function(value, icon, labelClass="default", additionalAttr=""){
     var data = {
       "value":value,
       "icon":icon,
       "labelClass":labelClass,
       "additionalAttr":additionalAttr
     }
     return $.Mustache.render('tag-template', data)
  },

  delete: function(delButton){
  	swElement = delButton.parent();
  	swElement.addClass("delSW");
  	swElement.html(htmlEncode(swElement.text()) + searchword.readdIcon);
  },

  removeDeleteRequest: function(swElement){
  	swElement.parent().removeClass("delSW");
  	swElement.parent().html(htmlEncode(swElement.parent().text()) + searchword.deleteIcon );
  },

  removeNew : function(elem){
  	elem[0].parentNode.remove();
  },

  add: function(){
  	var text = $(this.inputId)[0].value.replace("'", "\'");
  	if (text === ""){
  		return;
  	}
    var value = text.replace('"', '\"');

		var additionalAttr = "id='sw_"+ $("#"+edit.swDiv).children().length.toString() +"'"
		var swContent = text + searchword.removeNewIcon;
    searchword.append(value, searchword.removeNewIcon, "default addSW", additionalAttr );
		$(this.inputId)[0].value = "";
  },

  append: function(value,icon, cssClasses, additionalAttr){
    var newSwElem = searchword.getLabel(value,icon, cssClasses, additionalAttr) + " "
    $("#"+edit.swDiv).append(newSwElem);
    document.getElementById(edit.swDiv).lastElementChild.dataset.sw = value;
  }
}

var edit = {
  swDiv:"arbeitSearchwords",

  renderFiles : function(selectedArbeit){
  	var strHtml = "";
  	for (var file in selectedArbeit.dateien)
  	{
  		var selectedFile = selectedArbeit.dateien[file];
  		strHtml += '<div><a target="_blank" href="upload/' + selectedArbeit.Id+ '/' + selectedFile + '">';
  		if (selectedFile.substr(selectedFile.length - 4, 4) == '.pdf')
  		{
  			strHtml += '<img src="'+settings.iconFilePdf+'">';
  		}
  		strHtml += selectedFile + '</a><span class="glyphicon glyphicon-trash" onclick="deleteFile($(this),'+selectedArbeit.Id+')"></span></div>';
  	}
  	return strHtml;
  },

  displaySearchWords : function(searchWords){
  	$("#" + this.swDiv).empty();
  	var searchWordHtml = settings.text.searchwords+": "
  	$(searchWords).each(function(i, e){
  		var swContent = e + searchword.deleteIcon;
  		var additionalAttr = 'id="sw_'+ i.toString() +'"';
      searchword.append(e, searchword.deleteIcon, "default", additionalAttr);
  	})
  }

}
