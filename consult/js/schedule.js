/* kardapolov@gmail.com */
(function(){
	var pressed = false; //Флаг, выделяется ли область
	var changePressed = false; //Флаг, редактируется ли область
	var currentChange; //Переменная. В какую сторону редактируется область
	var time; //Универсальная переменная
	var marker; //Переменная с контейнером, над которым работаем (выделяемая область, редактируемая область)
	var timeArray = []; //Массив времени из двух элементов: начало периода, конец периода
	var tmpArr = []; //Временный массив для промежуотчных рассчётов
	var reservedHoursArray = []; //Массив забронированных часов
	var cursorPosition;
	var eventNames = { //Типы и перевод событий
		'private' : 'Личная консультация',
		'skype' : 'Skype-консультация',
		'unwork' : 'Нерабочее время',
		'consult' : 'Консультация',
		'cards' : 'Метафорические карты'
	};
	var events = {};
	var tmpEvent = {};
	var editEvent;
	var taskList;
	var grid;
	var section;
	var markers;
	var tasks;
	var date = '19-02-2015'; //Дата для примера
	$(document).ready(function(){
		grid = $('.schedule-container .grid'); //Контейнер с расписанием
		taskList = $('.today-events .events');
		
		//Вызов календаря
		$('.day-choose a#select-date').on('click', function(e){
			e.preventDefault();
			$('.calendars').fadeIn(300);
		});
		$('.calendars').on('click', '.close', function(){
			$(this).closest('.calendars').fadeOut(300);
		});
		//Добавление события
		editEventBlock = $('.edit-schedule');
		$(editEventBlock).on('click', '.close', function(e){
			e.preventDefault();
			$(editEventBlock).fadeOut(300);
			$(editEventBlock)
				.find('input.section-handler').removeAttr('checked').end()
				.find('.checkbox.container').removeClass('checked').end()
				.find('input[type="checkbox"]').removeAttr('checked').end()
				.find('.times').slideUp(300).end()
				.find('.accordeon-container').slideUp(300);
		});
		$(editEventBlock).on('click', 'input.section-handler', function(){
			section = $(this).closest('.section');
			var siblings = $(section).siblings('.section');
			if($(this).prop('checked')){
				$(section)
					.find('.accordeon-container').slideDown(300).end()
					.find('input[name="begin"]').val(tmpEvent.time[0]).end()
					.find('input[name="end"]').val(tmpEvent.time[1]).end()

				tmpEvent.type = $(section).attr('data-type');
				section = $(section);
				$.each($(siblings), function(key, item){
					$(item)
						.find('input[type="checkbox"]').removeAttr('checked').end()
						.find('.checkbox.container').removeClass('checked').end()
						.find('.times').slideUp(300).end()
						.find('input.timepicker').val('').end()
						.find('.accordeon-container').slideUp(300);
				});
			}else{
				$(section).find('.accordeon-container').slideUp(300);
			}
		});
		$(editEventBlock).on('change', 'input.timepicker-light[name="begin"]', function(){
			if(!$(this).closest('.times').length){
				tmpEvent.time[0] = $(this).val();
			}
			var range = getRange(tmpEvent.time[0]);
			$(this).closest('.field.begin').siblings('.field.end').find('.timepicker-light[name="end"]').timepickerLight({
				'minTime': rowToTime(range[0]),
				'maxTime': rowToTime(range[1])
			});
		});
		$(editEventBlock).on('change', 'input.timepicker-light[name="end"]', function(){
			if(!$(this).closest('.times').length){
				tmpEvent.time[1] = $(this).val();
			}
			var range = getRange(tmpEvent.time[1]);
			$(this).closest('.field.end').siblings('.field.begin').find('.timepicker-light[name="begin"]').timepickerLight({
				'minTime': rowToTime(range[0]),
				'maxTime': rowToTime(range[1])
			});
		});
		$(editEventBlock).find('.type input[name="type"]').on('change', function(){
			var times = $(editEventBlock).find('.times.' + $(this).val());
			if($(this).prop('checked')){
				$(times).slideDown(300);
			}else{
				$(times).slideUp(300);
			}
		});
		// $(editEventBlock).on('click', 'input[type="radio"]', function(){
		// 	tmpEvent.type = $(this).val();
		// });
		$(editEventBlock).find('form').on('submit', function(e){
			e.preventDefault();
			if($(section).find('input[name="free-time"]').prop('checked')){
				//tmpEvent = {};
				tmpEvent.title = 'free-time';
				tmpEvent.types = [];
				var types = $(section).find('.type .field');
				//tmpEvent.times = [];
				$.each(types, function(key, type){
					if($(type).find('input[type="checkbox"]').prop('checked')){
						tmpEvent.types.push($(type).find('input[type="checkbox"]').val());
					}
				});
				tmpEvent.office = $(section).find('select[name="office"]').val();
				$('.free-time-container').find('.line').css({
					height: 0,
					top: 0
				});
				$.each(tmpEvent.types, function(key, type){
					tmpEvent.timeRange = [
						$(section).find('.times.' + type + ' input[name="free-begin"]').val(),
						$(section).find('.times.' + type + ' input[name="free-end"]').val()
					];
					tmpEvent.type = tmpEvent.types[key];
					tmpEvent.time = [];
					timeArray = timesToRows(tmpEvent.timeRange);
					var marker = $('.free-time-container').find('.line.' + type);
					placeFreetimeMarker(marker, timeArray);
					ajaxEvent(tmpEvent, function(data){
						
					});
				});
				$(editEventBlock).fadeOut(300);
				$(editEventBlock)
					.find('input.section-handler').removeAttr('checked').end()
					.find('.checkbox.container').removeClass('checked').end()
					.find('.accordeon-container').slideUp(300);
				$(editEventBlock).fadeOut(300);
				
			}else{
				tmpEvent.title = $(section).find('input[name="title"]').val();
				tmpEvent.participiant = $(section).find('input[name="participiant"]').val();
				tmpEvent.comment = $(section).find('textarea[name="comment"]').val();
				tmpEvent.type = $(section).find('input[type="radio"]:checked').val();
				if(typeof(tmpEvent.type) == 'undefined') tmpEvent.type = 'unwork';
				tmpEvent.office = $(section).find('select#office').val();
				var timeArray = getEventRows(marker, grid);
				reservedHoursArray = _.difference(reservedHoursArray, _.range(_.min(timeArray), _.max(timeArray)));

				ajaxEvent(tmpEvent, function(data){
					if(data.action == 'edit'){
						var marker = $(grid).find('.reserved-marker[data-id="' + tmpEvent.id + '"]').detach();
						$(taskList).find('.event[data-id="' + tmpEvent.id + '"]').remove();
						var timeArray = getEventRows(marker, grid);
						reservedHoursArray = _.difference(reservedHoursArray, _.range(_.min(timeArray), _.max(timeArray)));
					}
					var evnt = data;
					if(typeof(evnt.title) == 'undefined' || !evnt.title.length) evnt.title = eventNames[evnt.type];
					timeArray = timesToRows(data.time);
					var marker = $('<div class="reserved-marker ' + evnt.type + '" data-id="' + evnt.id + '" data-type="' + evnt.type + '" data-begin="' + evnt.time[0] + '" data-end="' + evnt.time[1] + '"  data-participiant="' + evnt.participiant + '"  data-end="' + evnt.time[1] + '" data-title="' + evnt.title + '"><div class="slider-top slider"></div><div class="slider-bottom slider"></div><i class="fa fa-cog edit-event"></i><p class="title">' + evnt.title + '</p></div>').prependTo(grid);	//Формирование области
					reservedHoursArray = _.union(_.range(timeArray[0], timeArray[1]), reservedHoursArray);
					placeSelector(marker, timeArray);
					$(grid).find('.marker').css('display', 'none');
					
					if(data.type != 'unwork'){
						addTask(evnt);
						var tasks = $(taskList).find('.event');
						tasks = _.sortBy(tasks, function(num){
							return parseInt($(num).attr('data-begin'))
						});
						$(taskList).prepend(tasks);
					}
					tmpEvent = {};
					$(editEventBlock).fadeOut(300);
					$(editEventBlock)
						.find('input.section-handler').removeAttr('checked').end()
						.find('.checkbox.container').removeClass('checked').end()
						.find('.accordeon-container').slideUp(300);
					$(editEventBlock).fadeOut(300);
				});
			}
		});
		//Если есть расписание, то спрашиваем евенты на эту дату, ждем JSON, строим зарезервированные области
		if($(grid).length){
			$.ajax({	//AJAX-запрос на события определенной даты
				url: 'server_side/get_schedule.php',
				type: 'POST',
				dataType: 'JSON',
				data: {
					action: 'getSchedule',
					date: date
				},
				success: function(data){
					events = data;
					var weekend = false;
					if(events.weekend){
						weekend = true;
						delete events.weekend;
					}
					$.each(events, function(key,evnt){	//Перебор событий
						//Добавление события на сетку
						
						if(typeof(evnt.title) == 'undefined' || !evnt.title.length) evnt.title = eventNames[evnt.type];
						$(grid).prepend('<div class="reserved-marker ' + evnt.type + '" data-id="' + evnt.id + '" data-type="' + evnt.type + '" data-begin="' + evnt.time[0] + '" data-end="' + evnt.time[1] + '"  data-participiant="' + evnt.participiant + '"  data-end="' + evnt.time[1] + '" data-title="' + evnt.title + '"><div class="slider-top slider"></div><div class="slider-bottom slider"></div><i class="fa fa-cog edit-event"></i><p class="title">' + evnt.title + '</p></div>');	//Формаирование областей
						var reservedMarker = $(grid).find('div[data-id="' + evnt.id + '"]');	//Переменная с областью для этого прохода
						timeArray = timesToRows(evnt.time);	//Конвертация времени с исходных данных в номера строк
						placeSelector(reservedMarker, timeArray);	//Размещение теущего селектора
						reservedHoursArray = _.union(_.range(timeArray[0], timeArray[1]), reservedHoursArray);	//Добавление текущего селектора в зарезервированные часы
						//Добавление события в столбец справа
						$(taskList).find('.event').remove();
						events = _.sortBy(events, function(x){
							return timesToRows(x.time)[0] * -1
						});
						$.each(events, function(key, evnt){
							addTask(evnt);
						});
						markers = $(grid).find('.reserved-marker');
					});
					if(weekend){
						$('.field.weekend .checkbox.container').trigger('click');
					}
				}
			});
		}

		//Установка выходного дня
		$('input[name="weekend"]').on('change', function(){
			if($(this).prop("checked")){
				setWeekend();
			}else{
				removeWeekend();
			}
		});

		//Выделяем события в правом столбце
		$(taskList).on('click', '.event', function(e){
			e.preventDefault();
			if($(e.target).closest('.removeEvent').length){
				var evnt = $(this).closest('.event');
				timeArray = removeEvent(evnt, reservedHoursArray);
				reservedHoursArray = _.difference(reservedHoursArray, _.range(_.min(timeArray), _.max(timeArray)));
			}else{
				var id = $(this).attr('data-id');
				$(this)
					.addClass('active')
					.siblings('.event').removeClass('active');
				marker = $(grid).find('.reserved-marker[data-id="' + id + '"]');
				$(grid).find('.marker').css('display', 'none');
				$(marker)
					.addClass('selected')
					.siblings('.reserved-marker').removeClass('selected');
			}
					
		});
		//Выделение существующих евентов
		$(grid).on('mousedown', function(e){	//При нажатии мыши на сетке
			if(!$(e.target).closest('.reserved-marker').length){	//Если элемент не относится к зарезервированной области
				$(grid).find('.reserved-marker.selected').removeClass('selected');	//Снимаем выделение со всех областей
				$(taskList).find('.event.active').removeClass('active');
			}else{	//Если элемент ОТНОСИТСЯ к зарезервированной области
				marker = $(e.target).closest('.reserved-marker');
				tmpEvent = {
					id: $(marker).attr('data-id'),
					type: $(marker).attr('data-type'),
					time: [$(marker).attr('data-begin'), $(marker).attr('data-end')],
					title: $(marker).attr('data-title'),
					participiant: $(marker).attr('data-participiant')
				}
				
				var task = $(taskList).find('.event[data-id="' + tmpEvent.id + '"]');
				$(marker)
					.addClass('selected')
					.siblings('.reserved-marker').removeClass('selected');	//Выделяем элемент, с остальных снимаем выделение
				$(task)
					.addClass('active')
					.siblings('.event').removeClass('active');	//Выделяем элемент, с остальных снимаем выделение
				$(grid).find('.marker').css('display', 'none');	//Селектор выделения скрываем
				if($(e.target).hasClass('title') || $(e.target).hasClass('reserved-marker')){
					changePressed = true;
					currentChange = 'drag';
					marker = $(e.target).closest('.reserved-marker');
					cursorPosition = Math.floor((e.pageY - $(grid).offset().top) / 16) + 1;
				}	
				if($(e.target).closest('.edit-event').length){
					tmpEvent.action = 'edit';
					var tmpTimeRange = getTimeRanges();
					tmpTimeRange.splice($(marker).index('.reserved-marker'),1);
					
					$('.timepicker-light').timepickerLight({
						'disableTimeRanges': tmpTimeRange
					});
					if(_.indexOf(['skype', 'private', 'cards'], tmpEvent.type) == -1){
						section = $(editEventBlock).find('.section.' + tmpEvent.type);
						$(section).find('input[type="checkbox"].section-handler').trigger('click');
						$(section).find('.checkbox.container').addClass('checked');
						$(editEventBlock).fadeIn(300);
					}else{
						section = $(editEventBlock).find('.section.consult');
						$(section).find('input[type="checkbox"].section-handler').trigger('click');
						$(section).find('.checkbox.container').addClass('checked');
						$.each(tmpEvent, function(key, value){
							switch(key){
								case 'time':
									$(section).find('input[name="begin"]').val(value[0]);
									$(section).find('input[name="end"]').val(value[1]);
								break;
								case 'type':
									tmpEvent.type = $(marker).attr('data-type');
									$(section).find('.radio.container').removeClass('checked');
									var radioInput = $(section).find('input[value="' + tmpEvent.type + '"]');
									$(radioInput).attr('checked', 'checked');
									$(section).find('.radio.container[data-id="' + $(radioInput).attr('data-id') + '"]').addClass('checked');
								break;
								default:
									$(section).find('input[name="' + key + '"]').val(value);
								break;
							}
						});
						$(editEventBlock).fadeIn(300);
					}
				}else{

				}
			}
		});
		//Растягивание евента вниз
		$(grid).on('mousedown', '.slider', function(e){	//По клику на тягучки евента
			if($(this).hasClass('slider-top')){	//Если тягучка верхняя
			 	currentChange = 'top';	//Переменная в статус top
			}else if($(this).hasClass('slider-bottom')){	//Если тягучка нижняя
			 	currentChange = 'bottom';	//Переменная в статус bottom
			}
			marker = $(this).closest('.reserved-marker');	//Переменная с текущей областью
			changePressed = true;	//Переменная со статусом редактирования
			timeArray = getEventRows(marker, grid);	//Массив времени для текущей области
			tmpArr = _.range(timeArray[0], timeArray[1]);	//Временный массив для сдвига
			reservedHoursArray = _.difference(reservedHoursArray, tmpArr); //Удаляем из зарезервированных часов текущую область, чтобы была возможность редактировать область
		});
		//Выделение ячеек
		$(grid).on('mousedown', '.row, .marker', function(e){	//При клике по строке или по маркеру выделения
			marker = $(grid).find('.marker')	//Переменная с маркером
			pressed = true;	//Флаг, что началось выделение области
			timeArray = [];	//Обнуляем массив
			time = Math.floor((e.pageY - $(grid).offset().top) / 16) + 1;	//Считаем колонку исходя из позиции мыши при нажатии (стартовая)
			timeArray[0] = (time);	//Заносим в массив начало выделения
			
			if(isReserved(timeArray,reservedHoursArray)) {	//Проверяем не попадает ли в зарезервированную область
				pressed = false;	//Если попадает, то снимаем флаг нового выделения
			}else{	
				placeSelector(marker, timeArray);	//Если не попадает, то устанавливаем селектор нового выделения в позицию с начальным временем
			}
		});
		$(grid).on('mousemove', function(e){	//При движени мыши по сетке
			if(pressed || changePressed){	//Если есть флаги нового выделения или изменения
				if(changePressed){	//Если флаг изменения
					if(currentChange == 'bottom' || pressed){	//Если изменение вниз
						timeArray[1] = Math.floor((e.pageY - $(grid).offset().top) / 16) + 2;	//Меняем конечное значение области
					}else if(currentChange == 'top'){	//Если изменение вверх
						timeArray[0] = Math.floor((e.pageY - $(grid).offset().top) / 16) + 1;	//Меняем начальное значение области
					}else if(currentChange == 'drag'){
						timeArray = getEventRows(marker, grid);
						tmpArr = _.range(timeArray[0], timeArray[1]);	//Временный массив для сдвига
						reservedHoursArray = _.difference(reservedHoursArray, tmpArr); //Удаляем из зарезервированных часов текущую область, чтобы была возможность редактировать область
						var currentCursorPosition = Math.floor((e.pageY - $(grid).offset().top) / 16) + 1;
						timeArray[0] = timeArray[0] + (currentCursorPosition - cursorPosition);
						timeArray[1] = timeArray[1] + (currentCursorPosition - cursorPosition);
						if(!isReserved(timeArray,reservedHoursArray)){
							cursorPosition = currentCursorPosition;
						}
						if(timeArray[1] > 49) timeArray[1] = 49;
						if(timeArray[0] <= 1) timeArray[0] = 1;
					}
					$(marker).attr('data-begin', rowToTime(_.min(timeArray) - 1));
					$(marker).attr('data-end', rowToTime(_.max(timeArray) - 1));
				}
				if(pressed){	//Если флаг нового выделения
					timeArray[1] = Math.floor((e.pageY - $(grid).offset().top) / 16) + 2;	//Меняем конечное значение области выделения
				}
				if(!isReserved(timeArray,reservedHoursArray)){	//Если рассчитанный выше массив времени не пересекается с резервным временем
					placeSelector(marker, timeArray);	//Устанавливаем селектор в это положение
				}
			}
		});
		$(grid).on('mouseup', function(){	//При отпускании мыши
			if(changePressed){	//Если был флаг редактирования области
				timeArray = getEventRows(marker, grid);	//Получаем массив начальной и конечной строк этой области
				//timeArray[1]--;	//Последнюю строку режем на единицу
				reservedHoursArray = _.union(_.range(timeArray[0], timeArray[1]), reservedHoursArray);	//Добавляем в зарезервированный массив строки отредактированной области
				ajaxUpdateEventTime(marker, timeArray);
				var tasks = $(taskList).find('.event');
				tasks = _.sortBy(tasks, function(num){
					return parseInt($(num).attr('data-begin'))
				});
				$(taskList).prepend(tasks);
				changePressed = false;	//Флаг редактирования области снимаем
			}
			if(pressed){
				tmpEvent.time = [rowToTime(_.min(timeArray) - 1), rowToTime(_.max(timeArray) - 1)];
				$(editEventBlock).fadeIn(300);
			}
			$('.timepicker-light').timepickerLight({
				'disableTimeRanges':getTimeRanges()
			});
			pressed = false;	//Флаг нового выделения снимаем
			//loadTimePickers();	//Подгружаем ползунки для выбора времени
		});
		$('body').on('mouseup', function(){	//При отпускании мыши на любой области
			pressed = false;	//Снимаем флаг нового выделения
			changePressed = false;	//Снимаем флаг редактирования области
		});
	});
	var getTimeRanges = function(){
		var timeRanges = [];
		
		$.each($(grid).find('.reserved-marker'), function(key, marker){
			var times = [];
			times.push($(marker).attr('data-begin'), $(marker).attr('data-end'));
			timeRanges[key] = times;
		});
		return timeRanges;
	}
	//Подбор свободного времени
	var getRange = function(time){
		var hour = parseInt(time.split(':')[0]);	//Считаем час
		var minute = parseInt(time.split(':')[1]);	//Считаем минуты
		var row = (hour + (minute / 60)) * 2 + 1;
		var maxRow, minRow;
		
		for(i = row; _.indexOf(reservedHoursArray, i + 1) == -1 && i <= 48; i++){
			maxRow = i;
		}
		for(i = row; _.indexOf(reservedHoursArray, i) == -1 && i >= 0; i--){
			minRow = i;
		}
		var range = [minRow, maxRow];
		return range;
	}
	//Установка и удаление выходного дня
	var setWeekend = function(){
		markers = $(grid).find('.reserved-marker, .marker').detach();
		var weekendMarker = $('<div class="weekend-marker"><p class="title">Выходной день</p></div>').appendTo($(grid));
		tasks = $(taskList).find('.event').detach();
		placeSelector(weekendMarker, [1,49]);
		evnt = {
			date: date,
			action: 'setWeekend'
		}
		ajaxEvent(evnt, function(data){
			console.log(data);
		});
	}
	var removeWeekend = function(){
		var weekendMarker = $(grid).find('.weekend-marker');
		$(weekendMarker).remove();
		evnt = {
			date: date,
			action: 'removeWeekend'
		}
		ajaxEvent(evnt, function(data){
			console.log(data);
		});
		$(markers).appendTo($(grid));
		$(tasks).prependTo($(taskList));
	}
	//Функция добавления таска в столбец
	var addTask = function(evnt){
		var task = $('<div class="event ' + evnt.type + '" data-id="' + evnt.id + '" data-begin="' + timesToRows(evnt.time)[0] + '"><div class="border"></div><h5 class="title">' + evnt.title + '</h5><p class="time">Время: <span class="value">' + rowToTime(timeArray[0] - 1) + ' - ' + rowToTime(timeArray[1] - 1) + '</span></p><p class="method">Способ: <span class="value">' + eventNames[evnt.type] + '</span></p><a class="fa fa-close removeEvent" href="" title="Удалить событие"></a></div>').prependTo(taskList);
		if(typeof(evnt.participiant) != 'undefined'){
			$(task).find('p.method').after('<p class="participiant">Участник: <a href="' + evnt.participiantProfile + '" class="value">' +evnt.participiant + '</a></p>');
		}
	}

	//Функция удаления события
	var removeEvent = function(evnt, reservedHoursArray){
		var id = $(evnt).attr('data-id');
		var grid = $('.schedule-container .grid');
		var marker = $(grid).find('.reserved-marker[data-id="' + id + '"]');
		var timeArray = getEventRows(marker, grid);
		//Скрываем с виду и удаляем блоки
		$(evnt).slideUp(300, function(){
			$(this).remove();
		});
		$(marker).fadeOut(300, function(){
			$(this).remove();
		});
		ajaxRemoveEvent(id);
		//Возвращаем массив строк удалённого события
		return timeArray;
	}

	//Функция получения строк у события (зарезервированного маркера)
	var getEventRows = function(marker, grid){
		var timeArray = []; //объявляем локальный массив времени
		timeArray[0] = Math.floor(($(marker).offset().top - $(grid).offset().top) / 16 + 1) + 1;	//Считаем время начала от позиции области
		timeArray[1] = Math.floor(($(marker).offset().top - $(grid).offset().top + $(marker).outerHeight()) / 16) + 1;	//Считаем время окончания от позиции области
		return timeArray
	}
	//Функция проверки пересечения массива текущего времени и массива зарезервированного времени
	var isReserved = function(timeArray, reservedHoursArray){
		return _.intersection(_.range(_.min(timeArray) - 1,_.max(timeArray) + 1), reservedHoursArray).length
	}
	//Функция размещения области по переданному селектору и временному массиву (в строках)
	var placeSelector = function(selector, timeArray){
		if(timeArray.length){	//Если массив времени нормальный
			$(selector).css({	//пишем CSS для области
				top: (_.min(timeArray) - 1) * 16 - 1 + 'px',
				height: (_.max(timeArray) - _.min(timeArray)) * 16 + 1 + 'px',
				display: 'block'
			});
		}
		if($(selector).hasClass('reserved-marker')) setEventTime($(selector).attr('data-id'), timeArray);
	}
	//Функция размещения маркера свободного времени
	var placeFreetimeMarker = function(selector, timeArray){
		if(timeArray.length){	//Если массив времени нормальный
			$(selector).css({	//пишем CSS для области
				top: (_.min(timeArray) - 1) * 16 - 1 + 'px',
				height: (_.max(timeArray) - _.min(timeArray)) * 16 + 1 + 'px',
				display: 'block'
			});
		}
	}

	//Функция конвертации строк в соответствующее время (1 строка в 1 время)
	var rowToTime = function(row){
		var hour = Math.floor(row / 2);	//Считаем час от номера строки
		var minute = (row / 2) % 1 * 60;	//Считаем минуты от номера строки
		if(hour.toString().length == 1) hour = '0' + hour; //Если час единичной цифрой, то дописываем 0
		if(hour == 24) hour = '00';	//Если час 24, то час 00
		if(minute.toString().length == 1) minute = '0' + minute;	//Если минуты единичной цифрой, то дописываем 0
		return hour + ':' + minute	//Возвращаем строку времени
	}
	//Функция конвартации начального и конечного времени в начальную и конечно строку сетки
	var timesToRows = function(times){
		var rows = [];	//Локальный массив строк
		$.each(times, function(key, time){	//Приходит 2 времени - начало и конец, считаем для каждого
			var hour = parseInt(time.split(':')[0]);	//Считаем час
			var minute = parseInt(time.split(':')[1]);	//Считаем минуты
			var row = (hour + (minute / 60)) * 2 + 1;	//Считаем строку для этого времени
			rows.push(row);	//Пушим строку в локальный массив

		});
		//rows[1]--;	//Строку окончания декрементируем
		return rows
	}

	//Установка времени для события справа
	var setEventTime = function(eventId, timeArray){
		var taskList = $('.today-events .events');
		var evnt = $(taskList).find('.event[data-id="' + eventId + '"]');
		$(evnt).find('p.time span.value').html(rowToTime(_.min(timeArray) - 1) + ' - ' + rowToTime(_.max(timeArray) - 1));
		$(evnt).attr('data-begin', _.min(timeArray) - 1);
	}

	//Функция добавления нового евента
	var ajaxEvent = function(evnt, callback){
		switch(evnt.action){
			case 'edit':
				var action = 'updateEvent';
			break;
			case 'setWeekend':
				var action = 'setWeekend';
			break;
			case 'removeWeekend':
				var action = 'removeWeekend';
			break;
			default:
				var action = 'createEvent';
			break;
		}
		$.ajax({
			url: 'server_side/events.php',
			type: 'POST',
			dataType: 'JSON',
			data: {
				action: action,
				evnt: JSON.stringify(evnt)
			},
			success: function(data){
				//колбек на успешный ответ от сервера
				callback(data);
			}
		});
	}

	//Отправка данных на сервер о изменении времени события
	var ajaxUpdateEventTime = function(marker, timeArray){
		var id = $(marker).attr('data-id');
		var evnt = {};
		evnt.id = id;
		evnt.time = [];
		evnt.time.push(rowToTime(_.min(timeArray) - 1));
		evnt.time.push(rowToTime(_.max(timeArray) - 1));
		$.ajax({	//AJAX-запрос на события определенной даты
			url: 'server_side/events.php',
			type: 'POST',
			dataType: 'JSON',
			data: {
				action: 'updateEventTime',
				evnt: JSON.stringify(evnt)
			},
			success: function(data){
				//колбек о записи события в БД
				console.log(data);
			}
		});
	}

	var ajaxRemoveEvent = function(eventId){
		var evnt = {};
		evnt.id = eventId;
		$.ajax({	//AJAX-запрос на события определенной даты
			url: 'server_side/events.php',
			type: 'POST',
			dataType: 'JSON',
			data: {
				action: 'removeEvent',
				evnt: JSON.stringify(evnt)
			},
			success: function(data){
				//колбек о записи события в БД
				console.log(data);
			}
		});
	}
})();
