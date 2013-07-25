/**
 * This file is part of the Venne:CMS (https://github.com/Venne)
 *
 * Copyright (c) 2011, 2012 Josef Kříž (http://www.josef-kriz.cz)
 *
 * For the full copyright and license information, please view
 * the file license.txt that was distributed with this source code.
 */

jQuery.extend({
	venne:{
		getBasePath:function () {
			if ($("body").attr("data-venne-basepath") !== undefined) {
				return $("body").attr("data-venne-basepath");
			} else {
				return "";
			}
		}
	}
});

$(function () {

	$('#create-new').on("click", function () {
		$(this).next().click();
	});

	$('#button-fullscreen').on('click', function (event){
		if ($('#panel').data('state') != 'closed') {
			event.preventDefault();
			$('#panel').animate({
				marginLeft: '-320px'
			}, 300).data('state', 'closed');
			$('#content').animate({
				marginLeft: '10px'
			}, 300);
		} else {
			event.preventDefault();
			$('#panel').animate({
				marginLeft: '0px'
			}, 300).data('state', null);
			$('#content').animate({
				marginLeft: '330px'
			}, 300);
		}
	});


	// Jquery plugins
	$('select[data-venne-form-textwithselect]').textWithSelect();


	// Ajax
	$.nette.ext('data-ajax-confirm', {
		before: function (xhr, settings) {
			if (settings.nette !== undefined && settings.nette.el !== undefined) {
				var question = settings.nette.el.data('confirm');
				if (question) {
					return confirm(question);
				}
			}
		}
	});
	$.nette.ext('formsValidationBind', {
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			for (var i in payload.snippets) {
				$('#' + i + ' form').each(function () {
					Nette.initForm(this);
				});
			}
		}
	});
	$.nette.ext('formsMultiSelectBind', {
		init: function(){
			this.init($('body'));
		},
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			var _this = this;
			for (var i in payload.snippets) {
				$('#' + i).each(function () {
					_this.init($(this));
				});
			}
		}
	},{
		init: function(target){
			target.find(this.selector).select2({width: 'resolve'});
		},
		selector: 'select[multiple]'
	});
	$.nette.ext('formsDateInputBind', {
		init:function () {
			this.init($('body'));
		},
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			var _this = this;
			for (var i in payload.snippets) {
				$('#' + i).each(function () {
					_this.init($(this));
				});
			}
		}
	}, {
		init: function(target) {
				target.find(this.selector).each(function(){
					var e = $(this);
					e.wrap('<div class="input-append" />')
						.after('<span class="add-on"><i data-date-icon="icon-calendar" data-time-icon="icon-time" class="icon-calendar"></i></span>')
						.parent('div')
						.datetimepicker({
							format: 'yyyy-MM-dd hh:mm:ss'
						});
				});
		},
		selector: 'input[type=date], input[type=datetime]'
	});
	$.nette.ext('formsTextWithSelectInputBind', {
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			for (var i in payload.snippets) {
				$('#' + i + ' select[data-venne-form-textwithselect]').each(function () {
					$(this).textWithSelect();
				});
			}
		}
	});
	$.nette.ext('gridBind', {
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			for (var i in payload.snippets) {
				$('#' + i + ' table.grido').grido();
			}
		}
	});
	$.nette.ext('formsIframePostBind', {
		init:function () {
			this.init(this.selector);
		},
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			for (var i in payload.snippets) {
				this.init('#' + i + ' ' + this.selector);
			}
		}
	}, {
		init:function (target) {
			$(target).parents('form').each(function () {
				$(this).removeClass('ajax');
				var _id = $(this).attr('id');

				$(this).iframePostForm({
					iframeID:this.idPrefix + _id,
					complete:function (response) {
						url = $('#' + this.idPrefix + _id).get(0).contentWindow.location;
						$.nette.ajax({url:url});
					}
				})
			});
		},
		selector:'form.ajax input:file',
		idPrefix:'iframe-post-form-'
	});
	$.nette.ext('formsFileUpload', {
		init: function () {
			this.init('body');
		},
		success:function (payload) {
			if (!payload.snippets) {
				return;
			}

			for (var i in payload.snippets) {
				this.init('#' + i);
			}
		}
	}, {
		init: function (target) {
			var changeFunc = function (object) {
				object.change(function () {
					var data = $(this).val();
					if (data) {
						var data = '<i class="icon-file"></i> ' + data;
						$('#' + object.attr('id') + '_fake').html(data.replace('C:\\fakepath\\', ''));
						$('#' + object.attr('id') + '_fakeRemove').show();
						$('#' + object.attr('id') + '_fakeButton').text('Change');
					} else {
						$('#' + object.attr('id') + '_fake').html(data);
						$('#' + object.attr('id') + '_fakeRemove').hide();
						$('#' + object.attr('id') + '_fakeButton').text('Select file');
					}
				});
			}
			$(target).find('input[type="file"]').each(function () {
				var fileInput = $(this);
				$(this).after('<div class="input-append">'
					+ '<div class="uneditable-input input-xlarge text" id="' + $(this).attr('id') + '_fake" type="text"></div>'
					+ '<button class="btn btn-small hide" id="' + $(this).attr('id') + '_fakeRemove" type="button">Remove</button>'
					+ '<button class="btn btn-small" id="' + $(this).attr('id') + '_fakeButton" type="button">Select file</button>'
					+ '</div>');
				$('#' + $(this).attr('id') + '_fakeButton').off('click');
				$('#' + $(this).attr('id') + '_fakeRemove').off('click');
				$('#' + $(this).attr('id') + '_fakeButton').on('click', function () {
					fileInput.click();
				});
				$('#' + $(this).attr('id') + '_fakeRemove').on('click', function () {
					fileInput.replaceWith(fileInput.clone());
					$('#' + fileInput.attr('id') + '_fake').html('');
					$('#' + fileInput.attr('id') + '_fakeRemove').hide();
					$('#' + fileInput.attr('id') + '_fakeButton').text('Select file');
					changeFunc(fileInput);
				});
				changeFunc($(this));
				$(this).hide();
			});
		}
	});
	$.nette.ext('bootstrapModalBind', {
		init:function () {
			this.resize();
			$(window).bind('resize', this.resize);
		},
		success:function (payload) {
			this.resize();
		}
	}, {
		resize:function () {
			$(".modal.modal-full .modal-body").css("max-height", $(window).height() - 120);
		}
	});
	$.nette.init();

	$('a[data-confirm], button[data-confirm], input[data-confirm]').live('click', function (e) {
		var el = $(this);
		if (el.triggerAndReturn('confirm')) {
			if (!confirm(el.attr('data-confirm'))) {
				e.preventDefault();
				e.stopImmediatePropagation();
				return false;
			}
		}
	});

	$('.table tr').live('click', function (event) {
		if (!$(event.target).closest('input[type=checkbox]').length > 0) {
			var checkbox = $(this).find('input[type=checkbox]').each(function () {
				if (this.checked) {
					this.checked = false;
				} else {
					this.checked = true;
				}
			});
		}
	});

});


