/*
 * GitHub Calendar Generator
 *
 * HOWTORUN:
 *
 *   TECH_CALENDAR_DATA='{"2022-06-16":{"Swift":19},...' node github_calendar.js
 *
 * RETRUN VALE: svg code (innerHTML)
 *
 */

const { JSDOM } = require('jsdom');
var d3 = require("d3");
var moment = require('moment');

const tech_calendar_data = process.env.TECH_CALENDAR_DATA;
const calendar_data = JSON.parse(tech_calendar_data);

generate_github_calendar(calendar_data);

function generate_github_calendar(calendar_data){
    let today = moment().endOf('day').toDate();
    let yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    let chartData = d3.time.days(yearAgo, today).map(function (dateElement) {
        return {
                date: dateElement,
                count:(calendar_data[moment(dateElement).format('YYYY-MM-DD')] ? calendar_data[moment(dateElement).format('YYYY-MM-DD')] : 0)
            };
        });

    const dom = new JSDOM('<div id="github-calendar"></div>');
    const { document } = dom.window;

    let calendar = github_calendar().data(chartData);
    calendar(document);

    const svgElement = dom.window.document.querySelector('svg');
    console.log(svgElement.innerHTML);
};

function github_calendar() {
    // defaults
    var width = 1010;
    var height = 180;
    var legendWidth = 300;
    var selector = 'body';
    var MARGIN_X = 28;
    var MARGIN_Y = 195;
    var SQUARE_LENGTH = 15;
    var SQUARE_PADDING = 3;
    var MONTH_LABEL_PADDING = 7;
    var now = moment().endOf('day').toDate();
    var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
    var last_day = moment(yearAgo).endOf('month').toDate().getDate()
    var yearAgo_today = moment(yearAgo).toDate().getDate();
    var startDate = null;
    var counterMap= {};
    var data = [];
    var max = true;
    var colorRange = ['#c6e48b', '#196127'];
    var tooltipEnabled = true;
    var tooltipUnit = 'line';
    var legendEnabled = false;
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
          counterMap[key]= element.count;
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

    function chart(document) {

      d3.select(document.getElementById('github-calendar')).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists
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

        //      var tooltip = document.createElement("div");
	var tooltip = document.createElement('div');
        var dayRects;
        drawChart();
	function drawChart() {
          var svg = d3.select(document.getElementById('github-calendar'))
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
            .attr('class', 'mx-auto');

            svg.append('rect')
               .attr('width', width)
               .attr('height', height)
               .attr('x', '1')
               .attr('y', '170')
               .attr('fill', 'rgba(0, 0, 0, 0)')
               .attr('stroke', 'rgb(229, 229, 229)')
               .attr('stroke-width', '1px');

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
            return result * (SQUARE_LENGTH + SQUARE_PADDING) + MARGIN_X;
          })
          .attr('y', function (d, i) {
            return MARGIN_Y + MONTH_LABEL_PADDING + formatWeekday(d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING);
          })
         .on("mouseover", function(d) {
             tooltip.setAttribute('style','position:absolute;');
             var dateStr = moment(d).format('ddd, MMM Do YYYY');
             var count = countForDate(d);
             let tech_name_list = Object.keys(count);
             let line_list = Object.values(count);
             let commit_detail = ''
             for (var i = 0; i < tech_name_list.length; i++) {
                 commit_detail += tech_name_list[i] + ' : ' + line_list[i] + ' lines ' + `<br/>`
             }
             //  Show the tooltip
             const commit_data = count ? count : "no commit";
             const newContent = document.createElement("div");
             newContent.innerHTML = `${dateStr} <br> ${commit_detail}`;
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

        if (typeof onClick === 'function') {
          (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('click', function(d) {
            var count = countForDate(d);
            onClick({ date: d, count: count.tech_name});
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
              .attr('x', function (d, i) { return (width - legendWidth +200) + (i + 1) * 19; })
              .attr('y', height - 40)
              .attr('fill', function (d) { return d; });

          legendGroup.append('text')
            .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-less')
            .attr('x', width - legendWidth + 207)
            .attr('y', height-25)
            .text(locale.Less);

          legendGroup.append('text')
            .attr('class', 'calendar-heatmap-legend-text calendar-heatmap-legend-text-more')
            .attr('x', (width - legendWidth + 275) + (colorRange.length) * 15)
            .attr('y', height-25)
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
              return (Math.floor(matchIndex / 7) * (SQUARE_LENGTH + SQUARE_PADDING))+ 15 + MARGIN_X;
            })
            .attr('y', MARGIN_Y);  // fix these to the top
        locale.days.forEach(function (day, index) {
          index = formatWeekday(index);
            if (index % 2) {
                x = MARGIN_X - 15;
                y = MARGIN_Y +(SQUARE_LENGTH + SQUARE_PADDING) * (index + 1)
                svg.append('text')
                .attr('transform', 'translate('+ x +',' + y + ')')
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
        return '<span><strong>' + (count ? count['tech_name'] + '  ' + count['lines'] : locale.No) + ' ' + pluralizedTooltipUnit(count)+ '</strong> ' + locale.on + ' ' + dateStr + '</span>';
      }

      function countForDate(d) {
          var key= moment(d).format( 'YYYY-MM-DD' );
          return counterMap[key];
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
    function color_choice(name, opacity){
        const colors = {
        'Django': `rgba(0,77,64,${opacity})`,
        'React':  `rgba(128,222,234,${opacity})`,
        'Android': `rgba(150,195,98,${opacity})`,
        'Angular': `rgba(183,28,28,${opacity})`,
        'HTML': `rgba(230,81,0,${opacity})`,
        'JavaScript': `rgba(255,214,0,${opacity})`,
        'Python': `rgba(2,119,189,${opacity})`,
        'Swift': `rgba(230,74,25,${opacity})`,
        'CSS': `rgba(2,119,189,${opacity})`,
        'Go':`rgba(77,208,225,${opacity})`,
        'C': `rgba(59,90,171,${opacity})`,
        'Ruby': `rgba(176,6,64,${opacity})`,
        'C++': `rgba(0,134,212,${opacity})`,
        'Spring': `rgba(139,195,74,${opacity})`,
        'Java': `rgba(244,67,54,${opacity})`,
        'Nodejs': `rgba(76,175,80,${opacity})`,
        'Dart': `rgba(66,165,245,${opacity})`,
        'Smali': `rgba(31,82,237,${opacity})`,
        'Kotlin': `rgba(128,110,227,${opacity})`,
        'Rust': `rgba(0,0,0,${opacity})`,
        'TypeScript': `rgba(25,118,210,${opacity})`,
        'Postgresql': `rgba(2,119,189,${opacity})`,
        'iOS': `rgba(255,109,0,${opacity})`,
        'PHP': `rgba(191,173,243,${opacity})`,
    }
    return colors[name]
    }
    if (!counts)
        return '#F1F1F1FF'
    else if (color_choice(Object.keys(counts)[0],1.0)){
        let tech_name = Object.keys(counts)[0]
        let lines = Object.values(counts)[0]
        if (lines > 99){
            let color = color_choice(tech_name,1.0)
            return color
        } else if (lines > 74){
            let color = color_choice(tech_name,0.86)
            return color
        } else if (lines > 49){
            let color = color_choice(tech_name,0.72)
            return color
        } else if (lines > 24){
            let color = color_choice(tech_name,0.58)
            return color
        } else {
            let color = color_choice(tech_name,0.44)
            return color
        }
    } else {
        let lines = Object.values(counts)[0]
        if (lines > 99){
            return 'rgba(7,141,169,1.0)'
        } else if (lines > 74){
            return 'rgba(7,141,169,0.86)'
        } else if (lines > 49){
            return 'rgba(7,141,169,0.72)'
        } else if (lines > 24){
            return 'rgba(7,141,169,0.58)'
        } else {
            return 'rgba(7,141,169,0.44)'
        }
    }
}
