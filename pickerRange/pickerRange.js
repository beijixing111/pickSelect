;
(function(undefined) {
  "use strict"; //使用js严格模式检查，是语法更规范
  var _global;
  var pickerRange = function(config, callback) {
    this.trigger = config.trigger;
    this.format = !config.format ? '' : config.format;
    this.maxYear = !config.maxYear ? 50 : config.maxYear;
    this.minYear = !config.minYear ? 50 : config.minYear;
    this.type = config.type;
    this.initData = [];
    this.callbackfn = callback;
    this.panelHeight = 0;
    this.value = '';
    this.liHeight = 40; //每列li的高度
    this.headHeight = 45; //picker-tool的高度
    this.cancelText = '取消';
    this.okText = '确定';
    this.centerText = '请选择';
    this.itemNum = 5;
    this.column = 6; //列数

    this.startY = 0;
    this.oldMoveY = 0;
    this.moveEndY = 0;
    this.moveY = 0;
    this.offset = 0;
    this.curDistance = 0;
    this.positionArr = [];
    this.SelectedDataArr = [];
    this.SelectedIndexArr = [];
    this.currentIndexUl = 0;
    this.value = '';

    this.oldtime = 0;
    this.init();
  }

  pickerRange.prototype = {
    init: function(e) {
      var _this = this;
      var trigger = document.getElementById(this.trigger);
      trigger.setAttribute("readonly", "readonly");
      trigger.setAttribute("unselectable", "on");
      trigger.setAttribute("onfocus", "this.blur()");
      this.create(); //创建时间段选取面板

      trigger.addEventListener("click", function(e) {
        // e.preventDefault();
        // e.stopPropagation();
        handleTrigger(this, e);
      }, { passive: false });


      function handleTrigger(el, e) {
        var tagName = el.tagName;
        if (tagName.toUpperCase() == 'INPUT') {
          _this.value = !!el.value ? el.value : '';
        }
        var dateTimeObj = _this.getNowDateAndTime(new Date());
        if (_this.type == 'daterange' && _this.value == '') {
          _this.value = [dateTimeObj.y, dateTimeObj.m, dateTimeObj.d, dateTimeObj.y, dateTimeObj.m, dateTimeObj.d];
        } else if (_this.type == 'timerange' && _this.value == '') {
          _this.value = [dateTimeObj.h, dateTimeObj.min, dateTimeObj.s, dateTimeObj.h, dateTimeObj.min, dateTimeObj.s];
        } else if (_this.type == 'datetime' && _this.value == '') {
          _this.value = [dateTimeObj.y, dateTimeObj.m, dateTimeObj.d, dateTimeObj.h, dateTimeObj.min];
          _this.value = _this.value.concat(_this.value);
        }
        _this.wheelInitPosition();
        _this.showPanel();
      }
    },
    create: function() {
      this.rangeContainer = document.createElement('div');
      this.rangeContainer.className = 'range-mobile';
      this.rangeContainer.id = this.trigger + 'range';
      this.rangeWid = document.body.clientWidth;
      // console.log(this.rangeWid);
      var _this = this;
      var smallfont = (this.type == 'datetime' && this.rangeWid < 375) ? 'smallfont' : '';
      var rangeHtml = '<div class="range-masker"></div>' +
        '<div class="range-container ' + smallfont + '">' +
        '<div class="range-tool border">' +
        '<div class="cancel-btn item-t" style="color: #108ef2;">' +
        this.cancelText + '</div>' +
        '<div class="center item-t">' + this.centerText + '</div>' +
        '<div class="sure-btn item-t" style="color: #1db223;">' +
        this.okText + '</div>' +
        '</div>' +
        '<div class="range-panel">' +
        '<div class="wheels" style="width: ' + this.rangeWid + 'px;"></div>' +
        '<div class="selectLine border" style="top:' +
        this.liHeight * (this.itemNum - 1) / 2 + 'px;height:' +
        this.liHeight + 'px;"></div>' +
        '<div class="shadowMask" style="height:' +
        this.liHeight * this.itemNum + 'px;"></div>' +
        '</div></div>';
      this.rangeContainer.innerHTML = rangeHtml;
      document.querySelector('body').appendChild(this.rangeContainer);
      this.rangePanel = this.rangeContainer.querySelector('.range-container');
      this.rangeWheels = this.rangeContainer.querySelector('.wheels');
      this.createWheel();
      this.panelHeight = this.rangePanel.offsetHeight;
      this.hidePanel(); //隐藏面板
      this.registerEvent(); //注册dom事件
    },
    createWheel: function() {
      var wheelHtml = '';
      if (this.type == 'daterange') {
        this.createDateData();
        this.initData = this.initData.concat(this.initData);
      } else if (this.type == 'timerange') {
        this.createTimeData();
        this.initData = this.initData.concat(this.initData);
      } else if (this.type == 'datetime') {
        this.createDateTimeData();
        this.initData = this.initData.slice(0, 5);
        this.initData = this.initData.concat(this.initData);
        // console.log(this.initData);
      }
      var wheel_wid = Math.floor((this.rangeWid - 15) / this.column);
      // console.log(this.column);
      for (var i = 0; i < this.column; i++) {
        wheelHtml += '<div class="wheel" style="width:' + wheel_wid + 'px;height:200px;"></div>';
        if (i == ((this.column / 2) - 1)) {
          wheelHtml += '<div class="pos" style="width: 15px; height:200px;">~</div>';
        }
      }
      this.rangeWheels.innerHTML = wheelHtml;
      // console.log(this.initData);
      this.allWheel = this.rangeWheels.querySelectorAll(".wheel");
      for (var i = 0; i < this.allWheel.length; i++) {
        var ulhtml = '<ul>';
        for (var j = 0; j < this.initData[i].length; j++) {
          ulhtml += '<li>' + this.initData[i][j] + '</li>';
        }
        ulhtml += '</ul>';
        this.allWheel[i].innerHTML = ulhtml;
      }
    },
    registerEvent: function(e) {
      //移动设备触摸事件注册 
      var _this = this;
      var allWheel = this.allWheel;
      for (var i = 0; i < allWheel.length; i++) {
        (function(index) {
          var wheel = allWheel[index];
          var ulObj = wheel.querySelector('ul');
          wheel.addEventListener('touchstart', function() {
            _this.touchEventDone(ulObj, event, index);
          }, { passive: false });
          wheel.addEventListener('touchmove', function() {
            _this.touchEventDone(ulObj, event, index);
          }, { passive: false });
          wheel.addEventListener('touchend', function() {
            _this.touchEventDone(ulObj, event, index);
          }, { passive: false });
          wheel.addEventListener('touchcancel', function() {
            _this.touchEventDone(ulObj, event, index);
          }, { passive: false });
        })(i);
      }

      // this.addEvent(this.rangeContainer, 'click', function(e) {
      //   e.stopPropagation();
      // });
      var rangeMasker = this.rangeContainer.querySelector('.range-masker');
      var cancelBtn = this.rangeContainer.querySelector('.cancel-btn');
      var sureBtn = this.rangeContainer.querySelector('.sure-btn');
      // 关闭面板
      this.addEvent(rangeMasker, 'click', function(e) {
        _this.hidePanel();
      });
      this.addEvent(cancelBtn, 'click', function(e) {
        _this.hidePanel();
      });
      this.addEvent(sureBtn, 'click', function(e) {
        var backVal = '';
        var index = _this.column / 2;
        if (_this.type == "daterange") {
          var start = _this.SelectedDataArr.slice(0, index);
          var end = _this.SelectedDataArr.slice(index);
          backVal = start.join('-') + '~' + end.join('-');
        } else if (_this.type == "timerange") {
          var start = _this.SelectedDataArr.slice(0, index);
          var end = _this.SelectedDataArr.slice(index);
          backVal = start.join(':') + '~' + end.join(':');
        } else if (_this.type == "datetime") {
          var start = _this.SelectedDataArr.slice(0, index);
          var startDateTime = start.slice(0, 3).join('-') + ' ' + start.slice(3).join(':');
          var end = _this.SelectedDataArr.slice(index);
          var endDateTime = end.slice(0, 3).join('-') + ' ' + end.slice(3).join(':');
          backVal = startDateTime + '~' + endDateTime;
        }
        var trigger = document.getElementById(_this.trigger);
        _this.triggerWrapType(trigger, backVal);
        _this.callbackfn && _this.callbackfn(_this.SelectedDataArr, _this.SelectedIndexArr);
        _this.hidePanel();
      });

    },
    //touch事件处理
    touchEventDone: function(ulObj, e, index) {
      var _this = this;
      e = e || window.event;
      switch (e.type) {
        case "touchstart":
          _this.startY = parseInt(e.touches[0].pageY);
          _this.oldMoveY = _this.startY;
          _this.offset = _this.getDistance(ulObj);
          _this.oldtime = new Date().getTime();
          break;
        case "touchend":
          var nowtime = new Date().getTime();
          _this.moveEndY = e.changedTouches[0].pageY;
          var distance = _this.moveEndY - _this.startY;
          var spend = Math.abs(distance / (nowtime - _this.oldtime));
          spend = nowtime - _this.oldtime < 200 ? (spend * 1.5) : spend;
          _this.curDistance = _this.offset + distance * (1 + spend);
          var intDis = Math.round(_this.curDistance / _this.liHeight);
          _this.curDistance = intDis * _this.liHeight;
          if (distance == 0 && e.target.nodeName.toUpperCase() == 'LI') { //相当于点击
            _this.curDistance = -1 * e.target.offsetTop + _this.liHeight * ((_this.itemNum - 1) / 2);
          }
          //超出范围滚动回位置
          _this.upDateDistance(ulObj);
          _this.currentIndexUl = index;
          _this.positionArr[index] = _this.curDistance;
          _this.movePosition(ulObj);
          _this.selectedData(ulObj);
          // debugger;
          break;
        case "touchmove":
          e.preventDefault();
          _this.moveY = parseInt(e.touches[0].pageY);
          _this.curDistance = _this.offset + _this.moveY - _this.startY;
          _this.movePosition(ulObj);
          break;
        case 'touchcancel': //触摸中断事件
          //超出范围滚动回位置
          e.preventDefault();
          _this.curDistance = -1 * e.target.offsetTop + _this.liHeight * ((_this.itemNum - 1) / 2);
          //alert(_this.curDistance); 
          _this.upDateDistance(ulObj);
          _this.currentIndexUl = index;
          _this.positionArr[index] = _this.curDistance;
          _this.movePosition(ulObj);
          _this.selectedData(ulObj);
          break;
        default:
          return;
      }
    },
    getNowElement: function(tag) {
      return this.rangeWheels.querySelectorAll(tag);
    },
    upDateDistance: function(ulObj) {
      var box_hei = ulObj.offsetHeight;
      if (this.curDistance < this.liHeight * ((this.itemNum + 1) / 2) - box_hei) {
        this.curDistance = this.liHeight * ((this.itemNum + 1) / 2) - box_hei;
      } else if (this.curDistance > this.liHeight * ((this.itemNum - 1) / 2)) {
        this.curDistance = this.liHeight * ((this.itemNum - 1) / 2);
      }
    },
    getDistance: function(dom) {
      var distance = 0;
      if (!dom.style.transform) {
        return distance;
      }
      if (dom.style.transform) {
        distance = parseInt(dom.style.transform.split(',')[1]);
      } else {
        distance = parseInt(dom.style.webkitTransform.split(',')[1]);
      }
      return distance;
    },
    /* 事件监听 */
    addEvent: function(el, type, fn) {
      if (el.addEventListener) {
        el.addEventListener(type, fn, { passive: false });
      } else if (el.attachEvent) {
        el.attach('on' + type, fn);
      } else {
        el['on' + type] = fn;
      }
    },
    getNowDateAndTime: function(date) {
      var year = date.getFullYear();
      var month = this.formatNumber(date.getMonth() + 1);
      var day = this.formatNumber(date.getDate());
      var hour = this.formatNumber(date.getHours());
      var minute = this.formatNumber(date.getMinutes());
      var second = this.formatNumber(date.getSeconds());
      return {
        y: year,
        m: month,
        d: day,
        h: hour,
        min: minute,
        s: second
      };
    },
    createDateData: function() {
      var dateTimeObj = this.getNowDateAndTime(new Date());
      var yearArr = [],
        monthArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        dayArr = []; //平年有28天，闰年有29天
      for (var i = dateTimeObj.y - this.minYear; i < dateTimeObj.y + this.minYear; i++) {
        yearArr.push(i);
      }
      dayArr = this.formatDays(dateTimeObj.y, dateTimeObj.m);
      this.initData = [yearArr, monthArr.map(this.formatNumber), dayArr];
      // console.log(this.initData);
    },
    createTimeData: function() {
      var hourArr = [],
        minArr = [];
      for (var i = 0; i < 24; i++) {
        hourArr.push(this.formatNumber(i));
      }
      for (var j = 0; j < 60; j++) {
        minArr.push(this.formatNumber(j));
      }
      if (this.format) {
        var formatArr = this.format.split('~');
        if (formatArr[0].split(':').length < 3) {
          this.initData = [hourArr, minArr];
        } else {
          this.initData = [hourArr, minArr, minArr];
        }
      } else {
        this.initData = [hourArr, minArr, minArr];
      }
      this.column = this.initData.length * 2;
      // console.log(this.initData);
    },
    createDateTimeData: function() {
      this.createDateData();
      var dateArr = this.initData;
      this.createTimeData();
      this.initData = this.initData.slice(0, 2);
      this.initData = dateArr.concat(this.initData);
      this.column = this.initData.length * 2;
    },
    formatNumber: function(n) {
      n = n.toString();
      return n[1] ? n : '0' + n;
    },
    formatDays: function(y, m) {
      var dayLen = this.getDayNum(y, m);
      var dayArr = [];
      for (var i = 1; i <= dayLen; i++) {
        dayArr.push(this.formatNumber(i));
      }
      return dayArr;
    },
    getDayNum: function(y, m) {
      return new Date(y, m, 0).getDate();
    },
    /* 阻止浏览器默认行为 */
    stopBrowser: function(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.returnValue = false;
    },
    //如果有值返回对应值的滑动位置
    getTextPosition: function() {
      var nowValueArr = [];
      var _this = this;
      if (this.type == 'daterange') {
        if (typeof this.value == "string") {
          nowValueArr = this.value.replace(/[^\d]/g, ' ').split(' ');
        } else {
          nowValueArr = this.value;
        }
      } else if (this.type == 'timerange') {
        if (typeof this.value == "string") {
          nowValueArr = this.value.replace(/[^\d]/g, ' ').split(' ');
        } else {
          nowValueArr = this.value;
        }
      } else if (this.type == 'datetime') {
        if (typeof this.value == "string") {
          nowValueArr = this.value.replace(/[^\d]/g, ' ').split(' ');
        } else {
          nowValueArr = this.value;
        }
      } else {
        nowValueArr = this.value.split(format);
      }
      nowValueArr = nowValueArr.map(function(item) {
        return _this.formatNumber(item);
      });
      // console.log(nowValueArr);
      this.SelectedDataArr = nowValueArr;
      var translatePos = [];
      var liHeight = this.liHeight;
      for (var i = 0; i < nowValueArr.length; i++) {
        var ulobj = this.getNowElement('ul')[i];
        // console.log(ulobj);
        var liObj = ulobj.getElementsByTagName('li');
        var allLis = liObj.length > 0 ? liObj : [];
        for (var j = 0; j < allLis.length; j++) {
          var text = allLis[j].innerHTML;
          if (text == nowValueArr[i]) {
            var position = liHeight * (((this.itemNum - 1) / 2) - j);
            translatePos[i] = position;
            this.SelectedIndexArr[i] = j;
            liObj[j].className = 'selected';
            break;
          } else {
            liObj[j].className = '';
          }
        }
      }
      return translatePos;
    },
    replaceHtmlWheel: function() {
      var num = this.currentIndexUl + 1;
      while (num < this.wheelCount) {
        var nextData = this.config.initData;
        // console.log(nextData);
        for (var i = 0; i < num; i++) {
          if (!!nextData[this.SelectedIndexArr[i]].children) {
            nextData = nextData[this.SelectedIndexArr[i]].children;
          } else {
            nextData = [];
          }
        }
        var _lihtml = '';
        for (var j = 0; j < nextData.length; j++) {
          _lihtml += '<li data-key="' + nextData[j].id + '">' + nextData[j].value + '</li>';
        }
        var ulObj = this.getNowElement('ul')[num];
        ulObj.innerHTML = _lihtml;
        var liObj = ulObj.querySelectorAll('li');
        this.SelectedDataArr[num] = liObj.length > 0 ? liObj[0].innerHTML : "";
        num++;
      }
      for (var i = 0; i < this.SelectedIndexArr.length; i++) {
        var ulobj = this.getNowElement('ul')[i];
        var liObj = ulobj.getElementsByTagName('li');
        if (this.SelectedIndexArr[i] != 'empty') {
          liObj[this.SelectedIndexArr[i]].className = 'selected';
        }
      }
    },
    //滚动内容位置初始化
    wheelInitPosition: function() {
      this.positionArr = this.getTextPosition();
      // console.log(this.positionArr);
      for (var j = 0; j < this.positionArr.length; j++) {
        this.curDistance = this.positionArr[j];
        var ulobj = this.getNowElement('ul')[j];
        this.movePosition(ulobj);
      }
    },
    movePosition: function(dom) {
      dom.style.transform = 'translate3d(0px, ' + this.curDistance + 'px, 0)';
      dom.style.webkitTransform = 'translate3d(0px, ' + this.curDistance + 'px, 0)';
    },
    selectedData: function(dom) {
      var liHeight = this.liHeight;
      var positionArrInfo = this.positionArr;
      var cur_index = this.currentIndexUl;
      var nowIndex = Math.abs(positionArrInfo[cur_index] - liHeight * ((this.itemNum - 1) / 2)) / liHeight;
      var ulObj = this.allWheel[cur_index].querySelector('ul');
      // console.log(ulObj);
      this.SelectedIndexArr[cur_index] = nowIndex;
      var liObj = ulObj.querySelectorAll('li');
      if (liObj.length > 0) {
        for (var i = 0; i < liObj.length; i++) {
          liObj[i].className = nowIndex == i ? 'selected' : '';
        }
      }
      this.SelectedDataArr[cur_index] = liObj.length > 0 ? liObj[nowIndex].innerHTML : "";

      if (this.type == "daterange" || this.type == 'datetime') {
        this.updateDayWheel();
      }
      // console.log(this.SelectedIndexArr, this.SelectedDataArr); //选中的序号和对应文本的数组
    },
    updateDayWheel: function() { //你需要根据年和月更新天数  
      var dataArr = this.SelectedDataArr;
      // console.log(this.SelectedDataArr);
      var num; //日期day列所在的index值
      if (this.type == 'daterange') {
        num = this.currentIndexUl < 3 ? 2 : 5; //日期day列所在的index值
      } else if (this.type == 'datetime') {
        num = this.currentIndexUl < 3 ? 2 : 7; //日期day列所在的index值
      }
      var dayArr = this.formatDays(dataArr[num - 2], dataArr[num - 1]);
      var _lihtml = '';
      // console.log(num);
      for (var j = 0; j < dayArr.length; j++) {
        var selected = dataArr[num] == dayArr[j] ? 'selected' : '';
        _lihtml += '<li class="' + selected + '">' + dayArr[j] + '</li>';
      }
      var ulObj = this.getNowElement('ul')[num];
      ulObj.innerHTML = _lihtml;
      var liObj = ulObj.querySelectorAll('li');
      if (this.SelectedDataArr[num] > dayArr[dayArr.length - 1]) {
        this.SelectedDataArr[num] = dayArr[dayArr.length - 1];
        this.SelectedIndexArr[num] = dayArr.length - 1;
        liObj[dayArr.length - 1].className = 'selected';
        this.positionArr[num] = this.liHeight * (((this.itemNum - 1) / 2) - this.SelectedIndexArr[num]);
        this.curDistance = this.liHeight * (((this.itemNum - 1) / 2) - this.SelectedIndexArr[num]);
        this.movePosition(ulObj);
      }
    },
    triggerWrapType: function(el, backVal) {
      // console.log(backVal);
      if (el.tagName === 'INPUT') {
        el.value = backVal;
      } else {
        el.innerHTML = backVal;
      }
    },
    //弹出动画
    toggleAnimate: function(attrAni) {
      this.rangePanel.style.transform = 'translate3d(0,' + attrAni.position + 'px, 0)';
      this.rangeContainer.style.opacity = attrAni.opacity;
      this.rangeContainer.style.visibility = attrAni.visibility;
      this.rangeContainer.style.opacity = attrAni.opacity < 1 ? 0 : attrAni.opacity;
    },
    showPanel: function() {
      this.toggleAnimate({
        visibility: 'visible',
        position: 0,
        opacity: 1
      });
    },
    //隐藏选择面板
    hidePanel: function() {
      this.toggleAnimate({
        visibility: 'hidden',
        position: this.panelHeight,
        opacity: 0.5
      });
    },
  };


  //最后将插件对象暴露给全局对象
  _global = (function() {
    return this || (0, eval)('this');
  }());

  if (typeof module !== "undefined" && module.exports) {
    module.exports = pickerRange;
  } else if (typeof define === "function" && define.amd) {
    define(function() {
      return pickerRange;
    });
  } else {
    !('pickerRange' in _global) && (_global.pickerRange = pickerRange);
  }
})();