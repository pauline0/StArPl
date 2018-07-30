var searchword = {
   inputId: "#schlagwort",
   readdIcon: ' <span class="glyphicon glyphicon-repeat " onclick="searchword.removeDeleteRequest($(this))"></span>',
   removeNewIcon: ' <span class="glyphicon glyphicon-remove" onclick="searchword.removeNew($(this))"></span>',
   deleteIcon: ' <span class="glyphicon glyphicon-remove" onclick="searchword.delete($(this))"></span>',

   getLabel : function(content, value, labelClass="default", additionalAttr=""){
  	return '<span value="'+value+
              '"class="label label-'+labelClass+'"'+
              additionalAttr +'>' +
                content +
            '</span> '
  },

  delete: function(delButton){
  	swElement = delButton.parent();
  	swElement.addClass("delSW");
  	swElement.html(swElement.text() + searchword.readdIcon);
  },

  removeDeleteRequest: function(swElement){
  	swElement.parent().removeClass("delSW");
  	swElement.parent().html(swElement.parent().text() + searchword.deleteIcon );
  },

  removeNew : function(elem){
  	elem[0].parentNode.remove();
  },

  add: function(){
  	var text = $(this.inputId)[0].value;
  	if (text === ""){
  		return;
  	}

  	//check if searchword already exists for this document
  	var swExists = ($(edit.swDiv).children("[value='"+ text +"']").length > 0);
  	if (!swExists){
  		var additionalAttr = "id='sw_"+ $(edit.swDiv).children().length.toString() +"'"
  		var swContent = text + searchword.removeNewIcon;
  		var newSwElem = searchword.getLabel(swContent,text, "default addSW", additionalAttr)
  		$(edit.swDiv).append(newSwElem);

  		$(this.inputId)[0].value = "";
  	}
  	else{
  		alert(settings.errors.duplicateSearchword);
  	}
  }
}

var edit = {
  swDiv:"#arbeitSearchwords",

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
  	$(this.swDiv).empty();
  	var searchWordHtml = settings.text.searchwords+": "
  	$(searchWords).each(function(i, e){
  		var swContent = e + searchword.deleteIcon;
  		var additionalAttr = 'id="sw_'+ i.toString() +'"';
  		searchWordHtml += searchword.getLabel(swContent,e, "default", additionalAttr)
  	})
  	$(this.swDiv).html(searchWordHtml);
  }

}
