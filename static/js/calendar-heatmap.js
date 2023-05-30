
function calendarHeatmap() {
    // defaults
    var width = 900;
    var height = 200;
    var legendWidth = 250;
    var selector = 'body';
    var SQUARE_LENGTH = 15;
    var SQUARE_PADDING = 3;
    var MONTH_LABEL_PADDING = 6;
    var now = moment().endOf('day').toDate();
    var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    var last_day = moment(yearAgo).endOf('month').toDate().getDate()
    var yearAgo_today = moment(yearAgo).toDate().getDate();
    var startDate = null;
    var counterMap= {};
    var data = [];
    var max = null;
    var colorRange = ['#c6e48b', '#196127'];
    var tooltipEnabled = true;
    var tooltipUnit = 'commit';
    var legendEnabled = true;
    var onClick = null;
    var weekStart = 0; //0 for Sunday, 1 for Monday
    var locale = {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      No: 'No',
      on: 'on',
      Less: 'Less',
      More: 'More'
    };
    var v = Number(d3.version.split('.')[0]);
    // setters and getters
    chart.data = function (value) {
      if (!arguments.length) { return data; }
      data = value;
  
      counterMap= {};
  
      data.forEach(function (element, index) {
          var key= moment(element.date).format( 'YYYY-MM-DD' );
          var counter= counterMap[key] || 0;
          counterMap[key]= counter + element.count;
      });
  
      return chart;
    };
  
    chart.max = function (value) {
      if (!arguments.length) { return max; }
      max = value;
      return chart;
    };
  
    chart.selector = function (value) {
      if (!arguments.length) { return selector; }
      selector = value;
      return chart;
    };
  
    chart.startDate = function (value) {
      if (!arguments.length) { return startDate; }
      yearAgo = value;
      now = moment(value).endOf('day').add(1, 'year').toDate();
      return chart;
    };
  
    chart.colorRange = function (value) {
      if (!arguments.length) { return colorRange; }
      colorRange = value;
      return chart;
    };
  
    chart.tooltipEnabled = function (value) {
      if (!arguments.length) { return tooltipEnabled; }
      tooltipEnabled = value;
      return chart;
    };
  
    chart.tooltipUnit = function (value) {
      if (!arguments.length) { return tooltipUnit; }
      tooltipUnit = value;
      return chart;
    };
  
    chart.legendEnabled = function (value) {
      if (!arguments.length) { return legendEnabled; }
      legendEnabled = value;
      return chart;
    };
  
    chart.onClick = function (value) {
      if (!arguments.length) { return onClick(); }
      onClick = value;
      return chart;
    };
  
    chart.locale = function (value) {
      if (!arguments.length) { return locale; }
      locale = value;
      return chart;
    };
  
    function chart() {
      d3.select(chart.selector()).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists
        if (last_day - yearAgo_today > 13)
          var yearAgo_date = moment(yearAgo).startOf('month').toDate();
      else
          var yearAgo_date = moment(yearAgo).add(15,'days').startOf('month').toDate();

      var dateRange = ((d3.time && d3.time.days) || d3.timeDays)(yearAgo, now); // generates an array of date objects within the specified range
      var monthRange = ((d3.time && d3.time.months) || d3.timeMonths)(yearAgo_date, now);
      var firstDate = moment(dateRange[0]);

      if (chart.data().length == 0) {
        max = 0;
      } else if (max === null) {
        max = d3.max(chart.data(), function (d) { return d.count; }); // max data value
      }
  
      // color range
      var color = ((d3.scale && d3.scale.linear) || d3.scaleLinear)()
        .range(chart.colorRange())
        .domain([0, max]);
  
   var tooltip = document.createElement("div");
      var dayRects;

      drawChart();
  
      function drawChart() {
        var svg = d3.select(chart.selector())
            .style('position', 'relative')
            .append('div')
            .attr('class','mx-2')
            .style('overflow','hidden')
            .append('svg')
            .style('overflow','visible')
            .attr('width', '1000px')
            .attr('class', 'calendar-heatmap')
            .attr('height', height)
            .style('padding', '20px')
            .attr('class', 'mx-auto')

        dayRects = svg.selectAll('.day-cell')
          .data(dateRange);  //  array of days for the last yr
  
        var enterSelection = dayRects.enter().append('rect')
          .attr('class', 'day-cell')
          .attr('width', SQUARE_LENGTH)
          .attr('height', SQUARE_LENGTH)
          .attr('fill', function(d) { return fill_color(countForDate(d)); })
          .attr('x', function (d, i) {
            var cellDate = moment(d);
            var result = cellDate.week() - firstDate.week() + (firstDate.weeksInYear() * (cellDate.weekYear() - firstDate.weekYear()));
            return result * (SQUARE_LENGTH + SQUARE_PADDING);
          }).on("mouseover", function(d) {
             tooltip.setAttribute('style','position:absolute;');
             var dateStr = moment(d).format('ddd, MMM Do YYYY');
             var count = countForDate(d);
             //  Show the tooltip
             const commit_data = count ? count : "no commit";
             const newContent = document.createElement("div");
             newContent.innerHTML = `${dateStr} / ${count} lines`;
             tooltip.appendChild(newContent);
             document.querySelector("main").appendChild(tooltip);
             tooltip.setAttribute(
                 "style",
                 `position:absolute;
                 background-color:rgba(0,0,0,0.7);
                 color:white;
                 padding:10px;
                 border-radius:10px;
                 top:${(d3.event.pageY - tooltip.clientHeight -20)}px;
                 left:${(d3.event.pageX -tooltip.clientWidth/2-10)}px;`
             );
          })
            .on("mouseout", function() {
                // Hide the tooltip
                tooltip.innerHTML='';
                tooltip.setAttribute("style", "display:none");
            })
          .attr('y', function (d, i) {
            return MONTH_LABEL_PADDING + formatWeekday(d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING);
          });

        if (typeof onClick === 'function') {
          (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('click', function(d) {
            var count = countForDate(d);
            onClick({ date: d, count: count});
          });
        }
  
        if (chart.legendEnabled()) {
          var colorRange = [color(0)];
          for (var i = 3; i > 0; i--) {
            colorRange.push(color(max / i));
          }

          var legendGroup = svg.append('g');
          legendGroup.selectAll('.calendar-heatmap-legend')
              .data(colorRange)
              .enter()
            .append('rect')
              .attr('class', 'calendar-heatmap-legend')
              .attr('width', SQUARE_LENGTH)
              .attr('height', SQUARE_LENGTH)
              .attr('x', function (d, i) { return (width - legendWidth + 150) + (i + 1) * 19; })
              .attr('y', height - 40)
              .attr('fill', function (d) { return d; });

          legendGroup.append('text')
            .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-less')
            .attr('x', width - legendWidth + 160)
            .attr('y', height-27)
            .text(locale.Less);

          legendGroup.append('text')
            .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-more')
            .attr('x', (width - legendWidth +240) + (colorRange.length) * 12)
            .attr('y', height-27)
            .text(locale.More);
        }
  
        dayRects.exit().remove();

        var monthLabels = svg.selectAll('.month')
            .data(monthRange)
            .enter().append('text')
            .attr('class', 'month-name')
            .text(function (d) {
              return locale.months[d.getMonth()];
            }).attr('class','text-xs')
            .attr('x', function (d, i) {
              var matchIndex = 0;
              dateRange.find(function (element, index) {
                matchIndex = index;
                return moment(d).isSame(element, 'month') && moment(d).isSame(element, 'year');
              });
              return (Math.floor(matchIndex / 7) * (SQUARE_LENGTH + SQUARE_PADDING))+15;
            })
            .attr('y', 0);  // fix these to the top
        locale.days.forEach(function (day, index) {
          index = formatWeekday(index);
          if (index % 2) {
            svg.append('text')
                .attr('transform', 'translate(-8,' + (SQUARE_LENGTH + SQUARE_PADDING) * (index + 1) + ')')
                .attr('text-anchor', 'middle')
                .attr('class', 'text-xs')
                .text(day);
          }
        });
      }
  
      function pluralizedTooltipUnit (count) {
        if ('string' === typeof tooltipUnit) {
          return (tooltipUnit + (count === 1 ? '' : 's'));
        }
        for (var i in tooltipUnit) {
          var _rule = tooltipUnit[i];
          var _min = _rule.min;
          var _max = _rule.max || _rule.min;
          _max = _max === 'Infinity' ? Infinity : _max;
          if (count >= _min && count <= _max) {
            return _rule.unit;
          }
        }
      }
  
      function tooltipHTMLForDate(d) {
        var dateStr = moment(d).format('ddd, MMM Do YYYY');
        var count = countForDate(d);
        return '<span><strong>' + (count ? count : locale.No) + ' ' + pluralizedTooltipUnit(count) + '</strong> ' + locale.on + ' ' + dateStr + '</span>';
      }
  
      function countForDate(d) {
          var key= moment(d).format( 'YYYY-MM-DD' );
          return counterMap[key] || 0;
      }
  
      function formatWeekday(weekDay) {
        if (weekStart === 1) {
          if (weekDay === 0) {
            return 6;
          } else {
            return weekDay - 1;
          }
        }
        return weekDay;
      }
  
      var daysOfChart = chart.data().map(function (day) {
        return day.date.toDateString();
      });
    }
    return chart;
  }

  // polyfill for Array.find() method
  /* jshint ignore:start */
  if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;
  
      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    };
  }
  /* jshint ignore:end */
function fill_color(counts) {
    const colors = ['#eee', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
    if (!counts) {
        return colors[0];
    }
    if (counts > 45) {
        return colors[4];
    }
    if (counts > 30) {
        return colors[3];
    }
    if (counts > 15) {
        return colors[2];
    }
    else{
         return colors[1];
    }
}
