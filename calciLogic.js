var strNaN = "NaN";
var strInf = "Infinity";
var oscError = "ERROR";
var strMathError = "Math Error";
var strEmpty = 0;
var maxLength = 8;
var opCodeArray = [];
var stackArray = [];
var trigDisplay = "";
var openArray = [];
var stackVal1 = 1;
var stackVal2 = 0;
var opCode = 0;
var stackVal = 0;
var memVal = 0;
var boolClear = true;
var newOpCode = 0;
var modeSelected = "deg";
var displayString = "";
var memory = 0;
var trig = 0;
var display = "";
var afterdec = "";
var sct = "";
var calculatorValue = "Normal";

function RoundNum(num, length) {
	var number = Math.round(num * Math.pow(10, length)) / Math.pow(10, length);
	return number;
}
function getIEVersion() {
	try {
		var rv = -1;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var MSIEOffset = window.navigator.userAgent.indexOf("MSIE ");
			if (MSIEOffset == -1) {
				rv = -1;
			} else {
				rv = parseFloat(window.navigator.userAgent.substring(MSIEOffset + 5, window.navigator.userAgent.indexOf(";", MSIEOffset)));
			}
		}
		return rv;
	} catch (e) {
		return false;
	}
}

function checkIEVersion() {
	try {
		var currentIEVersion = getIEVersion();
		if ((currentIEVersion >= 7 && currentIEVersion != -1) || (($.browser && $.browser.msie) || navigator.userAgent.indexOf("Trident") != -1 && $.browser && $.browser.version >= 7)) {
			return true;
		} else {
			return false;
		}
	} catch (e) {
		return false;
	}
}

if (calculatorValue == 'Normal') {
	let tbtn_width = typeof btn_width === 'undefined' ? '72px' : btn_width;
	let tenter_width = typeof enter_width === 'undefined' ? '53px' : enter_width;
	let ttextbox_width = typeof textbox_width === 'undefined' ? '188px' : textbox_width;

	$('#keyPad a').css('margin-right', '3px');
	$('.degree_radian').css('display', 'none');
	if (ttextbox_width !== 'initial') {
		$('.keyPad_TextBox, .keyPad_TextBox1').attr('style', 'width: ' + ttextbox_width + ' !important;');
	}
	jQuery('.memoryhide').css('right', '192px');
	if (checkIEVersion() && !(!!navigator.userAgent.match(/Trident\/7\./))) {
		$('#keyPad_btnEnter').addClass('importantRule');
		if (tenter_width !== 'initial') {
			$('#keyPad_btnEnter').attr('style', 'height: ' + tenter_width + ' !important;');
		}
		$('#memory').addClass('importantRuleMemory');
		jQuery('.calc_container').css('width', '214px');
	} else {
		$('#keyPad_btnEnter').addClass('importantRule1');
		if (tenter_width !== 'initial') {
			$('#keyPad_btnEnter').attr('style', 'height: ' + tenter_width + ' !important;');
		}
		$('#memory').addClass('importantRuleMemory1');
		jQuery('.calc_container').css('width', '214px');
	}
	if (tbtn_width !== 'initial') {
		$('#keyPad_btn0, #keyPad_btnBack').attr('style', 'width: ' + tbtn_width + ' !important;');
	}
} else {
	if (!checkIEVersion() || !!navigator.userAgent.match(/Trident\/7\./)) {
		$('#memory').addClass('importantRuleMemoryScientific');
		$('.keyPad_TextBox, .keyPad_TextBox1').attr('style', 'width: 434px !important;');
		$('#keyPad_btn0').attr('style', 'width: 76px !important;');
		$('.degree_radian').attr('style', 'width: 80px !important;');
	}
}

var inBox = $('#keyPad_UserInput');
var inBox1 = $('#keyPad_UserInput1');
modeSelected = $('input[name=degree_or_radian]:radio:checked').val();
$("#keyPad_UserInput").val(strEmpty);

$('.keyPad_TextBox1, .keyPad_TextBox').focus(function () {
	this.blur();
});

$.fn.setCursorPosition = function (pos) {
	this.each(function (index, elem) {
		if (elem.setSelectionRange) {
			elem.setSelectionRange(pos, pos);
		} else if (elem.createTextRange) {
			var range = elem.createTextRange();
			range.collapse(true);
			range.moveEnd('character', pos);
			range.moveStart('character', pos);
			range.select();
		}
	});
	return this;
};

$("[class^=keyPad_]").each(function () {
	$(this).click(function () {
		$('#keyPad_UserInput1').setCursorPosition($('#keyPad_UserInput1').val().length);
	});
});

$("div#keyPad a.keyPad_btnNumeric").click(function () {
	var btnVal = $(this).html();
	if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
	if (boolClear) { inBox.val(strEmpty); boolClear = false; }
	var str = inBox.val();
	if (str.length > maxLength) return;
	if (this.id == "keyPad_btnDot" && str.indexOf('.') >= 0 && inBox1.val() != "") {
		inBox.val(strEmpty + ".");
		inBox1.val("");
		return;
	} else if (this.id == "keyPad_btnDot" && str.indexOf('.') >= 0)
		return;
	displayCheck();
	if (str != strEmpty || str.length > 1 || this.id == "keyPad_btnDot") {
		inBox.val(str + btnVal);
		stackVal1 = 1;
	} else {
		inBox.val(btnVal);
		stackVal1 = 1;
	}
	inBox.focus();
});

$("a.keyPad_btnConst").click(function () {
	var retVal = strEmpty;
	if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
	switch (this.id) {
		case 'keyPad_btnSqrt2': retVal = Math.SQRT2; break;
		case 'keyPad_btnSqrt3': retVal = Math.sqrt(3); break;
		case 'keyPad_btnCubeRoot2': retVal = Math.pow(2, 1 / 3); break;
		default: break;
	}
	displayCheck();
	stackVal1 = 1;
	boolClear = true;
	$('#keyPad_UserInput').val(retVal);
	$('#keyPad_UserInput').focus();
});

$("div#keyPad a.keyPad_btnBinaryOp").click(function () {
	if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
	switch (this.id) {
		case 'keyPad_btnPlus': stackCheck($("#" + this.id).text());
			newOpCode = 1;
			if (opCode == 10 && stackArray.length > 0 && stackArray[stackArray.length - 1] == "{")
				opcodeChange();
			operation();
			stackVal1 = 0;
			break;
		case 'keyPad_btnMinus': stackCheck($("#" + this.id).text());
			newOpCode = 2;
			if (opCode == 10 && stackArray.length > 0 && stackArray[stackArray.length - 1] == "{")
				opcodeChange();
			operation();
			stackVal1 = 0;
			break;
		case 'keyPad_btnMult': stackCheck($("#" + this.id).text());
			newOpCode = 3;
			if (opCode == 1 || opCode == 2) opcodeChange();
			if (opCode == 10) {
				if (opCodeArray[opCodeArray.length - 1] < 3 || (stackArray.length > 0 && stackArray[stackArray.length - 1] == "{")) {
					opcodeChange();
				} else {
					operation();
				}
			}
			stackVal1 = 0;
			break;
		case 'keyPad_btnDiv': stackCheck($("#" + this.id).text());
			newOpCode = 4;
			if (opCode < 4 && opCode) opcodeChange();
			if (opCode == 10) {
				if (opCodeArray[opCodeArray.length - 1] < 4 || stackVal1 == 5 || (stackArray.length > 0 && stackArray[stackArray.length - 1] == "{")) {
					opcodeChange();
				} else {
					operation();
				}
			}
			stackVal1 = 0;
			break;
		case 'keyPad_%': stackCheck("%");
			newOpCode = 11;
			if (opCode < 6 && opCode) opcodeChange();
			if (opCode == 10) {
				if (opCodeArray[opCodeArray.length - 1] < 6 || (stackArray.length > 0 && stackArray[stackArray.length - 1] == "{")) {
					opcodeChange();
				} else {
					operation();
				}
			}
			stackVal1 = 0;
			break;
		case 'keyPad_btnPercent':
			if (opCode == 1 || opCode == 2) { inBox.val((stackVal * parseFloat(inBox.val()) / 100)); }
			else if (opCode == 3 || opCode == 4) { inBox.val((parseFloat(inBox.val()) / 100)); }
			else return;
			break;
		default: break;
	}
	if (opCode) {
		oscBinaryOperation();
	} else {
		stackVal = parseFloat(inBox.val());
		boolClear = true;
	}
	opCode = newOpCode;
	inBox.focus();
	inBox1.val(displayString);
});

$("a.keyPad_btnMemoryOp").click(function () {
	var x = parseFloat(inBox.val()) || 0;
	var retVal = 0;
	if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
	switch (this.id) {
		case 'keyPad_MS': memory = x; $("#memory").addClass("memoryshow").removeClass("memoryhide"); retVal = inBox.val(); break;
		case 'keyPad_M+': memory = x + parseFloat(memory); $("#memory").addClass("memoryshow").removeClass("memoryhide"); retVal = inBox.val(); break;
		case 'keyPad_MR': retVal = parseFloat(memory); stackVal1 = 1; break;
		case 'keyPad_MC': memory = 0; $("#memory").removeClass("memoryshow").addClass("memoryhide"); retVal = inBox.val(); break;
		case 'keyPad_M-': $("#memory").addClass("memoryshow").removeClass("memoryhide"); memory = parseFloat(memory) - x; retVal = inBox.val(); break;
		default: break;
	}
	$('#keyPad_UserInput').val(retVal);
	boolClear = true;
	inBox.focus();
});

function stackCheck(text) {
	if (stackVal1 == 2) inBox1.val("");
	if (stackVal1 == 0) {
		opCode = 0;
		var x = 1;
		switch (newOpCode) {
			case 5: x = 3; break;
			case 7: x = 5; break;
			case 8: x = 9; break;
			default: break;
		}
		if (!(inBox1.val().indexOf("e+") > -1))
			inBox1.val(inBox1.val().substring(0, inBox1.val().length - x));
		stackVal2 = 2;
	}
	if (stackVal1 == 5 || stackVal2 == 2) {
		stackVal2 = 0;
		displayString = inBox1.val() + text;
	} else {
		if ((inBox1.val().indexOf("e+0") > -1) && inBox.val().indexOf("-") > -1)
			inBox1.val(inBox1.val().replace("e+0", "e"));
		else if ((inBox1.val().indexOf("e+0") > -1))
			inBox1.val(inBox1.val().replace("e+0", "e+"));
		displayString = inBox1.val() + inBox.val() + text;
	}
}

function operation() {
	while (opCodeArray[0] && opCode) {
		if (opCode == 10) {
			opCode = opCodeArray[opCodeArray.length - 1];
			stackVal = stackArray[stackArray.length - 1];
			if (newOpCode == 1 || newOpCode == 2 || newOpCode <= opCode) {
				opCodeArray.pop();
				stackArray.pop();
			} else {
				opCode = 0;
				break;
			}
		} else if (stackArray[stackArray.length - 1] == "{") {
			break;
		} else {
			oscBinaryOperation();
			stackVal = stackArray[stackArray.length - 1];
			if (stackVal == "{") {
				opCode = 0;
				break;
			}
			opCode = opCodeArray[opCodeArray.length - 1];
			if (newOpCode == 1 || newOpCode == 2 || newOpCode <= opCode) {
				opCodeArray.pop();
				stackArray.pop();
			} else {
				opCode = 0;
				break;
			}
			if (!opCodeArray[0] && stackArray.length > 0 && stackArray[stackArray.length - 1] != "{") {
				stackVal = stackArray[stackArray.length - 1];
			}
		}
	}
}
function opcodeChange() {
	if (opCode != 10 && opCode != 0) {
		opCodeArray.push(opCode);
		stackArray.push(stackVal);
	}
	if (opCode == 0) {
		stackArray.push(stackVal);
	}
	opCode = 0;
}
function displayCheck() {
	switch (stackVal1) {
		case 2: inBox1.val(""); break;
		case 3: inBox1.val(inBox1.val().substring(0, inBox1.val().length - trigDisplay.length)); stackVal2 = 4; break;
		case 5:
			var string = "";
			for (var i = openArray.length; i >= 0; i--) {
				string = string + displayString.substring(0, displayString.indexOf("(") + 1);
				displayString = displayString.replace(string, "");
			}
			displayString = string.substring(0, string.lastIndexOf("("));
			inBox1.val(displayString);
			stackVal2 = 6;
			break;
		default: break;
	}
}

function oscBinaryOperation() {
	var x2 = parseFloat(inBox.val());
	var retVal = 0;
	switch (opCode) {
		case 9:
			stackVal = parseFloat(stackVal) * Math.pow(10, x2);
			break;
		case 1: stackVal += x2; break;
		case 2: stackVal -= x2; break;
		case 3: stackVal *= x2; break;
		case 4: stackVal /= x2; break;
		case 6:
			var precisioncheck = stackVal;
			stackVal = Math.pow(stackVal, x2);
			if (precisioncheck == 10 && stackVal % 10 != 0 && (Math.abs(stackVal) < 0.00000001 || Math.abs(stackVal) > 100000000) && x2 % 1 == 0)
				stackVal = stackVal.toPrecision(7);
			break;
		case 5: stackVal = stackVal % x2; break;
		case 7: stackVal = nthroot(stackVal, x2); break;
		case 8: stackVal = Math.log(stackVal) / Math.log(x2); break;
		case 11: stackVal = stackVal / 100 * x2; break;
		case 0: stackVal = x2;
		default: break;
	}
	retVal = stackVal;
	if (Math.abs(retVal) < 0.00000001 || Math.abs(retVal) > 100000000) {
		if (RoundNum(retVal, 99) % 1 != 0) {
			var i = 1;
			while (i < 10) {
				if ((RoundNum(retVal, i) != 0) && (RoundNum(retVal, i) / RoundNum(retVal, i + 99) == 1)) {
					retVal = RoundNum(retVal, i); break;
				} else {
					i++;
				}
			}
		} else { retVal = RoundNum(retVal, 0); }
	} else {
		if (retVal.toFixed(8) % 1 != 0) {
			var i = 1;
			while (i < 10) {
				if ((retVal.toFixed(i) != 0) && (retVal.toFixed(i) / retVal.toFixed(i + 8) == 1)) { retVal = retVal.toFixed(i); break; }
				else { i++; }
			}
		} else { retVal = retVal.toFixed(0); }
	}
	inBox.val(retVal);
	boolClear = true;
	trig = 0;
	inBox.focus();
}

$("a.keyPad_btnUnaryOp").click(function () {
	var x = parseFloat(inBox.val());
	var retVal = oscError;
	if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
	switch (this.id) {
		case 'keyPad_btnInverseSign': retVal = -x; trig = 1; stackVal2 = 3; break;
		case 'keyPad_btnInverse': retVal = 1 / x; displayTrignometric("reciproc", x); break;
		case 'keyPad_btnSquareRoot': retVal = Math.sqrt(x); displayTrignometric("sqrt", x); break;
		default: break;
	}
	if (stackVal2 == 1) stackVal = retVal;
	if (stackVal2 != 3) stackVal2 = 2;
	stackVal1 = 3;
	boolClear = true;
	if (retVal == 0 || retVal == strMathError || retVal == strInf) {
		inBox.val(retVal);
	} else if ((Math.abs(retVal) < 0.00000001 || Math.abs(retVal) > 100000000) && trig != 1) {
	} else {
		if (retVal.toFixed(8) % 1 != 0) {
			var i = 1;
			while (i < 10) {
				if ((retVal.toFixed(i) != 0) && (retVal.toFixed(i) / retVal.toFixed(i + 8) == 1)) { retVal = retVal.toFixed(i); break; }
				else { i++; }
			}
		} else { retVal = retVal.toFixed(0); }
	}
	if (retVal == -0) retVal = 0;
	inBox.val(retVal);
	trig = 0;
	inBox1.val(displayString);
	inBox.focus();
});

$("div.degree_radian").click(function () {
	modeSelected = $('input[name=degree_or_radian]:radio:checked').val();
});

function inverseSineH(inputVal) {
	return Math.log(inputVal + Math.sqrt(inputVal * inputVal + 1));
}
function modeText(text, x) {
	var mode = "d";
	if (modeSelected != "deg") { mode = "r"; }
	displayTrignometric(text + mode, x);
}
function displayTrignometric(text, x) {
	if (stackVal2 == 1) {
		var string = "";
		for (var i = openArray.length; i >= 0; i--) {
			string = string + displayString.substring(0, displayString.lastIndexOf("(") + 1);
			displayString = displayString.replace(string, "");
		}
		displayString = string.substring(0, string.lastIndexOf("("));
		trigDisplay = text + "(" + x + ")";
	}
	if (stackVal2 == 2 || stackVal1 == 3) {
		if (stackVal2 == 3) { trigDisplay = text + "(" + x + ")"; stackVal2 = 2; }
		else {
			displayString = displayString.replace(trigDisplay, "");
			trigDisplay = text + "(" + trigDisplay + ")";
		}
	} else { if (stackVal2 == 4) { displayString = ""; } trigDisplay = text + "(" + x + ")"; }
	displayString = displayString + trigDisplay;
}

$("div#keyPad a.keyPad_btnCommand").click(function () {
	var i = 0, j = 0;
	var strInput = inBox.val();
	switch (this.id) {
		case 'keyPad_btnEnter':
			if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
			while (opCode || opCodeArray[0]) {
				if (stackArray[stackArray.length - 1] == "{") stackArray.pop();
				oscBinaryOperation();
				stackVal = stackArray[stackArray.length - 1];
				opCode = opCodeArray[opCodeArray.length - 1];
				stackArray.pop();
				opCodeArray.pop();
			}
			opCode = 0; inBox.focus(); displayString = ""; trigDisplay = ""; stackVal = strEmpty; openArray = [];
			if (stackVal1 != 2) {
				if (stackVal1 == 3 || stackVal2 == 1) {
					if (stackVal2 != 3) strInput = "";
				}
				if (newOpCode == 9) {
					if (strInput.indexOf("-") > -1) {
						inBox1.val(inBox1.val().substring(0, inBox1.val().lastIndexOf("+")));
					} else {
						inBox1.val(inBox1.val().replace("e+0", "e+"));
					}
				}
				inBox1.val(inBox1.val() + strInput);
			}
			stackVal1 = 2;
			newOpCode = 0;
			stackVal2 = 0; stackArray = []; opCodeArray = [];
			return;
		case 'keyPad_btnClr':
			if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
			if (strInput == strEmpty) { opCode = 0; boolClear = false; }
			else { inBox.val(strEmpty); }
			break;
		case 'keyPad_btnBack':
			if (stackVal1 == 1 || stackVal2 == 3) {
				if (strInput.length > 1) {
					if (inBox.val().indexOf("Infinity") > -1 || inBox.val().indexOf(strMathError) > -1) return;
					inBox.val(strInput.substring(0, strInput.length - 1));
					if (inBox.val() == "-") inBox.val("0");
					break;
				} else {
					inBox.val("0");
					break;
				}
			}
			break;
		case 'keyPad_btnAllClr':
			inBox.val(strEmpty);
			displayString = "";
			trigDisplay = "";
			stackArray = []; opCodeArray = []; openArray = [];
			inBox1.val("");
			stackVal = strEmpty;
			stackVal1 = 1;
			stackVal2 = 0;
			newOpCode = 0;
			opCode = 0;
			break;
		default: break;
	}
});