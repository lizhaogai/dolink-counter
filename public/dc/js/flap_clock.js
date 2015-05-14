(function($, lead_byte, byte, symbol_map, lead_symbols_to_aliases) {
  var render_symbol_table, retrieve_alias, retrieve_symbol, setCaretPosition;
  retrieve_alias = function(value) {
    return symbol_map[value] || value;
  };
  retrieve_symbol = function(alias) {
    var k, v;
    for (k in symbol_map) {
      v = symbol_map[k];
      if (alias === v) {
        return k;
      }
    }
    return alias;
  };
  setCaretPosition = function(input, caretPos) {
    var el, range;
    el = input[0];
    el.value = el.value;
    if (el !== null) {
      if (el.createTextRange) {
        range = el.createTextRange();
        range.move('character', caretPos);
        range.select();
        return true;
      } else {
        if (el.selectionStart || el.selectionStart === 0) {
          el.focus();
          el.setSelectionRange(caretPos, caretPos);
          return true;
        } else {
          el.focus();
          return false;
        }
      }
    }
  };
  render_symbol_table = function(symbols, lead) {
    var data_attr, html, image_path_sufix, k, src_down, src_up, v;
    image_path_sufix = lead ? 'lead/' : '';
    html = '';
    for (k in symbols) {
      v = symbols[k];
      if (k === 'blank2' || k === 'blank3' || k === 'blank4') {
        continue;
      }
      src_up = '/img/flapclock/' + image_path_sufix + v.image + '-up.png';
      src_down = '/img/flapclock/' + image_path_sufix + v.image + '-down.png';
      data_attr = v.image;
      html += ["<div class='flap-clock-tooltip-img-container' data-symbol='" + data_attr + "'>", "<img src=\"" + src_up + "\" />", "<img src=\"" + src_down + "\" />", "</div>"].join('');
    }
    return html;
  };
  $.fn.flapClock = function(options) {
    var $el, attachTooltips, clearFocusedClass, countDone, createHiddenInput, defaultOptions, filterNewInput, flapClockList, height, hiddenInput, highlightFocused, isAllDone, items, keydown, magicNumber, maxLen, normalizeInputValue, oldHiddenValue, oldPosition, renderFlapit, rerenderEditable, self, setValues, showPlaceholders, valueForHiddenInput, values, valuesToIndexes, width;
    self = $(this);
    values = [];
    items = [];
    countDone = 0;
    defaultOptions = {
      mode: 'virtual',
      animation: options.editable ? 'virtual' : 'realistic'
    };
    options = $.extend({}, defaultOptions, options);
    magicNumber = 4.84;
    width = 851;
    height = 176;
    maxLen = 6;
    hiddenInput = $('<input/>').attr('maxlength', maxLen);
    $el = null;
    oldPosition = 0;
    oldHiddenValue = '';
    keydown = false;
    if (options.width > 0) {
      width = options.width;
      height = width / magicNumber;
    }
    flapClockList = function(realValue, lead) {
      return {
        realValue: realValue,
        digit: 0,
        byte_length: 59,
        lead_byte_length: 59,
        classes: {
          active: 'flip-clock-active',
          before: 'flip-clock-before',
          flip: 'flip',
          lead: lead ? 'lead' : ''
        },
        $el: false,
        lastDigit: 0,
        timeouts: [],
        velocity: 300,
        animation: options.animation ? options.animation : '',
        done: true,
        init: function(container, digit, triggerAnimationEnd) {
          this.done = triggerAnimationEnd;
          this.$el = this.createList();
          if (digit > 0) {
            this.select(digit, triggerAnimationEnd);
          }
          if (!lead && options.editable) {
            this.$el.on('click', function() {
              hiddenInput.focus();
              setCaretPosition(hiddenInput, $(this).index());
              return hiddenInput.trigger('keyup');
            });
          }
          return container.append(this.$el);
        },
        createList: function() {
          var html, lastDigit;
          if (this.getPrevDigit()) {
            lastDigit = this.getPrevDigit();
          } else {
            lastDigit = this.digit;
          }
          html = $(['<ul class="' + this.classes.flip + ' ' + this.classes.lead + '">', this.createListItem(this.classes.before, lastDigit), this.createListItem(this.classes.active, this.digit), '</ul>'].join(''));
          return html;
        },
        getNextDigit: function(digit) {
          if (digit === 59) {
            return 0;
          } else {
            return digit + 1;
          }
        },
        getPrevDigit: function() {
          if (this.digit === 0) {
            return 59;
          } else {
            return this.digit - 1;
          }
        },
        createListItem: function(css, value) {
          var pool;
          if (!css) {
            css = '';
          }
          pool = lead ? lead_byte : byte;
          value = retrieve_alias(pool[value]);
          if (lead) {
            value = 'lead/' + value;
          }
          if (value === null || value === void 0) {
            return 'blank';
          }
          return ['<li class="' + css + '">', '<a href="#">', '<div class="up">', '<div class="shadow"></div>', '<div class="inn"><img src="img/flapclock/' + value + '-up.png" /></div>', '</div>', '<div class="down">', '<div class="shadow"></div>', '<div class="inn"><img src="img/flapclock/' + value + '-down.png" /></div>', '</div>', '</a>', '</li>'].join('');
        },
        appendListItem: function(css, value) {
          var html;
          html = this.createListItem(css, value);
          return this.$el.append(html);
        },
        setVelocity: function(i, dest) {
          dest = Math.abs(dest);
          if (i < 3 && dest >= 3) {
            if (this.velocity !== 100) {
              this.velocity = this.velocity - 100;
            }
          } else if (dest < 3) {
            if (this.velocity !== 300) {
              this.velocity = this.velocity + 100;
            }
          }
          return this.velocity;
        },
        goToPosition: function(nextDigit) {
          var $delete;
          $delete = this.$el.find('.' + this.classes.before).removeClass(this.classes.before);
          this.$el.find('.' + this.classes.active).removeClass(this.classes.active).addClass(this.classes.before);
          this.appendListItem(this.classes.active, nextDigit);
          return $delete.remove();
        },
        virualAnimation: function(triggerAnimationEnd) {
          var self = this;
          var nextDigit = 0;
          var animVelocity, func, i, nextDigit, timeout, totalTime, _results;
          nextDigit = self.getNextDigit(self.lastDigit);
          self.velocity = 300;
          totalTime = self.velocity;
          self.timeouts.forEach(function(item) {
            return window.clearTimeout(item);
          });
          self.timeouts = [];
          i = 0;
          _results = [];
          while (i <= 59) {
            i++;
            func = function(nextDigit, i) {
              return function() {
                self.goToPosition(nextDigit);
                if (i > 0) {
                  return self.$el.addClass('play');
                }
              };
            };
            timeout = window.setTimeout(func(nextDigit, i), totalTime);
            self.timeouts.push(timeout);
            if (nextDigit === self.digit) {
              timeout = window.setTimeout(function() {
                self.done = triggerAnimationEnd;
                return $(self).trigger('done');
              }, totalTime + 300);
              self.timeouts.push(timeout);
              break;
            }
            nextDigit = self.getNextDigit(nextDigit);
            animVelocity = self.setVelocity(i, self.digit - nextDigit);
            _results.push(totalTime = totalTime + animVelocity);
          }
          return _results;
        },
        select: function(digit, triggerAnimationEnd) {
          var self = this;
          self.digit = digit;
          if (self.digit !== self.lastDigit) {
            self.done = false;
            if (self.animation === 'realistic') {
              self.virualAnimation(triggerAnimationEnd);
            } else {
              self.goToPosition(digit);
              window.setTimeout(function() {
                self.done = triggerAnimationEnd;
                return $(self).trigger('done');
              }, 300);
            }
            return self.lastDigit = self.digit;
          } else {
            self.done = triggerAnimationEnd;
            return $(self).trigger('done');
          }
        }
      };
    };
    isAllDone = function() {
      var done, item, _i, _len;
      done = true;
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (item.done === false) {
          done = false;
          break;
        }
      }
      if (done) {
        return self.trigger('animationended');
      }
    };
    setValues = function(value) {
      var parsedValues;
      if (value === null) {
        return;
      }
      parsedValues = textToFlapSymbols(value);
      if (parsedValues === null) {
        return;
      }
      values = valuesToIndexes(parsedValues);
      return values.forEach(function(value, i) {
        if (options.mode === 'realistic' && i > 0) {
          $(items[i - 1]).off('done');
          return $(items[i - 1]).on('done', function() {
            return items[i].select(value, true);
          });
        } else {
          return items[i].select(value, true);
        }
      });
    };
    valuesToIndexes = function(values) {
      var idx, indexes, pool;
      indexes = [];
      pool = [];
      idx = null;
      values.forEach(function(value, i) {
        var lead;
        lead = i === 0;
        if (lead) {
          pool = lead_byte;
        } else {
          pool = byte;
        }
        return indexes.push(pool.indexOf(value));
      });
      return indexes;
    };
    renderFlapit = function(el) {
      var container, parsedValues;
      container = $("<div class='clock-container'></div>").css({
        'width': width + 'px',
        height: height + 'px'
      });
      $el = $(el);
      $el.addClass('flip-clock-wrapper');
      $el.wrap(container);
      $el.data('flapclock', self);
      if (options.value === null) {
        return;
      }
      parsedValues = textToFlapSymbols(options.value);
      if (parsedValues === null) {
        return;
      }
      values = valuesToIndexes(parsedValues);
      return values.forEach(function(value, i) {
        var lead, list;
        lead = i === 0;
        list = new flapClockList(parsedValues[i], lead);
        $(list).on('done', function() {
          list.$el.removeClass('play');
          return isAllDone();
        });
        if (options.mode === 'realistic' && lead === false) {
          $(items[i - 1]).on('done', function() {
            return list.select(value, true);
          });
          list.init($el, 0, false);
          return items.push(list);
        } else {
          list.init($el, value, true);
          return items.push(list);
        }
      });
    };
    normalizeInputValue = function() {
      var num, rest, value, _i, _ref;
      value = hiddenInput.val();
      rest = maxLen - value.length;
      if (rest > 0) {
        for (num = _i = 0, _ref = rest - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; num = 0 <= _ref ? ++_i : --_i) {
          value = value + ' ';
        }
      }
      return value.replace(/\s/g, '_');
    };
    filterNewInput = function(value) {
      var parsedValues;
      parsedValues = textToFlapSymbols(value);
      if (parsedValues === null) {
        hiddenInput.val(oldHiddenValue);
        setCaretPosition(hiddenInput, oldPosition);
        return false;
      }
      return true;
    };
    createHiddenInput = function(value) {
      hiddenInput.attr('maxlength', maxLen).val(value);
      hiddenInput.on('blur', function() {
        return clearFocusedClass();
      });
      hiddenInput.on('keydown', function() {
        if (keydown === false) {
          keydown = true;
          oldPosition = hiddenInput[0].selectionStart;
          return oldHiddenValue = hiddenInput.val();
        }
      });
      hiddenInput.on('keyup', function(e, init) {
        keydown = false;
        rerenderEditable();
        if (e.keyCode === 37) {
          if (hiddenInput[0].selectionStart === 0) {
            hiddenInput.trigger('blur');
            $el.find('.lead').trigger('click');
            return;
          }
        }
        if (!init) {
          return highlightFocused();
        }
      });
      return $('body').append(hiddenInput);
    };
    clearFocusedClass = function() {
      return $el.find('ul.flip.focused').removeClass('focused');
    };
    highlightFocused = function() {
      var cursorPosition, focusedElement;
      cursorPosition = hiddenInput[0].selectionStart;
      focusedElement = cursorPosition - 1;
      if (cursorPosition === 0) {
        focusedElement = 0;
        setCaretPosition(hiddenInput, 1);
      }
      clearFocusedClass();
      return $el.find('ul.flip').not('.lead').eq(focusedElement).addClass('focused');
    };
    showPlaceholders = function() {
      var num, _i, _ref, _results;
      $el.find('ul.flip.placeholder').removeClass('placeholder');
      _results = [];
      for (num = _i = _ref = hiddenInput.val().length; _ref <= maxLen ? _i <= maxLen : _i >= maxLen; num = _ref <= maxLen ? ++_i : --_i) {
        _results.push($el.find('ul.flip').not('.lead').eq(num).addClass('placeholder'));
      }
      return _results;
    };
    valueForHiddenInput = function() {
      var parsedValues;
      parsedValues = textToFlapSymbols(options.value);
      parsedValues.shift();
      parsedValues = parsedValues.map(function(item) {
        if (item === 'blank') {
          return ' ';
        }
        return item;
      });
      return parsedValues.join('').trim();
    };
    attachTooltips = function() {
      var lead_tooltip;
      return lead_tooltip = new Drop({
        target: $el.find(".lead")[0],
        content: $('<div class="flap-clock-tooltip"></div>').html(render_symbol_table(lead_symbols_to_aliases, 1))[0],
        openOn: 'click',
        position: 'bottom left',
        classes: 'drop-theme-hubspot-popovers'
      }).on('open', function() {
        var $drop_el, drop_instance;
        $el.find('.lead').addClass('focused');
        drop_instance = this;
        $drop_el = $(drop_instance.content);
        return $drop_el.find('.flap-clock-tooltip-img-container').on('click', function() {
          items[0].realValue = retrieve_symbol($(this).attr('data-symbol'));
          rerenderEditable();
          setCaretPosition(hiddenInput, 1);
          hiddenInput.trigger('keyup');
          return drop_instance.close();
        });
      });
    };
    rerenderEditable = function(init) {
      var hiddenValue, leadValue, newValue;
      leadValue = items[0].realValue;
      hiddenValue = normalizeInputValue();
      newValue = leadValue + hiddenValue;
      if (filterNewInput(newValue) !== false) {
        setValues(newValue);
        return showPlaceholders();
      }
    };
    self.value = function(value) {
      return setValues(value);
    };
    self.getValue = function() {
      return values;
    };
    this.each(function() {
      renderFlapit(this);
      if (options.editable) {
        createHiddenInput(valueForHiddenInput());
        hiddenInput.trigger('keyup', true);
        showPlaceholders();
        return attachTooltips();
      }
    });
    return self;
  };
})(jQuery, window.lead_byte_array, window.byte_array, window.symbol_map, window.lead_symbols_to_aliases);
