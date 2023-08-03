// ==UserScript==
// @name         LCY2 Buffer Flow Control
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  LCY2 buffer flow control
// @author       Lukasz Milcz - milcz@amazon.com
// @match        https://inbound-flow-control.amazon.com/buffer
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @grant        GM.xmlHttpRequest
// ==/UserScript==


   document.getElementsByTagName('body')[0].style.fontFamily = 'Verdana, sans-serif'
   document.getElementsByTagName('p')[0].style.display = 'none'

   const title = document.getElementsByTagName('h1')[0]
   title.innerHTML = 'Buffer Flow Control'
   title.style.textAlign = 'center'

    //create container for 3 floors
    const container = document.createElement('div')
    container.style.display = 'flex'
    document.getElementsByTagName('body')[0].appendChild(container)

    //create 3 smaller containers for each floor
    const p2Container = document.createElement('div')
    p2Container.style.flexGrow = '1'
    container.appendChild(p2Container)
    const p2Title = document.createElement('h2')
    p2Title.innerHTML = 'P2'
    p2Title.style.textAlign = 'center'
    p2Container.appendChild(p2Title)

    const p3Container = document.createElement('div')
    p3Container.style.flexGrow = '1'
    container.appendChild(p3Container)
    const p3Title = document.createElement('h2')
    p3Title.innerHTML = 'P3'
    p3Title.style.textAlign = 'center'
    p3Container.appendChild(p3Title)

    const p4Container = document.createElement('div')
    p4Container.style.flexGrow = '1'
    container.appendChild(p4Container)
    const p4Title = document.createElement('h2')
    p4Title.innerHTML = 'P4'
    p4Title.style.textAlign = 'center'
    p4Container.appendChild(p4Title)

    //set shift and current time
    const currentShift = 'DS'
    const time = new Date()
    const hour = time.getHours()
    const minutes = time.getMinutes()
    let day = time.getDate()
    if (day < 10) {
    day = '0' + day
    }
    let month = time.getMonth() + 1
    if (month < 10) {
    month = '0' + month
    }
    const year = time.getFullYear()

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
const stowRatesRaw = await getStowRate()

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
const workedHours = await getWorkedHours()


    //calculate averate rate per floor
const p2rate = Math.round(((Math.round(stowRatesRaw[1].yValue) * Math.round(workedHours[1].yValue)) + (Math.round(stowRatesRaw[7].yValue) * Math.round(workedHours[7].yValue))) / (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)))
const p3rate = Math.round(((Math.round(stowRatesRaw[3].yValue) * Math.round(workedHours[3].yValue)) + (Math.round(stowRatesRaw[9].yValue) * Math.round(workedHours[9].yValue))) / (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)))
const p4rate = Math.round(((Math.round(stowRatesRaw[5].yValue) * Math.round(workedHours[5].yValue)) + (Math.round(stowRatesRaw[11].yValue) * Math.round(workedHours[11].yValue))) / (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))

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
const currentHeadcount = await getCurrentHeadcount()

const p2headcount = Number(currentHeadcount[7].yValue) + Number(currentHeadcount[58].yValue)
const p3headcount = Number(currentHeadcount[24].yValue) + Number(currentHeadcount[75].yValue)
const p4headcount = Number(currentHeadcount[41].yValue) + Number(currentHeadcount[92].yValue)

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
const bufferP2 = await getBufferP2()

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
const bufferP3 = await getBufferP3()

//get P3 buffer count
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
        data: `{\"warehouseId\":{\"id\":\"LCY2\"},\"locationHistoryRequestList\":[{\"locationId\":{\"id\":\"fl-3\",\"type\":\"SCANNABLE_ID\"},\"ifcProcessName\":\"Stow\",\"startTimeMillis\":${startTime},\"endTimeMillis\":${endTime}}]}`,
        onload: (response) => {
          resolve(response);
        },
      });
    });
    return response.response.successLocationHistoryList[0].dataPointSet.sort((a, b) => b.timestamp - a.timestamp)
  }
const bufferP4 = await getBufferP4()

//get PPR data
async function getPPRdata() {
    const startTime = new Date(time - 5400000)
    const endTime = new Date(time - 1800000)
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
    const url = `https://fclm-portal.amazon.com/reports/functionRollup?warehouseId=LCY2&spanType=Intraday&startDate=${year}-${month}-${day}T${startHour}:${startMinute}:00.000&endDate=${year}-${month}-${day}T${endHour}:${endMinute}:00.000&reportFormat=HTML&processId=01003019`
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
const pprData = await getPPRdata()
const ppr = document.createElement('html')
ppr.innerHTML = pprData
const decantRate = ppr.querySelector('#summary').children[2].children[4].childNodes[9].innerText


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
const buffer = await getBuffer()

let p2bufferCount = 0;
let p3bbufferCount = 0;
let p4bufferCount = 0;
let p2bufferTotes = 0;
let p3bufferTotes = 0;
let p4bufferTotes = 0;



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
const historicalHeadcount = await getHistoricalHeadcount()

//display current performance data
const currentStowRateP2 = document.createElement('div')
const currentStowRateP3 = document.createElement('div')
const currentStowRateP4 = document.createElement('div')
p2Container.appendChild(currentStowRateP2)
p3Container.appendChild(currentStowRateP3)
p4Container.appendChild(currentStowRateP4)
currentStowRateP2.innerHTML = 'Rate: ' + p2rate
currentStowRateP3.innerHTML = 'Rate: ' + p3rate
currentStowRateP4.innerHTML = 'Rate: ' + p4rate

const currentHeadcountP2 = document.createElement('div')
const currentHeadcountP3 = document.createElement('div')
const currentHeadcountP4 = document.createElement('div')
p2Container.appendChild(currentHeadcountP2)
p3Container.appendChild(currentHeadcountP3)
p4Container.appendChild(currentHeadcountP4)
currentHeadcountP2.innerHTML = 'Headcount: ' + p2headcount
currentHeadcountP3.innerHTML = 'Headcount: ' + p3headcount
currentHeadcountP4.innerHTML = 'Headcount: ' + p4headcount

const currentBufferP2 = document.createElement('div')
const currentBufferP3 = document.createElement('div')
const currentBufferP4 = document.createElement('div')
p2Container.appendChild(currentBufferP2)
p3Container.appendChild(currentBufferP3)
p4Container.appendChild(currentBufferP4)
currentBufferP2.innerHTML = 'Current Buffer: ' + bufferP2[0].data['unit-count'].toLocaleString()
currentBufferP3.innerHTML = 'Current Buffer: ' + bufferP3[0].data['unit-count'].toLocaleString()
currentBufferP4.innerHTML = 'Current Buffer: ' + bufferP4[0].data['unit-count'].toLocaleString()

const requiredBufferP2 = document.createElement('div')
const requiredBufferP3 = document.createElement('div')
const requiredBufferP4 = document.createElement('div')
p2Container.appendChild(requiredBufferP2)
p3Container.appendChild(requiredBufferP3)
p4Container.appendChild(requiredBufferP4)
requiredBufferP2.innerHTML = 'Required Buffer: ' + Math.floor((p2headcount * p2rate * 2.5)).toLocaleString()
requiredBufferP3.innerHTML = 'Required Buffer: ' + Math.floor((p3headcount * p3rate * 2.5)).toLocaleString()
requiredBufferP4.innerHTML = 'Required Buffer: ' + Math.floor((p4headcount * p4rate * 2.5)).toLocaleString()

const deltaP2 = document.createElement('div')
const deltaP3 = document.createElement('div')
const deltaP4 = document.createElement('div')
p2Container.appendChild(deltaP2)
p3Container.appendChild(deltaP3)
p4Container.appendChild(deltaP4)
deltaP2.innerHTML = 'Delta: ' + Math.floor((bufferP2[0].data['unit-count'] - (p2headcount * p2rate * 2.5))).toLocaleString()
deltaP3.innerHTML = 'Delta: ' + Math.floor((bufferP3[0].data['unit-count'] - (p3headcount * p3rate * 2.5))).toLocaleString()
deltaP4.innerHTML = 'Delta: ' + Math.floor((bufferP4[0].data['unit-count'] - (p4headcount * p4rate * 2.5))).toLocaleString()

const decantRateEl = document.createElement('div')
document.getElementsByTagName('body')[0].appendChild(decantRateEl)
decantRateEl.style.marginTop = '100px'
decantRateEl.innerHTML = 'Hourly decant throughput: ' + Number(decantRate).toLocaleString()

const totalBuffer = document.createElement('div')
document.getElementsByTagName('body')[0].appendChild(totalBuffer)
totalBuffer.innerHTML = 'Total buffer: ' + (bufferP2[0].data['unit-count'] + bufferP3[0].data['unit-count'] + bufferP4[0].data['unit-count']).toLocaleString()

const nextHourCapacity = document.createElement('div')
document.getElementsByTagName('body')[0].appendChild(nextHourCapacity)
nextHourCapacity.innerHTML = 'Next hour capacity: ' + Number((p2headcount * p2rate) + (p3headcount * p3rate) + (p4headcount * p4rate)).toLocaleString()

const nextHourBufferPrediction = document.createElement('div')
document.getElementsByTagName('body')[0].appendChild(nextHourBufferPrediction)
nextHourBufferPrediction.innerHTML = 'Next hour buffer prediction: ' + Number(Number(decantRate) + Number(Number(bufferP2[0].data['unit-count']) + Number(bufferP3[0].data['unit-count']) + Number(bufferP4[0].data['unit-count'])) - Number(Number(p2headcount * p2rate) + Number(p3headcount * p3rate) + Number(p4headcount * p4rate))).toLocaleString()
