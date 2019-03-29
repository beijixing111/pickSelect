;
(function(undefined) {
  "use strict"; //使用js严格模式检查，是语法更规范
  var _global;
  //默认配置
  var def = {
    liHeight: 40, //每列li的高度
    headHeight: 45, //picker-tool的高度
    cancelText: '取消',
    okText: '确定',
    centerText: '请选择',
    initData: [],
    type: 'normal',
    trigger: null,
    format: '-', //返回数据格式化
    cascade: false, //是否联动
    callbackFunc: null,
    itemNum: 5, //每列显示5个
  };

  function pickerSelect(config) {
    var _this_ = this;
    this.pickerSelect = null;
    this.pickerHeight = 0;
    this.config = {};
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
    this.hasChildren = true; //联动是否含有子列
    this.wheelCount = 1;
    this.translateLeft = 0; //左移动值

    //循环遍历如果存在用户配置则用用户的，否则用默认配置
    for (var key in def) {
      this.config[key] = !!config && config[key] ? config[key] : def[key];
    }
    this.initPicker();
  }

  /*原型方法*/
  pickerSelect.prototype = {
    initPicker: function() { //初始化
      var _this = this;
      if (!this.config.trigger) {
        console.error('请配置要触发选择容器面板的元素ID');
        return false;
      }
      var triggerWrap = document.querySelector(this.config.trigger);
      if (triggerWrap.tagName === 'INPUT') {
        triggerWrap.setAttribute("readonly", "readonly");
        triggerWrap.setAttribute("unselectable", "on");
        triggerWrap.setAttribute("onfocus", "this.blur()");
      }
      this.create();
      var ele = this.pickerSelect.querySelector('.picker-container');
      this.pickerHeight = ele.offsetHeight;
      var Wheels = this.getNowElement('.wheel'),
        cancelBtn = this.getNowElement('.cancel-btn')[0],
        sureBtn = this.getNowElement('.sure-btn')[0],
        maskEvent = this.getNowElement('.picker-masker')[0],
        switchTab = this.getNowElement('.def-span');
      //取消事件
      cancelBtn.addEventListener('click', function() {
        _this.hidePickerPanel();
      }, false);

      this.config.type == 'datetime' && this.switchTabWheels(switchTab);
      //确定事件
      sureBtn.addEventListener('click', function() {
        if (typeof _this.config.callbackFunc == 'function') {
          _this.config.callbackFunc && _this.config.callbackFunc(_this.SelectedDataArr, _this.SelectedIndexArr);
        } else {
          var backVal = '';
          if (_this.config.type != "datetime") {
            backVal = _this.SelectedDataArr.join(_this.config.format);
          } else {
            var dataArr = _this.SelectedDataArr.slice(0, 3);
            var timeArr = _this.SelectedDataArr.slice(3);
            backVal = dataArr.join('-') + ' ' + timeArr.join(':');
          }
          _this.triggerWrapType(triggerWrap, backVal);
        }
        _this.hidePickerPanel();
      }, false);
      maskEvent.addEventListener('click', function() {
        _this.hidePickerPanel();
      }, false);
      //触发显示选择器
      triggerWrap.addEventListener('click', function(e) {
        _this.tagName = this.tagName;
        if (this.tagName.toUpperCase() == 'INPUT') {
          _this.value = !!this.value ? this.value : '';
        } else {
          _this.value = !!this.innerHTML ? this.innerHTML : '';
        }
        if (_this.config.type == 'date' && _this.value == '') {
          var dateTimeObj = _this.getNowDateAndTime(new Date());
          _this.value = [dateTimeObj.y, dateTimeObj.m, dateTimeObj.d].join('-');
        }
        if (_this.config.type == 'time' && _this.value == '') {
          var dateTimeObj = _this.getNowDateAndTime(new Date());
          _this.value = [dateTimeObj.h, dateTimeObj.min, dateTimeObj.s].join(':');
        }
        if (_this.config.type == 'datetime' && _this.value == '') {
          var dateTimeObj = _this.getNowDateAndTime(new Date());
          _this.value = [dateTimeObj.y, dateTimeObj.m, dateTimeObj.d, '00', '00', '00'];
          // _this.value = [dateTimeObj.y, dateTimeObj.m, dateTimeObj.d, dateTimeObj.h, dateTimeObj.min, dateTimeObj.s];
        }
        _this.wheelInitPosition();
        _this.toggleAnimate({
          visibility: 'visible',
          position: 0,
          opacity: 1
        });

      });
      for (var i = 0; i < Wheels.length; i++) {
        (function(index) {
          var nowWheel = Wheels[index];
          _this.addEventDoneElement(nowWheel, index);
        })(i);
      }
    },
    create: function() { //深沉对应的html
      this.pickerSelect = document.createElement('div');
      this.pickerSelect.className = 'picker-mobile';
      this.pickerSelect.id = 'picker_' + this.config.trigger.replace('#', '');
      var wheels_wid = document.body.clientWidth;
      var wheels_wid = this.config.type == 'datetime' ? wheels_wid * 2 : wheels_wid;
      if (this.config.type == 'datetime') {
        var text = '<span class="def-span actived">选择日期</span><span class="def-span">选择时间</span>';
        this.config.centerText = text;
      }
      var pickerHtml = '<div class="picker-masker"></div>' +
        '<div class="picker-container">' +
        '<div class="picker-tool border">' +
        '<div class="cancel-btn item-t" style="color: #108ef2;">' +
        this.config.cancelText + '</div>' +
        '<div class="center item-t">' + this.config.centerText + '</div>' +
        '<div class="sure-btn item-t" style="color: #1db223;">' +
        this.config.okText + '</div>' +
        '</div>' +
        '<div class="picker-panel">' +
        '<div class="wheels" style="width: ' + wheels_wid + 'px;"></div>' +
        '<div class="selectLine border" style="top:' +
        this.config.liHeight * (this.config.itemNum - 1) / 2 + 'px;height:' +
        this.config.liHeight + 'px;"></div>' +
        '<div class="shadowMask" style="height:' +
        this.config.liHeight * this.config.itemNum + 'px;"></div>' +
        '</div></div>';
      this.pickerSelect.innerHTML = pickerHtml;
      document.querySelector('body').appendChild(this.pickerSelect);
      var wheels = this.pickerSelect.querySelector('.wheels');
      this.switchTypeToMethod();
      //根据数据长度来渲染列表
      if (this.config.initData.length == 0) {
        var wheelHtml = '';
        wheelHtml += '<div class="wheel" style="width: 100%; padding-top: 20px;">';
        wheelHtml += '<p style="font-size: 14px; color: #ccc; text-align: center;">' +
          '请先初始化数据！</p></div>';
        return wheels.innerHTML = wheelHtml;
      }
      wheels.innerHTML = this.insertDataToPanel();
    },
    switchTabWheels: function(tabs) {
      var wheelsWrap = this.getNowElement('.wheels')[0],
        win_wid = document.body.clientWidth;
      for (var i = 0; i < tabs.length; i++) {
        (function(index) {
          tabs[index].addEventListener('click', function() {
            for (var j = 0; j < tabs.length; j++) {
              if (j != index) {
                tabs[j].className = 'def-span';
              }
            }
            this.className = "def-span actived";
            wheelsWrap.style.transform = 'translate3d(' + index * -1 * win_wid + 'px, 0, 0)';
            wheelsWrap.style.webkitTransform = 'translate3d(' + index * -1 * win_wid + 'px, 0, 0)';
          });
        })(i);
      }
    },
    switchTypeToMethod: function() {
      switch (this.config.type) {
        case 'date':
          this.createDateData();
          break;
        case 'time':
          this.createTimeData();
          break;
        case 'datetime':
          this.createDateTimeData();
          break;
        default:
          break;
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
      for (var i = dateTimeObj.y - 100; i < dateTimeObj.y + 100; i++) {
        yearArr.push(i);
      }
      dayArr = this.formatDays(dateTimeObj.y, dateTimeObj.m);
      this.config.initData = [yearArr, monthArr.map(this.formatNumber), dayArr];
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
      this.config.initData = [hourArr, minArr, minArr];
    },
    createDateTimeData: function() {
      this.createDateData();
      var dateArr = this.config.initData;
      this.createTimeData();
      this.config.initData = dateArr.concat(this.config.initData);
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
    insertDataToPanel: function() {
      var wheelHtml = '';
      // console.log(this.config.cascade);
      if (!this.config.cascade) { //不联动
        this.wheelCount = this.config.initData.length;
        var wheels_wid = document.body.clientWidth;
        var wheels_wid = this.config.type == 'datetime' ? wheels_wid * 2 : wheels_wid;
        var wheelWidth = wheels_wid / this.wheelCount;
        for (var i = 0; i < this.config.initData.length; i++) {
          wheelHtml += '<div class="wheel" style="width:' + wheelWidth + 'px;height:' +
            this.config.liHeight * this.config.itemNum + 'px;"><ul>';
          var nowColumnData = this.config.initData[i];
          for (var j = 0; j < nowColumnData.length; j++) {
            wheelHtml += '<li>' + nowColumnData[j] + '</li>';
          }
          wheelHtml += '</ul></div>';
        }
      } else { //联动
        var lianDongData = this.config.initData;
        var count = 0;
        while (this.hasChildren) {
          count++;
          var resObj = this.addCreateLianDongHtml(lianDongData);
          wheelHtml += resObj.tempHtml;
          if (resObj.data.length != 0) {
            lianDongData = resObj.data;
          } else {
            this.hasChildren = false;
          }
        }
        var precent = (100 / count).toFixed(3);
        this.wheelCount = count;
        var replaceStr = 'class="wheel" style="width:' + precent + '%;height:' +
          this.config.liHeight * this.config.itemNum + 'px;" ';
        wheelHtml = wheelHtml.replace(/class=\"wheel\"/g, replaceStr);
      }
      return wheelHtml;
    },
    addCreateLianDongHtml: function(ArrData) {
      var htmlObj = {
        tempHtml: '',
        data: []
      };
      htmlObj.tempHtml += '<div class="wheel"><ul>';
      for (var i = 0; i < ArrData.length; i++) {
        htmlObj.tempHtml += '<li data-key="' + ArrData[i].id + '">' + ArrData[i].value + '</li>';
        if (i == 0 && !!ArrData[0].children && ArrData[0].children.length != 0) {
          htmlObj.data = ArrData[0].children;
        }
      }
      htmlObj.tempHtml += '</ul></div>';
      return htmlObj;
    },
    addEventDoneElement: function(nowdom, index) {
      var wheel = nowdom;
      var _this = this;
      wheel.addEventListener('touchstart', function() {
        var ulObj = this.querySelector('ul');
        _this.touchEventDone(ulObj, event, index);
      });
      wheel.addEventListener('touchend', function() {
        var ulObj = this.querySelector('ul');
        _this.touchEventDone(ulObj, event, index);
      });
      wheel.addEventListener('touchmove', function() {
        var ulObj = this.querySelector('ul');
        _this.touchEventDone(ulObj, event, index);
      });
      wheel.addEventListener('touchcancel', function() {
        var ulObj = this.querySelector('ul');
        _this.touchEventDone(ulObj, event, index);
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
          var intDis = Math.round(_this.curDistance / _this.config.liHeight);
          _this.curDistance = intDis * _this.config.liHeight;
          if (distance == 0 && e.target.nodeName.toUpperCase() == 'LI') { //相当于点击
            _this.curDistance = -1 * e.target.offsetTop + _this.config.liHeight * ((_this.config.itemNum - 1) / 2);
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
          _this.curDistance = -1 * e.target.offsetTop + _this.config.liHeight * ((_this.config.itemNum - 1) / 2);
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
    upDateDistance: function(ulObj) {
      var box_hei = ulObj.offsetHeight;
      if (this.curDistance < this.config.liHeight * ((this.config.itemNum + 1) / 2) - box_hei) {
        this.curDistance = this.config.liHeight * ((this.config.itemNum + 1) / 2) - box_hei;
      } else if (this.curDistance > this.config.liHeight * ((this.config.itemNum - 1) / 2)) {
        this.curDistance = this.config.liHeight * ((this.config.itemNum - 1) / 2);
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
    getNowElement: function(tag) {
      return this.pickerSelect.querySelectorAll(tag);
    },
    cssSet: function() { //设置样式

    },
    //弹出动画
    toggleAnimate: function(attrAni) {
      var ele = this.pickerSelect.querySelector('.picker-container');
      ele.style.transform = 'translate3d(0,' + attrAni.position + 'px, 0)';
      ele.style.opacity = attrAni.opacity;
      this.pickerSelect.style.visibility = attrAni.visibility;
      this.pickerSelect.style.opacity = attrAni.opacity < 1 ? 0 : attrAni.opacity;
    },
    //隐藏选择面板
    hidePickerPanel: function() {
      this.toggleAnimate({
        visibility: 'hidden',
        position: this.pickerHeight,
        opacity: 0.5
      });
    },
    //如果有值返回对应值的滑动位置
    getTextPosition: function() {
      var format = this.config.format;
      var nowValueArr = [];
      if (this.config.type == 'datetime') {
        if (typeof this.value == "string") {
          var dateArr = this.value.split(" ")[0].split('-');
          var timeArr = this.value.split(" ")[1].split(':');
          nowValueArr = nowValueArr.concat(dateArr, timeArr);
        } else {
          nowValueArr = this.value;
        }
      } else {
        nowValueArr = this.value.split(format);
      }
      if (this.config.cascade && this.value.split(format).length < this.wheelCount) {
        for (var i = 0; i < this.wheelCount - this.value.split(format).length; i++) {
          nowValueArr.push('');
        }
      }
      this.SelectedDataArr = nowValueArr;
      var translatePos = [];
      var liHeight = this.config.liHeight;
      if (!this.config.cascade) {
        for (var i = 0; i < nowValueArr.length; i++) {
          var ulobj = this.getNowElement('ul')[i];
          var liObj = ulobj.getElementsByTagName('li');
          var allLis = liObj.length > 0 ? liObj : [];
          for (var j = 0; j < allLis.length; j++) {
            var text = allLis[j].innerHTML;
            if (text == nowValueArr[i]) {
              var position = liHeight * (((this.config.itemNum - 1) / 2) - j);
              translatePos[i] = position;
              this.SelectedIndexArr[i] = j;
              liObj[j].className = 'selected';
              break;
            } else {
              liObj[j].className = '';
            }
          }
        }
      } else { //如果联动，就初始生成联动对应的数据
        var hasChildren = true;
        var dataArr = this.config.initData;
        for (var i = 0; i < this.wheelCount; i++) {
          for (var j = 0; j < dataArr.length; j++) {
            if (nowValueArr[i] == dataArr[j].value) {
              var position = liHeight * (((this.config.itemNum - 1) / 2) - j);
              translatePos[i] = position;
              this.SelectedIndexArr[i] = j;
              if (!dataArr[j].children) {
                hasChildren = false;
                break;
              } else {
                dataArr = dataArr[j].children;
              }
            }
          }
          if (nowValueArr[i] == '') {
            this.SelectedIndexArr[i] = 'empty';
            translatePos[i] = liHeight * ((this.config.itemNum - 1) / 2);
          }
        }
        this.replaceHtmlWheel();
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
      this.positionArr = [];
      if (this.value == '') {
        for (var i = 0; i < this.wheelCount; i++) {
          this.positionArr[i] = this.config.liHeight * ((this.config.itemNum - 1) / 2);
          this.SelectedIndexArr[i] = 0;
          var ulobj = this.getNowElement('ul')[i];
          this.SelectedDataArr[i] = ulobj.querySelectorAll('li')[0].innerHTML;
          ulobj.querySelectorAll('li')[0].className = 'selected';
        }
      } else {
        this.positionArr = this.getTextPosition();
      }
      for (var j = 0; j < this.positionArr.length; j++) {
        this.curDistance = this.positionArr[j];
        var ulobj = this.getNowElement('ul')[j];
        this.movePosition(ulobj);
      }
    },
    movePosition: function(dom) {
      dom.style.transform = 'translate3d(' + this.translateLeft + 'px, ' + this.curDistance + 'px, 0)';
      dom.style.webkitTransform = 'translate3d(' + this.translateLeft + 'px, ' + this.curDistance + 'px, 0)';
    },
    selectedData: function(dom) {
      var liHeight = this.config.liHeight;
      var positionArrInfo = this.positionArr;
      var cur_index = this.currentIndexUl;
      var nowIndex = Math.abs(positionArrInfo[cur_index] - liHeight * ((this.config.itemNum - 1) / 2)) / liHeight;
      var ulObj = this.getNowElement('ul')[cur_index];
      this.SelectedIndexArr[cur_index] = nowIndex;
      var liObj = ulObj.querySelectorAll('li');
      if (liObj.length > 0) {
        for (var i = 0; i < liObj.length; i++) {
          liObj[i].className = nowIndex == i ? 'selected' : '';
        }
      }
      this.SelectedDataArr[cur_index] = liObj.length > 0 ? liObj[nowIndex].innerHTML : "";
      if (!!this.config.cascade && this.currentIndexUl < this.wheelCount - 1) {
        this.updateWheel();
      }
      if (this.config.type == "date" || this.config.type == "datetime") {
        this.updateDayWheel();
      }
      //console.log(this.SelectedIndexArr, this.SelectedDataArr); //选中的序号和对应文本的数组
    },
    updateDayWheel: function() { //你需要根据年和月更新天数
      var dataArr = this.SelectedDataArr;
      var dayArr = this.formatDays(dataArr[0], dataArr[1]);
      var num = 2; //日期day列所在的index值
      if (dataArr.length > 2 && (this.currentIndexUl == 0 || this.currentIndexUl == 1)) {
        var _lihtml = '';
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
          this.positionArr[num] = this.config.liHeight * (((this.config.itemNum - 1) / 2) - this.SelectedIndexArr[num]);
          this.curDistance = this.config.liHeight * (((this.config.itemNum - 1) / 2) - this.SelectedIndexArr[num]);
          this.movePosition(ulObj);
        }
      }
    },
    updateWheel: function() {
      var num = this.currentIndexUl + 1;
      while (num < this.wheelCount) {
        var nextData = this.config.initData;
        for (var i = 0; i < num; i++) {
          if (!!nextData[this.SelectedIndexArr[i]].children) {
            nextData = nextData[this.SelectedIndexArr[i]].children;
          } else {
            nextData = [];
          }
        }
        var _lihtml = '';
        for (var j = 0; j < nextData.length; j++) {
          var selected = j == 0 ? 'selected' : '';
          _lihtml += '<li class="' + selected + '" data-key="' + nextData[j].id + '">' + nextData[j].value + '</li>';
        }
        var ulObj = this.getNowElement('ul')[num];
        ulObj.innerHTML = _lihtml;
        var liObj = ulObj.querySelectorAll('li');
        this.SelectedDataArr[num] = liObj.length > 0 ? liObj[0].innerHTML : "";
        this.positionArr[num] = this.config.liHeight * ((this.config.itemNum - 1) / 2);
        this.SelectedIndexArr[num] = 0;
        this.curDistance = this.config.liHeight * ((this.config.itemNum - 1) / 2);
        this.movePosition(ulObj);
        num++;
      }
    },
    triggerWrapType: function(el, backVal) {
      if (this.tagName === 'INPUT') {
        el.value = backVal;
      } else {
        el.innerHTML = backVal;
      }
    }
  };
  //最后将插件对象暴露给全局对象
  _global = (function() {
    return this || (0, eval)('this');
  }());

  if (typeof module !== "undefined" && module.exports) {
    module.exports = pickerSelect;
  } else if (typeof define === "function" && define.amd) {
    define(function() {
      return pickerSelect
    });
  } else {
    !('pickerSelect' in _global) && (_global.pickerSelect = pickerSelect);
  }
})();