// ==UserScript==
// @name         Buffer Flow Control
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Required for IB buffer calculator
// @author       Lukasz Milcz - milcz@amazon.com
// @match        https://inbound-flow-control.amazon.com/buffer
// @icon         https://m.media-amazon.com/images/I/51iG0M0wqtL._AC_UF894,1000_QL80_.jpg
// @grant        GM.xmlHttpRequest
// ==/UserScript==

///////////GLOBAL SETTINGS
    //set shift and current time
let currentShift = ''
const bufferExpInHours = 2.5
let time = ''
let hour = ''
let minutes = ''
let day = ''
let month = ''
let year = ''
function setTimeAndShift() {
    time = new Date()
    hour = time.getHours()
    minutes = time.getMinutes()
    day = time.getDate()
    if (day < 10) {
     day = '0' + day
    }
    month = time.getMonth() + 1
    if (month < 10) {
     month = '0' + month
    }
    year = time.getFullYear()

    if ((hour >= 8 && minutes >= 30) && (hour < 19)) {
        currentShift = 'DS'
    } else if ((hour >= 19 && minutes >= 30) || (hour < 6)) {
        currentShift = 'NS'
    } else {
        currentShift = 'betweenShifts'
    }
}
setTimeAndShift()

/////////// HTTP REQUESTS
    //get stow rate
async function getStowRate() {
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: 'https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&current_day=false&startDateTime=-2+hours&endDateTime=today&mom_ids=321&osm_ids=31&oxm_ids=435&ofm_ids=&viz=nvd3Table&instance_id=2210&object_id=19851&BrowserTZ=Europe%2FLondon&app_name=RoboScout',
        onload: (response) => {
          resolve(response.response.data);
        },
      });
    });
    return response
  }
//const stowRatesRaw = await getStowRate()

    //get worked hours on each field during last 2 hours
async function getWorkedHours() {
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: "https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&current_day=false&startDateTime=-2+hours&endDateTime=today&mom_ids=720&osm_ids=31&oxm_ids=435&ofm_ids=&viz=nvd3Table&instance_id=2210&object_id=19851&BrowserTZ=Europe%2FLondon&app_name=RoboScout",
        onload: (response) => {
          resolve(response.response.data);
        },
      });
    });
    return response
  }
//const workedHours = await getWorkedHours()

//get current stow headcount
async function getCurrentHeadcount() {
    const url = 'https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&instance_id=2005&object_id=20604&BrowserTZ=Europe/London&app_name=RoboScout'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: url,

        onload: (response) => {
          resolve(response.response.data);
        },
      });
    });
    return response
  }
//const currentHeadcount = await getCurrentHeadcount()

//get historical stow headcount
async function getHistoricalHeadcount() {
    let url = ''
    if (currentShift == 'DS') {
    url = `https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&current_day=false&startDateTime=${year}-${month}-${day}+07%3A00%3A00&endDateTime=${year}-${month}-${day}%3A30%3A00&mom_ids=338&osm_ids=31&oxm_ids=436&ofm_ids=&viz=nvd3Table&instance_id=2210&object_id=19851&BrowserTZ=Europe%2FLondon&app_name=RoboScout`
    } else {}
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: url,

        onload: (response) => {
          resolve(response.response.data);
        },
      });
    });
    return response
  }
//const historicalHeadcount = await getHistoricalHeadcount()

//get buffer count
async function getBuffer() {
    const startTime = time - 86400000
    const endTime = time - 30000
    const url = 'https://inbound-flow-svc-dub-prod.amazon.com/'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "POST",
        responseType: "json",
        referrer: "https://inbound-flow-control.amazon.com/",
        headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-amz-json-1.0",
        "X-Amz-Target": "AFTInboundFlowControlService.GetFcFlowSnapshot",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "referrer": "https://inbound-flow-control.amazon.com/"
        },
        url: url,
        data: "{\"warehouseId\":\"LCY2\"}",
        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response.warehouse.locations[2].childLocations
  }
//const buffer = await getBuffer()

//get P2 buffer count
async function getBufferP2() {
    const startTime = time - 86400000
    const endTime = time - 30000
    const url = 'https://ifc-historical-data-svc-dub.amazon.com/'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "POST",
        responseType: "json",
        headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json; charset=utf-8",
        "X-Amz-Target": "com.amazon.aftifchistoricaldataservice.AFTIFCHistoricalDataService.GetLocationHistory",
        "Content-Encoding": "amz-1.0",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
        },
        url: url,
        data: `{\"warehouseId\":{\"id\":\"LCY2\"},\"locationHistoryRequestList\":[{\"locationId\":{\"id\":\"fl-2\",\"type\":\"SCANNABLE_ID\"},\"ifcProcessName\":\"Stow\",\"startTimeMillis\":${startTime},\"endTimeMillis\":${endTime}}]}`,
        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response.successLocationHistoryList[0].dataPointSet.sort((a, b) => b.timestamp - a.timestamp)
  }
//const bufferP2 = await getBufferP2()

//get P3 buffer count
async function getBufferP3() {
    const startTime = time - 86400000
    const endTime = time - 30000
    const url = 'https://ifc-historical-data-svc-dub.amazon.com/'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "POST",
        responseType: "json",
        headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json; charset=utf-8",
        "X-Amz-Target": "com.amazon.aftifchistoricaldataservice.AFTIFCHistoricalDataService.GetLocationHistory",
        "Content-Encoding": "amz-1.0",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
        },
        url: url,
        data: `{\"warehouseId\":{\"id\":\"LCY2\"},\"locationHistoryRequestList\":[{\"locationId\":{\"id\":\"fl-3\",\"type\":\"SCANNABLE_ID\"},\"ifcProcessName\":\"Stow\",\"startTimeMillis\":${startTime},\"endTimeMillis\":${endTime}}]}`,
        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response.successLocationHistoryList[0].dataPointSet.sort((a, b) => b.timestamp - a.timestamp)
  }
//const bufferP3 = await getBufferP3()

//get P4 buffer count
async function getBufferP4() {
    const startTime = time - 86400000
    const endTime = time - 30000
    const url = 'https://ifc-historical-data-svc-dub.amazon.com/'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "POST",
        responseType: "json",
        headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json; charset=utf-8",
        "X-Amz-Target": "com.amazon.aftifchistoricaldataservice.AFTIFCHistoricalDataService.GetLocationHistory",
        "Content-Encoding": "amz-1.0",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
        },
        url: url,
        data: `{\"warehouseId\":{\"id\":\"LCY2\"},\"locationHistoryRequestList\":[{\"locationId\":{\"id\":\"fl-4\",\"type\":\"SCANNABLE_ID\"},\"ifcProcessName\":\"Stow\",\"startTimeMillis\":${startTime},\"endTimeMillis\":${endTime}}]}`,
        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response.successLocationHistoryList[0].dataPointSet.sort((a, b) => b.timestamp - a.timestamp)
  }
//const bufferP4 = await getBufferP4()

//get current bin fullness
async function getBinFullness() {
    const url = 'https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&mom_ids=1924&osm_ids=1267&oxm_ids=2148&ofm_ids=&instance_id=0&object_id=21284&BrowserTZ=Europe%2FLondon&app_name=RoboScout'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: url,

        onload: (response) => {
          resolve(response.response.data);
        },
      });
    });
    return response
  }

//get PPR data
async function getPPRdataETI() {
    const startTime = new Date(time - 7200000)
    const endTime = new Date(time)
    let startHour = startTime.getHours()
    if (startHour < 10) {
     startHour = '0' + startHour
    }
    let startMinute = startTime.getMinutes()
    if (startMinute < 10) {
     startMinute = '0' + startMinute
    }
    let endHour = endTime.getHours()
    if (endHour < 10) {
     endHour = '0' + endHour
    }
    let endMinute = endTime.getMinutes()
    if (endMinute < 10) {
     endMinute = '0' + endMinute
    }
    const url = `https://fclm-portal.amazon.com/reports/functionRollup?warehouseId=LCY2&spanType=Intraday&startDate=${year}-${month}-${day}T${startHour}:${startMinute}:00.000&endDate=${year}-${month}-${day}T${endHour}:${endMinute}:00.000&reportFormat=HTML&processId=01002976`
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        url: url,

        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response
  }
//const pprData = await getPPRdata()

/////////////////////
//////////////////// GLOBAL VARIABLES
const currentHeadcountP2 = document.createElement('div')
const currentHeadcountP3 = document.createElement('div')
const currentHeadcountP4 = document.createElement('div')
let p2headcount = ''
let p3headcount = ''
let p4headcount = ''
const currentStowRateP2 = document.createElement('div')
const currentStowRateP3 = document.createElement('div')
const currentStowRateP4 = document.createElement('div')
let p2rate = ''
let p3rate = ''
let p4rate = ''
const currentBufferP2 = document.createElement('div')
const currentBufferP3 = document.createElement('div')
const currentBufferP4 = document.createElement('div')
const currentBufferP2plus = document.createElement('div')
const currentBufferP3plus = document.createElement('div')
const currentBufferP4plus = document.createElement('div')
const currentBufferP2minus = document.createElement('div')
const currentBufferP3minus = document.createElement('div')
const currentBufferP4minus = document.createElement('div')
const deltaP2 = document.createElement('div')
const deltaP3 = document.createElement('div')
const deltaP4 = document.createElement('div')
const binFullnessP2 = document.createElement('div')
const binFullnessP3 = document.createElement('div')
const binFullnessP4 = document.createElement('div')
const prdMixP2noqs = document.createElement('div')
const prdMixP3noqs = document.createElement('div')
const prdMixP4noqs = document.createElement('div')
const prdMixP2qs = document.createElement('div')
const prdMixP3qs = document.createElement('div')
const prdMixP4qs = document.createElement('div')

///////////////////
//////////////////

//set document title and favicon
document.title = 'Inbound Flow Control... on steroids!'
let flav = document.createElement('link');
flav.rel = 'icon';
document.head.appendChild(flav);
flav.href = 'https://m.media-amazon.com/images/I/51iG0M0wqtL._AC_UF894,1000_QL80_.jpg'

//create main window
document.getElementsByTagName('body')[0].style.fontFamily = 'Verdana, sans-serif'
document.getElementsByTagName('p')[0].style.display = 'none'
document.getElementsByTagName('h1')[0].style.display = 'none'
document.getElementsByTagName('body')[0].style.backgroundColor = '#FAFAFA'

//create title
const title = document.createElement('div')
const titleH1 = document.createElement('div')
const titleH2 = document.createElement('div')
document.getElementsByTagName('body')[0].appendChild(title)
title.appendChild(titleH1)
title.appendChild(titleH2)
titleH1.innerHTML = 'Inbound Flow Control'
titleH2.innerHTML = '...on steroids!'
title.style.textAlign = 'center'
title.style.backgroundColor = '#f5f5f5'
title.style.padding = '0.5em'
title.style.border = '1px solid black'
title.style.borderRadius = '15px'
title.style.maxWidth = '1200px'
title.style.margin = 'auto'
titleH1.style.fontSize = '2.5em'
titleH1.style.fontWeight = 'bold'
titleH2.style.marginLeft = '30%'
titleH2.style.fontStyle = 'italic'
titleH2.style.fontFamily = 'Bradley Hand, cursive'
titleH2.style.color = '#FF0000'

//create loading element
const loadingElement = document.createElement('h2')
document.getElementsByTagName('body')[0].appendChild(loadingElement)
loadingElement.innerHTML = 'Loading data...'
loadingElement.style.margin = '40vh auto'
loadingElement.style.textAlign = 'center'
loadingElement.style.fontWeight = 'normal'


createTable()

///////////FUNCTIONS
///create table with content
async function createTable() {
    let stowRatesRaw = await getStowRate()
    let workedHours = await getWorkedHours()
    let currentHeadcount = await getCurrentHeadcount()
    let bufferP2 = await getBufferP2()
    let bufferP3 = await getBufferP3()
    let bufferP4 = await getBufferP4()
    let pprDataETI = await getPPRdataETI()
    let binFullness = await getBinFullness()

    loadingElement.style.display = 'none'
    //create container for 3 floors
    const container = document.createElement('div')
    document.getElementsByTagName('body')[0].appendChild(container)
    //container.style.display = 'grid'
    //container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'
    container.style.backgroundColor = '#f5f5f5'
    container.style.maxWidth = '1000px'
    container.style.minWidth = '900px'
    container.style.margin = '15px auto'

    //create capacity table
    const capacityTable = document.createElement('table')
    container.appendChild(capacityTable)
    capacityTable.style.width = '100%'
    const tableHeaders = ['', 'P2', 'P3', 'P4']
    for (let header of tableHeaders) {
        const tableHeaderElement = document.createElement('th')
        capacityTable.appendChild(tableHeaderElement)
        tableHeaderElement.innerHTML = header
        tableHeaderElement.style.border = '1px solid #C1C1C1'
        tableHeaderElement.style.borderCollapse = 'collapse'
        tableHeaderElement.style.width = '25%'

    }

    //create metrics titles
    const emptyBlock = document.createElement('h3')
    emptyBlock.innerHTML = 'Metric'
    const metricsContainer = document.createElement('div')
    metricsContainer.appendChild(emptyBlock)
    container.appendChild(metricsContainer)
    metricsContainer.style.display = 'flex'
    metricsContainer.style.flexDirection = 'column'
    const metrics = ['Headcount', 'Rate', 'Current Buffer', '2,5 Hours Buffer + 20%', '2,5 Hours Buffer - 20%', 'Buffer Delta (2,5 hours)', 'Bin Fullness', 'Smalls Last 2 Hours No QS', 'Smalls Last 2 Hours With QS']
    for (let metric of metrics) {
        const metricElement = document.createElement('div')
        metricsContainer.appendChild(metricElement)
        metricElement.innerHTML = metric
        metricElement.style.borderBottom = '1px solid black'
        metricElement.style.padding = '5px'
    }

    //create 3 smaller containers for each floor
    const p2Container = document.createElement('div')
    container.appendChild(p2Container)
    const p2Title = document.createElement('h3')
    p2Title.innerHTML = 'P2'
    p2Container.appendChild(p2Title)

    const p3Container = document.createElement('div')
    container.appendChild(p3Container)
    const p3Title = document.createElement('h3')
    p3Title.innerHTML = 'P3'
    p3Container.appendChild(p3Title)

    const p4Container = document.createElement('div')
    container.appendChild(p4Container)
    const p4Title = document.createElement('h3')
    p4Title.innerHTML = 'P4'
    p4Container.appendChild(p4Title)

    p2Container.appendChild(currentHeadcountP2)
    p3Container.appendChild(currentHeadcountP3)
    p4Container.appendChild(currentHeadcountP4)
    p2headcount = Number(currentHeadcount[7].yValue) + Number(currentHeadcount[58].yValue)
    p3headcount = Number(currentHeadcount[24].yValue) + Number(currentHeadcount[75].yValue)
    p4headcount = Number(currentHeadcount[41].yValue) + Number(currentHeadcount[92].yValue)
    currentHeadcountP2.innerHTML = p2headcount
    currentHeadcountP3.innerHTML = p3headcount
    currentHeadcountP4.innerHTML = p4headcount
    p2rate = Math.round(((Math.round(stowRatesRaw[1].yValue) * Math.round(workedHours[1].yValue)) + (Math.round(stowRatesRaw[7].yValue) * Math.round(workedHours[7].yValue))) / (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)))
    p3rate = Math.round(((Math.round(stowRatesRaw[3].yValue) * Math.round(workedHours[3].yValue)) + (Math.round(stowRatesRaw[9].yValue) * Math.round(workedHours[9].yValue))) / (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)))
    p4rate = Math.round(((Math.round(stowRatesRaw[5].yValue) * Math.round(workedHours[5].yValue)) + (Math.round(stowRatesRaw[11].yValue) * Math.round(workedHours[11].yValue))) / (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))
    p2Container.appendChild(currentStowRateP2)
    p3Container.appendChild(currentStowRateP3)
    p4Container.appendChild(currentStowRateP4)
    currentStowRateP2.innerHTML = p2rate
    currentStowRateP3.innerHTML = p3rate
    currentStowRateP4.innerHTML = p4rate
    p2Container.appendChild(currentBufferP2)
    p3Container.appendChild(currentBufferP3)
    p4Container.appendChild(currentBufferP4)
    currentBufferP2.innerHTML = bufferP2[0].data['unit-count'].toLocaleString()
    currentBufferP3.innerHTML = bufferP3[0].data['unit-count'].toLocaleString()
    currentBufferP4.innerHTML = bufferP4[0].data['unit-count'].toLocaleString()
    p2Container.appendChild(currentBufferP2plus)
    p3Container.appendChild(currentBufferP3plus)
    p4Container.appendChild(currentBufferP4plus)
    currentBufferP2plus.innerHTML = Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    currentBufferP3plus.innerHTML = Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    currentBufferP4plus.innerHTML = Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2Container.appendChild(currentBufferP2minus)
    p3Container.appendChild(currentBufferP3minus)
    p4Container.appendChild(currentBufferP4minus)
    currentBufferP2minus.innerHTML = Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    currentBufferP3minus.innerHTML = Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    currentBufferP4minus.innerHTML = Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2Container.appendChild(deltaP2)
    p3Container.appendChild(deltaP3)
    p4Container.appendChild(deltaP4)
    deltaP2.innerHTML = Math.floor((bufferP2[0].data['unit-count'] - (p2headcount * p2rate * bufferExpInHours))).toLocaleString()
    deltaP3.innerHTML = Math.floor((bufferP3[0].data['unit-count'] - (p3headcount * p3rate * bufferExpInHours))).toLocaleString()
    deltaP4.innerHTML = Math.floor((bufferP4[0].data['unit-count'] - (p4headcount * p4rate * bufferExpInHours))).toLocaleString()
    p2Container.appendChild(binFullnessP2)
    p3Container.appendChild(binFullnessP3)
    p4Container.appendChild(binFullnessP4)
    binFullnessP2.innerHTML = 'A2:' + Math.round(binFullness[1].yValue) + '% B2:' + Math.round(binFullness[7].yValue) + '%'
    binFullnessP3.innerHTML = 'A3:' + Math.round(binFullness[3].yValue) + '% B3:' + Math.round(binFullness[9].yValue) + '%'
    binFullnessP4.innerHTML = 'A4:' + Math.round(binFullness[5].yValue) + '% B4:' + Math.round(binFullness[11].yValue) + '%'
    p2Container.appendChild(prdMixP2noqs)
    p3Container.appendChild(prdMixP3noqs)
    p4Container.appendChild(prdMixP4noqs)
    p2Container.appendChild(prdMixP2qs)
    p3Container.appendChild(prdMixP3qs)
    p4Container.appendChild(prdMixP4qs)

    const pprETI = document.createElement('html')
    pprETI.innerHTML = pprDataETI
    const etiSmallNike = pprETI.querySelector('#summary').children[2].children[0].children[5].innerHTML
    const etiTotalNike = pprETI.querySelector('#summary').children[2].children[4].children[4].innerHTML
    const etiSmallTotal = (Number(pprETI.querySelector('#summary').children[2].children[5].children[5].innerHTML) + Number(pprETI.querySelector('#summary').children[2].children[0].children[5].innerHTML))
    const etiTotal = pprETI.querySelector('#summary').children[3].children[0].children[4].innerHTML

    prdMixP2noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
    prdMixP3noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
    prdMixP4noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
    prdMixP2qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'
    prdMixP3qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'
    prdMixP4qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'

    //add clases
    currentHeadcountP2.classList.add('dataCell')
    currentHeadcountP3.classList.add('dataCell')
    currentHeadcountP4.classList.add('dataCell')
    currentStowRateP2.classList.add('dataCell')
    currentStowRateP3.classList.add('dataCell')
    currentStowRateP4.classList.add('dataCell')
    currentBufferP2.classList.add('dataCell')
    currentBufferP3.classList.add('dataCell')
    currentBufferP4.classList.add('dataCell')
    currentBufferP2plus.classList.add('dataCell')
    currentBufferP3plus.classList.add('dataCell')
    currentBufferP4plus.classList.add('dataCell')
    currentBufferP2minus.classList.add('dataCell')
    currentBufferP3minus.classList.add('dataCell')
    currentBufferP4minus.classList.add('dataCell')
    deltaP2.classList.add('dataCell')
    deltaP3.classList.add('dataCell')
    deltaP4.classList.add('dataCell')
    binFullnessP2.classList.add('dataCell')
    binFullnessP3.classList.add('dataCell')
    binFullnessP4.classList.add('dataCell')
    prdMixP2noqs.classList.add('dataCell')
    prdMixP3noqs.classList.add('dataCell')
    prdMixP4noqs.classList.add('dataCell')
    prdMixP2qs.classList.add('dataCell')
    prdMixP3qs.classList.add('dataCell')
    prdMixP4qs.classList.add('dataCell')

    const allHeaders = document.getElementsByTagName('h3')
    for (let i = 1; i < allHeaders.length; i++) {
        allHeaders[i].style.textAlign = 'right'
    }
    for (let header of allHeaders) {
        header.style.borderBottom = '1px solid black'
        header.style.padding = '5px'
        header.style.marginBottom = '0px'
    }
    const dataCells = document.getElementsByClassName('dataCell')
    for (let dataCell of dataCells) {
        dataCell.style.borderBottom = '1px solid black'
        dataCell.style.padding = '5px'
        dataCell.style.textAlign = 'right'
    }
    highlightBufferAtRisk({p2buffer: bufferP2[0].data['unit-count'], p3buffer: bufferP3[0].data['unit-count'], p4buffer: bufferP4[0].data['unit-count'], p2bufferPlus: Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferPlus: Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferPlus: Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100), p2bufferMinus: Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferMinus: Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferMinus: Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100)})

    refreshData()
}

//keep refreshing data
function refreshData() {
    setInterval(async function() {
        let stowRatesRaw = await getStowRate()
        let workedHours = await getWorkedHours()
        let currentHeadcount = await getCurrentHeadcount()
        let bufferP2 = await getBufferP2()
        let bufferP3 = await getBufferP3()
        let bufferP4 = await getBufferP4()
        let pprDataETI = await getPPRdataETI()
        let binFullness = await getBinFullness()

        p2headcount = Number(currentHeadcount[7].yValue) + Number(currentHeadcount[58].yValue)
        p3headcount = Number(currentHeadcount[24].yValue) + Number(currentHeadcount[75].yValue)
        p4headcount = Number(currentHeadcount[41].yValue) + Number(currentHeadcount[92].yValue)
        currentHeadcountP2.innerHTML = p2headcount
        currentHeadcountP3.innerHTML = p3headcount
        currentHeadcountP4.innerHTML = p4headcount
        p2rate = Math.round(((Math.round(stowRatesRaw[1].yValue) * Math.round(workedHours[1].yValue)) + (Math.round(stowRatesRaw[7].yValue) * Math.round(workedHours[7].yValue))) / (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)))
        p3rate = Math.round(((Math.round(stowRatesRaw[3].yValue) * Math.round(workedHours[3].yValue)) + (Math.round(stowRatesRaw[9].yValue) * Math.round(workedHours[9].yValue))) / (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)))
        p4rate = Math.round(((Math.round(stowRatesRaw[5].yValue) * Math.round(workedHours[5].yValue)) + (Math.round(stowRatesRaw[11].yValue) * Math.round(workedHours[11].yValue))) / (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))
        currentStowRateP2.innerHTML = p2rate
        currentStowRateP3.innerHTML = p3rate
        currentStowRateP4.innerHTML = p4rate
        currentBufferP2.innerHTML = bufferP2[0].data['unit-count'].toLocaleString()
        currentBufferP3.innerHTML = bufferP3[0].data['unit-count'].toLocaleString()
        currentBufferP4.innerHTML = bufferP4[0].data['unit-count'].toLocaleString()
        currentBufferP2plus.innerHTML = Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
        currentBufferP3plus.innerHTML = Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
        currentBufferP4plus.innerHTML = Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
        currentBufferP2minus.innerHTML = Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
        currentBufferP3minus.innerHTML = Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
        currentBufferP4minus.innerHTML = Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
        deltaP2.innerHTML = Math.floor((bufferP2[0].data['unit-count'] - (p2headcount * p2rate * bufferExpInHours))).toLocaleString()
        deltaP3.innerHTML = Math.floor((bufferP3[0].data['unit-count'] - (p3headcount * p3rate * bufferExpInHours))).toLocaleString()
        deltaP4.innerHTML = Math.floor((bufferP4[0].data['unit-count'] - (p4headcount * p4rate * bufferExpInHours))).toLocaleString()
        binFullnessP2.innerHTML = 'A2:' + Math.round(binFullness[1].yValue) + '% B2:' + Math.round(binFullness[7].yValue) + '%'
        binFullnessP3.innerHTML = 'A3:' + Math.round(binFullness[3].yValue) + '% B3:' + Math.round(binFullness[9].yValue) + '%'
        binFullnessP4.innerHTML = 'A4:' + Math.round(binFullness[5].yValue) + '% B4:' + Math.round(binFullness[11].yValue) + '%'

        const pprETI = document.createElement('html')
        pprETI.innerHTML = pprDataETI
        const etiSmallNike = pprETI.querySelector('#summary').children[2].children[0].children[5].innerHTML
        const etiTotalNike = pprETI.querySelector('#summary').children[2].children[4].children[4].innerHTML
        const etiSmallTotal = (Number(pprETI.querySelector('#summary').children[2].children[5].children[5].innerHTML) + Number(pprETI.querySelector('#summary').children[2].children[0].children[5].innerHTML))
        const etiTotal = pprETI.querySelector('#summary').children[3].children[0].children[4].innerHTML
        prdMixP2noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
        prdMixP3noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
        prdMixP4noqs.innerHTML = Math.round(Number(etiSmallNike) * 100 / Number(etiTotalNike)) + '%'
        prdMixP2qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'
        prdMixP3qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'
        prdMixP4qs.innerHTML = Math.round(etiSmallTotal * 100 / Number(etiTotal)) + '%'

        highlightBufferAtRisk({p2buffer: bufferP2[0].data['unit-count'], p3buffer: bufferP3[0].data['unit-count'], p4buffer: bufferP4[0].data['unit-count'], p2bufferPlus: Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferPlus: Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferPlus: Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100), p2bufferMinus: Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferMinus: Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferMinus: Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100)})
    }, 120000)
}

//add style for metrics at risk
function highlightBufferAtRisk({p2buffer, p3buffer, p4buffer, p2bufferPlus, p3bufferPlus, p4bufferPlus, p2bufferMinus, p3bufferMinus, p4bufferMinus}) {
    if (p2buffer > p2bufferPlus) {
        currentBufferP2.style.backgroundColor = 'yellow'
    } else if (p2buffer < p2bufferMinus) {
        currentBufferP2.style.backgroundColor = 'red'
    } else {
        currentBufferP2.style.backgroundColor = 'green'
    }
    if (p3buffer > p3bufferPlus) {
        currentBufferP3.style.backgroundColor = 'yellow'
    } else if (p3buffer < p3bufferMinus) {
        currentBufferP3.style.backgroundColor = 'red'
    } else {
        currentBufferP3.style.backgroundColor = 'green'
    }
    if (p4buffer > p4bufferPlus) {
        currentBufferP4.style.backgroundColor = 'yellow'
    } else if (p4buffer < p4bufferMinus) {
        currentBufferP4.style.backgroundColor = 'red'
    } else {
        currentBufferP4.style.backgroundColor = 'green'
    }
}
