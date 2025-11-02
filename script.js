// === Camis Chart Integration === //

// ================== DEMO DATA ================== //
const COUNTRY_DATA = [
  {
    country: "Taiwan",
    code: "TAIWAN",
    note: "pay-as-you-throw + strong recycling policy",
    data: [
      { year: 2015, landfilled: 200, burned: 500, recycled: 400, waste_per_person: 0.45 },
      { year: 2018, landfilled: 180, burned: 480, recycled: 460, waste_per_person: 0.42 },
      { year: 2020, landfilled: 170, burned: 470, recycled: 500, waste_per_person: 0.40 }
    ]
  },
  {
    country: "Germany",
    code: "GER",
    note: "separate bins, producer responsibility",
    data: [
      { year: 2015, landfilled: 50, burned: 600, recycled: 550, waste_per_person: 0.60 },
      { year: 2018, landfilled: 40, burned: 590, recycled: 600, waste_per_person: 0.58 },
      { year: 2020, landfilled: 35, burned: 580, recycled: 650, waste_per_person: 0.57 }
    ]
  },
  {
    country: "Honduras",
    code: "HND",
    note: "most waste goes to landfill / dump sites",
    data: [
      { year: 2015, landfilled: 300, burned: 50, recycled: 20, waste_per_person: 0.75 },
      { year: 2018, landfilled: 320, burned: 55, recycled: 22, waste_per_person: 0.78 },
      { year: 2020, landfilled: 340, burned: 60, recycled: 25, waste_per_person: 0.80 }
    ]
  },
  {
    country: "Paraguay",
    code: "PRY",
    note: "recycling mostly informal / manual sorting",
    data: [
      { year: 2015, landfilled: 260, burned: 80, recycled: 30, waste_per_person: 0.70 },
      { year: 2018, landfilled: 270, burned: 85, recycled: 35, waste_per_person: 0.72 },
      { year: 2020, landfilled: 290, burned: 90, recycled: 40, waste_per_person: 0.75 }
    ]
  }
];

// ================== GLOBAL STATE ================== //
let ACTIVE_COUNTRY_EL = null;
let CURRENT_COUNTRY = null;

let breakdownChart; // donut chart
let trendChart;     // line chart

// ================== INIT ================== //
window.addEventListener('DOMContentLoaded', () => {
  buildCountryList(COUNTRY_DATA);
  initCharts();
  setCountry(COUNTRY_DATA[0]); // default select first country
});

// ================== LEFT COLUMN LIST ================== //
function buildCountryList(countries) {
  const listEl = document.getElementById('countryList');
  listEl.innerHTML = "";

  countries.forEach((c, idx) => {
    const li = document.createElement('li');
    li.className = 'country-list-item';
    li.dataset.code = c.code;
    li.innerHTML = `
      <div class="country-left">${c.country}</div>
      <div class="country-right">${c.note}</div>
    `;

    li.addEventListener('click', () => {
      highlightCountry(li);
      setCountry(c);
    });

    listEl.appendChild(li);

    // preselect first
    if (idx === 0) {
      highlightCountry(li);
    }
  });
}

function highlightCountry(li) {
  if (ACTIVE_COUNTRY_EL && ACTIVE_COUNTRY_EL !== li) {
    ACTIVE_COUNTRY_EL.classList.remove('active');
  }
  ACTIVE_COUNTRY_EL = li;
  ACTIVE_COUNTRY_EL.classList.add('active');
}

// ================== CHART INIT ================== //
function initCharts() {
  breakdownChart = echarts.init(document.getElementById('breakdownChart'));
  trendChart = echarts.init(document.getElementById('trendChart'));

  window.addEventListener('resize', () => {
    breakdownChart.resize();
    trendChart.resize();
  });
}

// ================== UPDATE DASHBOARD ================== //
function setCountry(cObj) {
  CURRENT_COUNTRY = cObj;
  const rows = cObj.data;

  const years = rows.map(r => r.year);

  // --- latest year slice for donut --- //
  const latest = rows[rows.length - 1];
  const latestTotals = {
    landfilled: latest.landfilled,
    burned: latest.burned,
    recycled: latest.recycled
  };
  const total = latestTotals.landfilled + latestTotals.burned + latestTotals.recycled;

  // --- recycling % over time for trend line --- //
  const recyclePctSeries = rows.map(r => {
    const t = r.landfilled + r.burned + r.recycled;
    return t ? (r.recycled / t) * 100 : 0;
  });

  // --- KPI values --- //
  const recycledShareLatest = total ? (latestTotals.recycled / total) * 100 : 0;
  const kgLatest = latest.waste_per_person;

  // --- Update header/subtitle/KPIs --- //
  document.getElementById('countryTitle').textContent = cObj.country;
  document.getElementById('countrySubtitle').textContent =
    `${rows[0].year}–${latest.year} · recycling trend + latest breakdown`;

  document.getElementById('latestPct').textContent =
    recycledShareLatest.toFixed(1) + "%";

  document.getElementById('kgPerPerson').textContent =
    kgLatest.toFixed(2) + " kg";

  // --- Donut data prep --- //
  const donutData = [
    {
      key: 'landfilled',
      label: 'Landfilled',
      value: latestTotals.landfilled,
      color: 'rgba(239,244,247,0.35)'
    },
    {
      key: 'burned',
      label: 'Burned (incinerated)',
      value: latestTotals.burned,
      color: '#E6C24A'
    },
    {
      key: 'recycled',
      label: 'Recycled',
      value: latestTotals.recycled,
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: '#A6D536' },
          { offset: 1, color: '#6EBE88' }
        ]
      }
    }
  ];

  // --- Render DONUT CHART (Latest breakdown) --- //
  breakdownChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      textStyle: { color: '#EFF4F7', fontSize: 12 },
      formatter: p => {
        return `
          ${p.name}<br/>
          <b>${p.percent.toFixed(1)}%</b> (${p.value}k t)
        `;
      }
    },
    legend: { show: false }, // we build our own legend below 
    series: [{
      type: 'pie',
      radius: ['60%', '78%'], // thinner ring
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      minAngle: 5,
      label: {
        show: true,
        position: 'outside',
        color: 'rgba(239,244,247,0.9)',
        fontSize: 13,
        lineHeight: 16,
        formatter: ({ name, percent }) => {
          return `${name}\n${percent.toFixed(2)}%`;
        }
      },
      labelLine: {
        show: true,
        length: 14,
        length2: 10,
        lineStyle: {
          color: 'rgba(239,244,247,0.6)',
          width: 1
        }
      },
      itemStyle: {
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.4)'
      },
      data: donutData.map(d => ({
        name: d.label,
        value: d.value,
        itemStyle: { color: d.color }
      }))
    }]
  }, true);

  // --- Build custom legend row under donut --- //
  const legendEl = document.getElementById('breakdownLegend');
  legendEl.innerHTML = `
    <div class="legend-item">
      <div class="legend-swatch" style="background-color:rgba(239,244,247,0.35);border-color:rgba(0,0,0,0.4);"></div>
      <div>Landfilled</div>
    </div>
    <div class="legend-item">
      <div class="legend-swatch burn"></div>
      <div>Burned (incinerated)</div>
    </div>
    <div class="legend-item">
      <div class="legend-swatch recycle"></div>
      <div>Recycled</div>
    </div>
  `;

  // --- Render LINE CHART (Recycling trend over time) --- //
  const maxPct = Math.max(
    60,
    Math.ceil(Math.max(...recyclePctSeries) / 10) * 10
  );

  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(0,0,0,0.85)',
      borderColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      textStyle: { color: '#EFF4F7', fontSize: 12 },
      formatter: p => {
        const i = p[0].dataIndex;
        return `
          ${years[i]}<br/>
          <b>${recyclePctSeries[i].toFixed(1)}%</b> recycled
        `;
      }
    },
    grid: { left: 40, right: 30, top: 24, bottom: 36 },

    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: 'rgba(239,244,247,0.35)' } },
      axisLabel: { color: 'rgba(239,244,247,0.85)' }
    },

    yAxis: {
      type: 'value',
      min: 0,
      max: maxPct,
      axisLabel: {
        formatter: '{value}%',
        color: 'rgba(239,244,247,0.85)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(239,244,247,0.12)'
        }
      }
    },

    series: [{
      type: 'line',
      data: recyclePctSeries,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: {
        width: 3,
        color: '#A6D536',
        shadowBlur: 12,
        shadowColor: 'rgba(166,213,54,0.5)'
      },
      itemStyle: {
        color: '#A6D536',
        borderColor: '#0A3033',
        borderWidth: 2
      },
      areaStyle: {
        opacity: 0.15,
        color: 'rgba(166,213,54,0.25)'
      }
    }]
  }, true);
}


// === Jorge Chart Integration === //
window.addEventListener('DOMContentLoaded', () => {
  const chartDom = document.getElementById('chartJorge');
  if (!chartDom) return; // safety check
  const myChart = echarts.init(chartDom);

  const categories = ['incineration','landfill','composting','stockpiling'];
  const displayNames = {
    incineration: 'Incineration',
    landfill: 'Landfill',
    composting: 'Composting',
    stockpiling: 'Stockpiling'
  };

  async function loadAndRender() {
    try {
      const res = await fetch('dataJorge.json', { cache: 'no-store' });
      const data = await res.json();

      const years = data.map(d => d.year);
      const totals = data.map(d => d.total ?? 0);

      const seriesData = {};
      categories.forEach(k => seriesData[k] = data.map(d => d[k] ?? 0));

      // ✅ Apply gradient only to "Landfill" bars
      const series = categories.map(k => {
        const base = {
          name: displayNames[k],
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: seriesData[k]
        };

        if (k === 'landfill') {
          base.itemStyle = {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#A6D536' }, // Gradient start
                { offset: 1, color: '#6EBE88' }  // Gradient end
              ]
            }
          };
        }
        return base;
      });

      // ✅ Show total as a line if checkbox is checked
      const toggleTotal = document.getElementById('toggleTotalJorge');
      if (toggleTotal && toggleTotal.checked) {
        series.push({
          name: 'Total',
          type: 'line',
          data: totals,
          smooth: true,
          symbol: 'circle',
          lineStyle: { width: 3, color: '#EFF4F7' },
          itemStyle: { color: '#EFF4F7' },
          emphasis: { focus: 'series' }
        });
      }

      const option = {
        backgroundColor: 'transparent',
        textStyle: { color: '#EFF4F7' },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow', lineStyle: { color: '#EFF4F7' } },
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderColor: 'rgba(255,255,255,0.15)',
          textStyle: { color: '#EFF4F7' },
          formatter: params => {
            let s = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach(p => {
              s += `${p.marker} ${p.seriesName}: ${p.data}<br/>`;
            });
            return s;
          }
        },
        legend: {
          top: '5%',
          textStyle: { color: 'rgba(239,244,247,0.85)' },
          data: [...Object.values(displayNames), 'Total']
        },
        grid: { left: '5%', right: '5%', bottom: '5%', containLabel: true },
        xAxis: [{
          type: 'category',
          data: years,
          axisLine: { lineStyle: { color: 'rgba(239,244,247,0.5)' } },
          axisLabel: { color: 'rgba(239,244,247,0.9)' }
        }],
        yAxis: [{
          type: 'value',
          name: 'Number of Plants/Sites',
          axisLine: { lineStyle: { color: 'rgba(239,244,247,0.5)' } },
          axisLabel: { color: 'rgba(239,244,247,0.9)' },
          splitLine: { lineStyle: { color: 'rgba(239,244,247,0.12)' } }
        }],
        series: series
      };

      myChart.setOption(option, true);
    } catch (err) {
      console.error('Failed to load dataJorge.json', err);
      myChart.showLoading({ text: 'Data not found', color: '#EFF4F7' });
    }
  }

  document.getElementById('refreshBtnJorge').addEventListener('click', loadAndRender);
  document.getElementById('toggleTotalJorge').addEventListener('change', loadAndRender);

  loadAndRender();
  window.addEventListener('resize', () => myChart.resize());
});



// ========== 王劭祺 Map + Chart Integration ========== //
let centerCoordMilk = [23.968567619303094, 120.97345504726468];

function createMapMilk(allData) {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhYm9ibyIsImEiOiJjamVvejdlNXQxZnBuMndtdWhiZHRuaTNpIn0.PIS9wtUxm_rz_IzF2WFD1g';
  const map = new mapboxgl.Map({
    container: "mapMilk",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [centerCoordMilk[1], centerCoordMilk[0]],
    zoom: 6.5
  });

  allData.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'custom-marker-jackie';
    el.dataset.index = i;

    const marker = new mapboxgl.Marker(el)
      .setLngLat(item["coord"])
      .addTo(map);

    if (i === 6) {  
      el.classList.add('selectedMilk');
    }

    el.addEventListener("click", () => {
      const prevMilk = document.querySelector('.custom-marker-jackie.selectedMilk');
      if (prevMilk) prevMilk.classList.remove('selectedMilk');
      el.classList.add('selectedMilk');

      setChartMilk(item);
    });
  });
}


const pieChartMilk = echarts.init(document.getElementById("chart1Milk"));

function createChartMilk(data) {
  const values = data["value"];
  const dateList = [];
  const paperList = [];
  const metalList = [];
  const plasticList = [];
  const glassList = [];
  const batteryList = [];

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    dateList.push(v["date"]);
    paperList.push(v["paper and paper products"]);
    metalList.push(v["metal"]);
    plasticList.push(v["plastic and rubber products"]);
    glassList.push(v["glass products"]);
    batteryList.push(v["battery"]);
  }

  const option = {
  legend: {
    textStyle: { color: '#EFF4F7' },
    inactiveColor: '#666'
  },
  tooltip: { trigger: 'axis', showContent: false },
  title: {
    text: data["station"],
    left: 'left',
    textStyle: { color: "#EFF4F7", fontSize: 24, fontWeight: 400 }
  },
  xAxis: {
    type: 'category',
    data: dateList,
    axisLine: { lineStyle: { color: '#EFF4F7' } },
    axisLabel: { color: '#EFF4F7' }
  },
  yAxis: {
    axisLabel: { color: '#EFF4F7' },
    splitLine: { lineStyle: { color: '#b6b6b6' } }
  },
  grid: { top: '50%' },
  series: [
    { type: 'line', data: paperList, itemStyle: { color: '#A6D536' }, smooth: true },
    { type: 'line', data: metalList, itemStyle: { color: '#0f9d58' }, smooth: true },
    { type: 'line', data: plasticList, itemStyle: { color: '#85D24B' }, smooth: true },
    { type: 'line', data: glassList, itemStyle: { color: '#6EBE88' }, smooth: true },
    { type: 'line', data: batteryList, itemStyle: { color: '#EFF4F7' }, smooth: true },
    {
      type: 'pie',
      id: 'pie',
      radius: ['20%', '28%'],
      center: ['50%', '25%'],
      avoidLabelOverlap: true,
      label: {
        formatter: '{b}: {@"2025-03"} ({d}%)',
        fontSize: 12,
        color: "#EFF4F7",
        fontWeight: 400
      },
      itemStyle: {
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.4)'
      },
      emphasis: {
        scale: true
      },
      data: [
        {
          name: 'Paper',
          value: paperList,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#A6D536' },
                { offset: 1, color: '#6EBE88' }
              ]
            },
            borderWidth: 2,
            borderColor: 'rgba(0,0,0,0.4)'
          },
        },
        { name: 'Metal', value: metalList, itemStyle: { color: '#0f9d58' } },
        { name: 'Plastic', value: plasticList, itemStyle: { color: '#85D24B' } },
        { name: 'Glass', value: glassList, itemStyle: { color: '#6EBE88' } },
        { name: 'Battery', value: batteryList, itemStyle: { color: '#EFF4F7' } }
      ]
    }
  ]
};


  // Responsives Verhalten aktivieren
  window.addEventListener('resize', () => {
    pieChartMilk.resize();
  });  

  pieChartMilk.on('updateAxisPointer', event => {
    const xAxisInfo = event.axesInfo[0];
    if (xAxisInfo) {
      const dimension = xAxisInfo.value;
      pieChartMilk.setOption({
        series: {
          id: 'pie',
          label: { formatter: '{b}: {@[' + dimension + ']} ({d}%)' },
          encode: { value: dimension, tooltip: dimension }
        }
      });
    }
  });

  pieChartMilk.setOption(option);
}

function setChartMilk(data) {
  createChartMilk(data);
}

// Load data and initialize
fetch("dataMilk.json")
  .then(res => res.json())
  .then(allData => {
    createMapMilk(allData);
    setChartMilk(allData[6]);
  })
  .catch(err => console.error("Failed to load data.json", err));


  
/* ================== JACKIE MODULE — SAFELY INTEGRATED ================== */

let currentViewJackie = 'Long-term';
let allDataJackie = [];
let currentPlaceJackie = null;
let lineChartJackie;
let activeMarkerJackie = null;

$(document).ready(function () {
  // Use unique ID to avoid collision
  lineChartJackie = echarts.init(document.getElementById("lineChartJackie"));

  function createChartJackie(values, chart) {
    if (!values || values.length === 0) return;

    let xAxisLabels = (currentViewJackie === 'Long-term') 
      ? Array.from({length: 2024-2011+1}, (_, i) => (2011+i).toString())
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let totalList = [], genList = [], recList = [], foodList = [];
    values.forEach(v => {
      totalList.push(v.total);
      genList.push(v.general);
      recList.push(v.recycle);
      foodList.push(v.food);
    });

    let option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [
          'Total production',
          'General waste',
          'Resource waste',
          'Food waste'
        ],
        bottom: 10,
        textStyle: { color: "#EFF4F7" },
        icon: 'circle'
      },
      xAxis: { type: 'category', data: xAxisLabels },
      yAxis: { type: 'value' },
      grid: { left:'5%', right:'5%', bottom:'10%', containLabel:true },
      series: [
        { name:'Total production', type:'line', data:totalList },
        { name:'General waste', type:'line', data:genList },
        { name:'Resource waste', type:'line', data:recList },
        { name:'Food waste', type:'line', data:foodList }
      ]
    };
    chart.setOption(option);
  }

  function updateDashboardJackie(place) {
    currentPlaceJackie = place;
    $('#placeNameOverlayJackie').text(place.place_en);

    let valuesToUse = (currentViewJackie === 'Long-term') ? place.value : place.value_monthly;
    createChartJackie(valuesToUse, lineChartJackie);

    let buttonText = (currentViewJackie === 'Long-term') ? 'Change to One-year' : 'Change to Long-term';
    $('#y-mButtonJackie').text(buttonText);
  }

  function createMapJackie(allDataJackie) {
    let centerCoord = [23.968567619303094, 120.97345504726468];
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhYm9ibyIsImEiOiJjamVvejdlNXQxZnBuMndtdWhiZHRuaTNpIn0.PIS9wtUxm_rz_IzF2WFD1g';
    const map = new mapboxgl.Map({
      container: "mapJackie",
      style: "mapbox://styles/mapbox/dark-v11",
      center: [centerCoord[1], centerCoord[0]],
      zoom: 6.5
    });

    allDataJackie.forEach((place, i) => {
      const coord = place.coord;
      const lngLat = coord[0] > 90 ? [coord[0], coord[1]] : [coord[1], coord[0]];

      const el = document.createElement('div');
      el.className = 'custom-marker-jackie';
      el.dataset.place = place.place_en;

      const markerInstance = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .addTo(map);

      el.addEventListener('click', () => {
        if (activeMarkerJackie) {
          activeMarkerJackie.classList.remove('selected');
        }
        el.classList.add('selected');
        activeMarkerJackie = el;

        updateDashboardJackie(place);
      });

      if (i === 6) {
        el.classList.add('selected');
        activeMarkerJackie = el;
      }
    });
  }

  $.getJSON("dataJackie.json", function(data) {
    allDataJackie = data;
    createMapJackie(allDataJackie);
    updateDashboardJackie(allDataJackie[6]);
  });

  $('#y-mButtonJackie').click(function() {
    currentViewJackie = (currentViewJackie === 'Long-term') ? 'One-year overview' : 'Long-term';
    if (currentPlaceJackie) updateDashboardJackie(currentPlaceJackie);
  });

  window.addEventListener('resize', () => lineChartJackie.resize());
});
