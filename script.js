// ==UserScript==
// @name         Buffer Flow Control
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Required for IB buffer calculator
// @author       Lukasz Milcz - milcz@amazon.com
// @match        https://inbound-flow-control.amazon.com/powerup
// @icon         https://m.media-amazon.com/images/I/51iG0M0wqtL._AC_UF894,1000_QL80_.jpg
// @grant        GM.xmlHttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @resource     CHART_JS_CSS https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

///////////GLOBAL SETTINGS
    //set shift and current time
let currentShift = ''
const bufferExpInHours = 2.5
const unitsPerTote = 11
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

//get current bin fullness per bin size
async function getBinFullnessBinSize() {
    const url = 'https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&mom_ids=1924&osm_ids=1595&oxm_ids=2148&ofm_ids=&instance_id=0&object_id=21284&BrowserTZ=Europe%2FLondon&app_name=RoboScout'
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

//get assigned product mix data
async function getAssignedProductMix() {
    const url = 'https://monitorportal.amazon.com/mws/data?Action=GetGraph&Version=2007-07-07&SchemaName1=Search&Pattern1=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&Period1=OneHour&Stat1=sum&SchemaName2=Search&Pattern2=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&SchemaName3=Search&Pattern3=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&SchemaName4=Search&Pattern4=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&SchemaName5=Search&Pattern5=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&SchemaName6=Search&Pattern6=servicename%3D%24KivaStowWorkPlannerService%24+KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+&SchemaName7=Search&Pattern7=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName8=Search&Pattern8=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName9=Search&Pattern9=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName10=Search&Pattern10=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName11=Search&Pattern11=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName12=Search&Pattern12=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaA04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName13=Search&Pattern13=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName14=Search&Pattern14=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB02+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName15=Search&Pattern15=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName16=Search&Pattern16=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB03+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName17=Search&Pattern17=servicename%3D%24KivaStowWorkPlannerService%24+6-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&SchemaName18=Search&Pattern18=servicename%3D%24KivaStowWorkPlannerService%24+9-KIVA-DEEP.qty+station+AMZN%2FLCY2%2FpaKivaB04+marketplace%3D%24prod.EUFulfillment%24+methodname%3D%24CreatePlan%24+schemaname%3DService+&HeightInPixels=773&WidthInPixels=1718&GraphTitle=Product+mix+assigned+per+floor&LegendPlacement=right&DecoratePoints=true&TZ=Europe%2FLondon%40TZ%3A+London&ShowLegendErrors=false&LabelLeft=Quantity&StartTime1=-PT2H&EndTime1=-PT0H&FunctionExpression1=SUM%28S7%2CS8%29%2FSUM%28S1%29&FunctionLabel1=A02+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference1=left&FunctionExpression2=SUM%28S9%2CS10%29%2FSUM%28S2%29&FunctionLabel2=A03+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference2=left&FunctionExpression3=SUM%28S11%2CS12%29%2FSUM%28S3%29&FunctionLabel3=A04+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference3=left&FunctionExpression4=SUM%28S13%2CS14%29%2FSUM%28S4%29&FunctionLabel4=B02+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference4=left&FunctionExpression5=SUM%28S15%2CS16%29%2FSUM%28S5%29&FunctionLabel5=B03+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference5=left&FunctionExpression6=SUM%28S17%2CS18%29%2FSUM%28S6%29&FunctionLabel6=B04+%5Bavg%3A+%7Bavg%7D%5D&FunctionYAxisPreference6=left'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: url,

        onload: (response) => {
          resolve(response.responseText);
        },
      });
    });
    return response
  }

//get injection
async function getInjection() {
    const url = 'https://monitorportal.amazon.com/mws/data?Action=GetGraph&Version=2007-07-07&SchemaName1=Service&DataSet1=Prod&Marketplace1=LCY2-ReceiveRouterController&HostGroup1=ALL&Host1=ALL&ServiceName1=WarehouseControlService&MethodName1=SortationOrchestrator.divert&Client1=ALL&MetricClass1=NONE&Instance1=NONE&Metric1=intermediateRequestedDivertId-RC0101&Period1=FiveMinute&Stat1=sum&Label1=intermediateRequestedDivertId-RC0101&SchemaName2=Service&Metric2=intermediateRequestedDivertId-RC0103&Label2=intermediateRequestedDivertId-RC0103&SchemaName3=Service&Metric3=intermediateRequestedDivertId-RC0102&Label3=intermediateRequestedDivertId-RC0102&HeightInPixels=773&WidthInPixels=1718&GraphTitle=Receive Router Recirc last 12 hours&DecoratePoints=true&TZ=Europe/London@TZ: London&StartTime1=-PT12H&EndTime1=-PT0M'
    const response = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        responseType: "json",
        url: url,

        onload: (response) => {
          resolve(response.responseText);
        },
      });
    });
    return response
  }

//get units stowed
async function getUnitsStowed() {
    const url = 'https://roboscout.amazon.com/view_plot_data/?sites=(LCY2)&current_day=true&startDateTime=today&endDateTime=today&mom_ids=632&osm_ids=30&oxm_ids=1745&ofm_ids=775&viz=nvd3Table&extend_datetime_to_shift_start=true&instance_id=1927&object_id=19851&BrowserTZ=Europe%2FLondon&app_name=RoboScout'
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

/////////////////////
//////////////////// GLOBAL VARIABLES
let p2headcount = ''
let p3headcount = ''
let p4headcount = ''
let p2rate = ''
let p3rate = ''
let p4rate = ''
let p2consumption = ''
let p3consumption = ''
let p4consumption = ''
let p2bufferplus = ''
let p3bufferplus = ''
let p4bufferplus = ''
let p2bufferminus = ''
let p3bufferminus = ''
let p4bufferminus = ''
let p2buffer = ''
let p3buffer = ''
let p4buffer = ''
let p2delta = ''
let p3delta = ''
let p4delta = ''
let p2headcountA = ''
let p2headcountB = ''
let p3headcountA = ''
let p3headcountB = ''
let p4headcountA = ''
let p4headcountB = ''
let p2ratesA = ''
let p2ratesB = ''
let p3ratesA = ''
let p3ratesB = ''
let p4ratesA = ''
let p4ratesB = ''
let p2prodmixA = ''
let p2prodmixB = ''
let p3prodmixA = ''
let p3prodmixB = ''
let p4prodmixA = ''
let p4prodmixB = ''
let p2fullnessA = ''
let p2fullnessB = ''
let p3fullnessA = ''
let p3fullnessB = ''
let p4fullnessA = ''
let p4fullnessB = ''
let totalConsumption = ''
let totalBuffer = ''
let bufferInHours = ''
let totalInjection = ''
let totalDelta = ''
let bufferValues = [];
let labels = []
let bufferValuesPlus = []
let bufferValuesMinus = []
let mainChart = ''
let p2injection = ''
let p3injection = ''
let p4injection = ''
let p2fullness6A = ''
let p2fullness9A = ''
let p2fullness11A = ''
let p2fullness14A = ''
let p2fullness18A = ''
let p2fullness6B = ''
let p2fullness9B = ''
let p2fullness11B = ''
let p2fullness14B = ''
let p2fullness18B = ''
let p3fullness6A = ''
let p3fullness9A = ''
let p3fullness11A = ''
let p3fullness14A = ''
let p3fullness18A = ''
let p3fullness6B = ''
let p3fullness9B = ''
let p3fullness11B = ''
let p3fullness14B = ''
let p3fullness18B = ''
let p4fullness6A = ''
let p4fullness9A = ''
let p4fullness11A = ''
let p4fullness14A = ''
let p4fullness18A = ''
let p4fullness6B = ''
let p4fullness9B = ''
let p4fullness11B = ''
let p4fullness14B = ''
let p4fullness18B = ''
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
document.getElementsByTagName('body')[0].style.position = 'relative'
document.getElementsByTagName('body')[0].style.margin = '0'
document.getElementsByTagName('body')[0].style.padding = '0'
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
    let assignedProductMixRequest = await getAssignedProductMix()
    let binFullness = await getBinFullness()
    let unitsStowed = await getUnitsStowed()
    let injectionData = await getInjection()
    let fullnessPerBinSize = await getBinFullnessBinSize()

    //do calculations
    p2headcount = Number(currentHeadcount[7].yValue) + Number(currentHeadcount[58].yValue)
    p3headcount = Number(currentHeadcount[24].yValue) + Number(currentHeadcount[75].yValue)
    p4headcount = Number(currentHeadcount[41].yValue) + Number(currentHeadcount[92].yValue)
    p2rate = Math.round(((Math.round(stowRatesRaw[1].yValue) * Math.round(workedHours[1].yValue)) + (Math.round(stowRatesRaw[7].yValue) * Math.round(workedHours[7].yValue))) / (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)))
    p3rate = Math.round(((Math.round(stowRatesRaw[3].yValue) * Math.round(workedHours[3].yValue)) + (Math.round(stowRatesRaw[9].yValue) * Math.round(workedHours[9].yValue))) / (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)))
    p4rate = Math.round(((Math.round(stowRatesRaw[5].yValue) * Math.round(workedHours[5].yValue)) + ((Math.round(stowRatesRaw[11].yValue)) * Math.round(workedHours[11].yValue))) / (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))
    p2consumption = p2headcount * p2rate
    p3consumption = p3headcount * p3rate
    p4consumption = p4headcount * p4rate
    p2bufferplus = Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p3bufferplus = Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p4bufferplus = Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2bufferminus = Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p3bufferminus = Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p4bufferminus = Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2buffer = bufferP2[0].data['unit-count'].toLocaleString()
    p3buffer = bufferP3[0].data['unit-count'].toLocaleString()
    p4buffer = bufferP4[0].data['unit-count'].toLocaleString()
    p2delta = Math.floor((bufferP2[0].data['unit-count'] - (p2headcount * p2rate * bufferExpInHours))).toLocaleString()
    p3delta = Math.floor((bufferP3[0].data['unit-count'] - (p3headcount * p3rate * bufferExpInHours))).toLocaleString()
    p4delta = Math.floor((bufferP4[0].data['unit-count'] - (p4headcount * p4rate * bufferExpInHours))).toLocaleString()
    p2headcountA = Number(currentHeadcount[7].yValue)
    p2headcountB = Number(currentHeadcount[58].yValue)
    p3headcountA = Number(currentHeadcount[24].yValue)
    p3headcountB = Number(currentHeadcount[75].yValue)
    p4headcountA = Number(currentHeadcount[41].yValue)
    p4headcountB = Number(currentHeadcount[92].yValue)
    p2ratesA = Math.round(stowRatesRaw[1].yValue)
    p2ratesB = Math.round(stowRatesRaw[7].yValue)
    p3ratesA = Math.round(stowRatesRaw[3].yValue)
    p3ratesB = Math.round(stowRatesRaw[9].yValue)
    p4ratesA = Math.round(stowRatesRaw[5].yValue)
    p4ratesB = Math.round(stowRatesRaw[11].yValue)

    const assignedProductMixData = document.createElement('html')
    assignedProductMixData.innerHTML = assignedProductMixRequest
    p2prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[1].children[2].innerHTML) * 100)
    p2prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[4].children[2].innerHTML) * 100)
    p3prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[2].children[2].innerHTML) * 100)
    p3prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[5].children[2].innerHTML) * 100)
    p4prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[3].children[2].innerHTML) * 100)
    p4prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[6].children[2].innerHTML) * 100)

    p2fullnessA = Math.round(binFullness[1].yValue)
    p2fullnessB = Math.round(binFullness[7].yValue)
    p3fullnessA = Math.round(binFullness[3].yValue)
    p3fullnessB = Math.round(binFullness[9].yValue)
    p4fullnessA = Math.round(binFullness[5].yValue)
    p4fullnessB = Math.round(binFullness[11].yValue)

    p2fullness6A = Math.round(fullnessPerBinSize[7].yValue)
    p2fullness9A = Math.round(fullnessPerBinSize[9].yValue)
    p2fullness11A = Math.round(fullnessPerBinSize[1].yValue)
    p2fullness14A = Math.round(fullnessPerBinSize[3].yValue)
    p2fullness18A = Math.round(fullnessPerBinSize[5].yValue)
    p2fullness6B = Math.round(fullnessPerBinSize[37].yValue)
    p2fullness9B = Math.round(fullnessPerBinSize[39].yValue)
    p2fullness11B = Math.round(fullnessPerBinSize[31].yValue)
    p2fullness14B = Math.round(fullnessPerBinSize[33].yValue)
    p2fullness18B = Math.round(fullnessPerBinSize[35].yValue)
    p3fullness6A = Math.round(fullnessPerBinSize[17].yValue)
    p3fullness9A = Math.round(fullnessPerBinSize[19].yValue)
    p3fullness11A = Math.round(fullnessPerBinSize[11].yValue)
    p3fullness14A = Math.round(fullnessPerBinSize[13].yValue)
    p3fullness18A = Math.round(fullnessPerBinSize[15].yValue)
    p3fullness6B = Math.round(fullnessPerBinSize[47].yValue)
    p3fullness9B = Math.round(fullnessPerBinSize[49].yValue)
    p3fullness11B = Math.round(fullnessPerBinSize[41].yValue)
    p3fullness14B = Math.round(fullnessPerBinSize[43].yValue)
    p3fullness18B = Math.round(fullnessPerBinSize[45].yValue)
    p4fullness6A = Math.round(fullnessPerBinSize[27].yValue)
    p4fullness9A = Math.round(fullnessPerBinSize[29].yValue)
    p4fullness11A = Math.round(fullnessPerBinSize[21].yValue)
    p4fullness14A = Math.round(fullnessPerBinSize[23].yValue)
    p4fullness18A = Math.round(fullnessPerBinSize[25].yValue)
    p4fullness6B = Math.round(fullnessPerBinSize[57].yValue)
    p4fullness9B = Math.round(fullnessPerBinSize[59].yValue)
    p4fullness11B = Math.round(fullnessPerBinSize[51].yValue)
    p4fullness14B = Math.round(fullnessPerBinSize[53].yValue)
    p4fullness18B = Math.round(fullnessPerBinSize[55].yValue)

    const injection = document.createElement('html')
    injection.innerHTML = injectionData
    p2injection = Math.round(injection.querySelectorAll('tr')[3].children[injection.querySelectorAll('tr')[3].children.length - 1].innerHTML) * 12 * unitsPerTote
    p3injection = Math.round(injection.querySelectorAll('tr')[2].children[injection.querySelectorAll('tr')[2].children.length - 1].innerHTML) * 12 * unitsPerTote
    p4injection = Math.round(injection.querySelectorAll('tr')[1].children[injection.querySelectorAll('tr')[1].children.length - 1].innerHTML) * 12 * unitsPerTote
    totalInjection = (p2injection + p3injection + p4injection)

    totalConsumption = p2consumption + p3consumption + p4consumption
    totalBuffer = bufferP2[0].data['unit-count'] + bufferP3[0].data['unit-count'] + bufferP4[0].data['unit-count']
    bufferInHours = Math.round((totalBuffer / totalConsumption) * 10) / 10
    //totalInjection = totalConsumption + (((bufferP2[0].data['unit-count'] - bufferP2[6].data['unit-count']) + (bufferP3[0].data['unit-count'] - bufferP3[6].data['unit-count']) + (bufferP4[0].data['unit-count'] - bufferP4[6].data['unit-count'])) * 2)
    totalDelta = totalInjection - totalConsumption


    //create main container
    loadingElement.style.display = 'none'
    const container = document.createElement('div')
    document.getElementsByTagName('body')[0].appendChild(container)
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
        tableHeaderElement.style.backgroundColor = '#C1C1C1'
        tableHeaderElement.style.color = 'white'

    }

        //create totals table
    const totalsTable = document.createElement('table')
    container.appendChild(totalsTable)
    totalsTable.style.width = '100%'
    totalsTable.style.marginTop = '3em'
    const totalsTableHeaders = ['Consumption', 'Total Buffer', 'Buffer In Hours', 'Hourly Injection', 'Total Delta' ]
    for (let header of totalsTableHeaders) {
        const tableHeaderElement = document.createElement('th')
        totalsTable.appendChild(tableHeaderElement)
        tableHeaderElement.innerHTML = header
        tableHeaderElement.style.border = '1px solid #C1C1C1'
        tableHeaderElement.style.borderCollapse = 'collapse'
        tableHeaderElement.style.width = '20%'
        tableHeaderElement.style.backgroundColor = '#C1C1C1'
        tableHeaderElement.style.color = 'white'
        tableHeaderElement.style.verticalAlign = 'middle'
        tableHeaderElement.style.padding = '2px'
    }
    const totalsTableRow = document.createElement('tr')
    totalsTable.appendChild(totalsTableRow)
    totalsTableRow.innerHTML = `<td id="total-consumption" class="table-data">${totalConsumption.toLocaleString()}</td><td id="total-buffer" class="table-data">${totalBuffer.toLocaleString()}</td><td id="buffer-in-hours" class="table-data">${bufferInHours}</td><td id="total-injection" class="table-data">${totalInjection.toLocaleString()}</td><td id="total-delta" class="table-data">${totalDelta.toLocaleString()}</td>`

    //container for grafs
    const grafsContainer = document.createElement('div')
    container.appendChild(grafsContainer)
    grafsContainer.style.marginTop = '3em'
    const mainGraf = document.createElement('canvas')
    container.appendChild(mainGraf)
    mainGraf.setAttribute('id', 'main-graf')


    const metricsGeneral = [{metric: 'Headcount', id: 'headcount', p2: p2headcount, p3: p3headcount, p4: p4headcount}, {metric: 'Rates', id: 'rates', p2: p2rate, p3: p3rate, p4: p4rate}, {metric: 'Hourly Consumption', id: 'consumption', p2: p2consumption.toLocaleString(), p3: p3consumption.toLocaleString(), p4: p4consumption.toLocaleString()}, {metric: 'Injection', id: 'injection', p2: p2injection.toLocaleString(), p3: p3injection.toLocaleString(), p4: p4injection.toLocaleString()}]
    for (let metric of metricsGeneral) {
        const metricRow = document.createElement('tr')
        capacityTable.appendChild(metricRow)
        metricRow.innerHTML = `<td class="metric">${metric.metric}</td><td id="p2${metric.id}" class="table-data">${metric.p2}</td><td id="p3${metric.id}" class="table-data">${metric.p3}</td><td id="p4${metric.id}" class="table-data">${metric.p4}</td>`
    }

    //create buffer table
    const bufferTable = document.createElement('table')
    container.appendChild(bufferTable)
    bufferTable.style.width = '100%'
    bufferTable.style.marginTop = '3em'
    for (let header of tableHeaders) {
        const tableHeaderElement = document.createElement('th')
        bufferTable.appendChild(tableHeaderElement)
        tableHeaderElement.innerHTML = header
        tableHeaderElement.style.border = '1px solid #C1C1C1'
        tableHeaderElement.style.borderCollapse = 'collapse'
        tableHeaderElement.style.width = '25%'
        tableHeaderElement.style.backgroundColor = '#C1C1C1'
        tableHeaderElement.style.color = 'white'
    }
    const metricsBuffer = [{metric: '2,5 Hours Buffer +20%', id: 'bufferplus', p2: p2bufferplus, p3: p3bufferplus, p4: p4bufferplus}, {metric: '2,5 Hours Buffer -20%', id: 'bufferminus', p2: p2bufferminus, p3: p3bufferminus, p4: p4bufferminus}, {metric: 'Current Buffer', id: 'buffer', p2: p2buffer, p3: p3buffer, p4: p4buffer}, {metric: 'Delta', id: 'delta', p2: p2delta, p3: p3delta, p4: p4delta}]
    for (let metric of metricsBuffer) {
        const metricRow = document.createElement('tr')
        bufferTable.appendChild(metricRow)
        metricRow.innerHTML = `<td class="metric">${metric.metric}</td><td id="p2${metric.id}" class="table-data">${metric.p2}</td><td id="p3${metric.id}" class="table-data">${metric.p3}</td><td id="p4${metric.id}" class="table-data">${metric.p4}</td>`
    }

    //create other metrics table
    const otherMetricsTable = document.createElement('table')
    container.appendChild(otherMetricsTable)
    otherMetricsTable.style.width = '100%'
    otherMetricsTable.style.marginTop = '3em'
    const othersTableHeaders = ['', 'P2A', 'P2B', 'P3A', 'P3B', 'P4A', 'P4B']
    for (let header of othersTableHeaders) {
        const tableHeaderElement = document.createElement('th')
        otherMetricsTable.appendChild(tableHeaderElement)
        tableHeaderElement.innerHTML = header
        tableHeaderElement.style.border = '1px solid #C1C1C1'
        tableHeaderElement.style.borderCollapse = 'collapse'
        tableHeaderElement.style.backgroundColor = '#C1C1C1'
        tableHeaderElement.style.color = 'white'
        if (header == othersTableHeaders[0]) {
            tableHeaderElement.colSpan = 2
            tableHeaderElement.style.width = '25%'
        }
    }
    const otherMetrics = [{metric: 'Headcount', id: 'headcount', p2A: p2headcountA, p2B: p2headcountB, p3A: p3headcountA, p3B: p3headcountB, p4A: p4headcountA, p4B: p4headcountB},
                         {metric: 'Rates', id: 'rates', p2A: p2ratesA, p2B: p2ratesB, p3A: p3ratesA, p3B: p3ratesB, p4A: p4ratesA, p4B: p4ratesB},
                         {metric: 'Product Mix - Smalls', id: 'productmix', p2A:`${p2prodmixA}%`, p2B:`${p2prodmixB}%`, p3A: `${p3prodmixA}%`, p3B:`${p3prodmixB}%`, p4A:`${p4prodmixA}%`, p4B:`${p4prodmixB}%`},
                         {metric: 'Bin Fullness', id: 'binfullness', p2A:`${p2fullnessA}%`, p2B:`${p2fullnessB}%`, p3A: `${p3fullnessA}%`, p3B:`${p3fullnessB}%`, p4A:`${p4fullnessA}%`, p4B:`${p4fullnessB}%`},
                         {metric: 'Fullness 6"', id: 'fullness6', p2A:`${p2fullness6A}%`, p2B:`${p2fullness6B}%`, p3A: `${p3fullness6A}%`, p3B:`${p3fullness6B}%`, p4A:`${p4fullness6A}%`, p4B:`${p4fullness6B}%`},
                         {metric: 'Fullness 9"', id: 'fullness9', p2A:`${p2fullness9A}%`, p2B:`${p2fullness9B}%`, p3A: `${p3fullness9A}%`, p3B:`${p3fullness9B}%`, p4A:`${p4fullness9A}%`, p4B:`${p4fullness9B}%`},
                         {metric: 'Fullness 11"', id: 'fullness11', p2A:`${p2fullness11A}%`, p2B:`${p2fullness11B}%`, p3A: `${p3fullness11A}%`, p3B:`${p3fullness11B}%`, p4A:`${p4fullness11A}%`, p4B:`${p4fullness11B}%`},
                         {metric: 'Fullness 14"', id: 'fullness14', p2A:`${p2fullness14A}%`, p2B:`${p2fullness14B}%`, p3A: `${p3fullness14A}%`, p3B:`${p3fullness14B}%`, p4A:`${p4fullness14A}%`, p4B:`${p4fullness14B}%`},
                         {metric: 'Fullness 18.5"', id: 'fullness18', p2A:`${p2fullness18A}%`, p2B:`${p2fullness18B}%`, p3A: `${p3fullness18A}%`, p3B:`${p3fullness18B}%`, p4A:`${p4fullness18A}%`, p4B:`${p4fullness18B}%`}]
    for (let metric of otherMetrics) {
        const metricRow = document.createElement('tr')
        metricRow.setAttribute('id', metric.id)
        otherMetricsTable.appendChild(metricRow)
        metricRow.innerHTML = `<td colspan='2' class="metric">${metric.metric}</td><td id="p2A${metric.id}" class="table-data">${metric.p2A}</td><td id="p2B${metric.id}" class="table-data">${metric.p2B}</td><td id="p3A${metric.id}" class="table-data">${metric.p3A}</td><td id="p3B${metric.id}" class="table-data">${metric.p3B}</td><td id="p4A${metric.id}" class="table-data">${metric.p4A}</td><td id="p4B${metric.id}" class="table-data">${metric.p4B}</td>`
    }

    const metricsClass = document.getElementsByClassName('metric')
    for (let metric of metricsClass) {
        metric.style.border = '1px solid #C1C1C1'
        metric.style.borderCollapse = 'collapse'
        metric.style.color = '#1a1a1a'
        metric.style.fontWeight = '500'
    }
    const dataCells = document.getElementsByClassName('table-data')
    for (let dataCell of dataCells) {
        dataCell.style.border = '1px solid #C1C1C1'
        dataCell.style.borderCollapse = 'collapse'
        dataCell.style.textAlign = 'right'
        dataCell.style.color = '#404040'
    }
    document.getElementById('binfullness').style.backgroundColor = 'rgb(210, 210, 210)'
    document.getElementById('fullness6').style.backgroundColor = 'rgb(210, 210, 210)'
    document.getElementById('fullness9').style.backgroundColor = 'rgb(210, 210, 210)'
    document.getElementById('fullness11').style.backgroundColor = 'rgb(210, 210, 210)'
    document.getElementById('fullness14').style.backgroundColor = 'rgb(210, 210, 210)'
    document.getElementById('fullness18').style.backgroundColor = 'rgb(210, 210, 210)'

    

    //main graf
    for (let i = 0; i <= 100; i++) {
        let unitCount = bufferP2[i].data['unit-count'] + bufferP3[i].data['unit-count'] + bufferP4[i].data['unit-count']
        let date = new Date(bufferP2[i].timestamp).toLocaleTimeString()
        let bufferValuesPlusData = Math.round(((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) + (((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) * 20 / 100))
        let bufferValuesMinusData = Math.round(((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) - (((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) * 20 / 100))
        labels.unshift(date)
        bufferValues.unshift(unitCount)
        bufferValuesPlus.unshift(bufferValuesPlusData)
        bufferValuesMinus.unshift(bufferValuesMinusData)
    }

    //create a footer
    const footer = document.createElement('footer')
    document.getElementsByTagName('body')[0].appendChild(footer)
    footer.style.width = '100%'
    footer.style.backgroundColor = 'rgb(193, 193, 193)'
    footer.style.position = 'absolute'
    footer.style.textAlign = 'center'
    footer.style.fontStyle = 'italic'
    footer.style.fontSize = '0.8em'
    footer.style.padding = '5px 0px'
    footer.innerHTML = 'Created by Lukasz Milcz - milcz@amazon.com'


mainChart = new Chart("main-graf", {
  type: 'line',
  data: {
   labels: labels,
    datasets: [{
      pointRadius: 3,
      label: "Actual Buffer",
      pointBackgroundColor: "rgb(0,0,255)",
      borderColor: "rgb(0,0,255)",
      backgroundColor:"rgba(0,0,255, 0)",
      data: bufferValues
    }, {
      pointRadius: 3,
      label: "Buffer Maximum",
      pointBackgroundColor: "rgb(255,170,0)",
      borderColor: "rgb(255,170,0)",
      backgroundColor:"rgba(0,255,0, 0)",
      data: bufferValuesPlus
    }, {
      pointRadius: 3,
      label: "Buffer Minimum",
      pointBackgroundColor: "rgb(255,0,0)",
      borderColor: "rgb(255,0,0)",
      backgroundColor:"rgba(255,0,0, 0)",
      data: bufferValuesMinus
    }]
  },
  options: {
    legend: {display: true},
    title: {display: true, text: 'Stow Buffer', position: 'top', fontSize: 25},
    scales: {
      yAxes: [{ticks: {min: 0, max: 160000}}],
    },
    animations: {
        tension: {duration: 2000}
      }
  }
});

    highlightBufferAtRisk({p2buffer: bufferP2[0].data['unit-count'], p3buffer: bufferP3[0].data['unit-count'], p4buffer: bufferP4[0].data['unit-count'], p2bufferPlus: Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferPlus: Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferPlus: Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100), p2bufferMinus: Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferMinus: Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferMinus: Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100)})

    refreshData()
}

//keep refreshing data
function refreshData() {
    setInterval(async function() {
        setTimeAndShift()

        let stowRatesRaw = await getStowRate()
        let workedHours = await getWorkedHours()
        let currentHeadcount = await getCurrentHeadcount()
        let bufferP2 = await getBufferP2()
        let bufferP3 = await getBufferP3()
        let bufferP4 = await getBufferP4()
        let assignedProductMixRequest = await getAssignedProductMix()
        let binFullness = await getBinFullness()
        let unitsStowed = await getUnitsStowed()
        let injectionData = await getInjection()
        let fullnessPerBinSize = await getBinFullnessBinSize()

        p2headcount = Number(currentHeadcount[7].yValue) + Number(currentHeadcount[58].yValue)
    p3headcount = Number(currentHeadcount[24].yValue) + Number(currentHeadcount[75].yValue)
    p4headcount = Number(currentHeadcount[41].yValue) + Number(currentHeadcount[92].yValue)
    p2rate = Math.round(((Math.round(stowRatesRaw[1].yValue) * Math.round(workedHours[1].yValue)) + (Math.round(stowRatesRaw[7].yValue) * Math.round(workedHours[7].yValue))) / (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)))
    p3rate = Math.round(((Math.round(stowRatesRaw[3].yValue) * Math.round(workedHours[3].yValue)) + (Math.round(stowRatesRaw[9].yValue) * Math.round(workedHours[9].yValue))) / (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)))
    p4rate = Math.round(((Math.round(stowRatesRaw[5].yValue) * Math.round(workedHours[5].yValue)) + (Math.round(stowRatesRaw[11].yValue) * Math.round(workedHours[11].yValue))) / (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))
    p2consumption = p2headcount * p2rate
    p3consumption = p3headcount * p3rate
    p4consumption = p4headcount * p4rate
    p2bufferplus = Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p3bufferplus = Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p4bufferplus = Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2bufferminus = Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p3bufferminus = Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p4bufferminus = Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100).toLocaleString()
    p2buffer = bufferP2[0].data['unit-count'].toLocaleString()
    p3buffer = bufferP3[0].data['unit-count'].toLocaleString()
    p4buffer = bufferP4[0].data['unit-count'].toLocaleString()
    p2delta = Math.floor((bufferP2[0].data['unit-count'] - (p2headcount * p2rate * bufferExpInHours))).toLocaleString()
    p3delta = Math.floor((bufferP3[0].data['unit-count'] - (p3headcount * p3rate * bufferExpInHours))).toLocaleString()
    p4delta = Math.floor((bufferP4[0].data['unit-count'] - (p4headcount * p4rate * bufferExpInHours))).toLocaleString()
    p2headcountA = Number(currentHeadcount[7].yValue)
    p2headcountB = Number(currentHeadcount[58].yValue)
    p3headcountA = Number(currentHeadcount[24].yValue)
    p3headcountB = Number(currentHeadcount[75].yValue)
    p4headcountA = Number(currentHeadcount[41].yValue)
    p4headcountB = Number(currentHeadcount[92].yValue)
    p2ratesA = Math.round(stowRatesRaw[1].yValue)
    p2ratesB = Math.round(stowRatesRaw[7].yValue)
    p3ratesA = Math.round(stowRatesRaw[3].yValue)
    p3ratesB = Math.round(stowRatesRaw[9].yValue)
    p4ratesA = Math.round(stowRatesRaw[5].yValue)
    p4ratesB = Math.round(stowRatesRaw[11].yValue)

    const assignedProductMixData = document.createElement('html')
    assignedProductMixData.innerHTML = assignedProductMixRequest
    p2prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[1].children[2].innerHTML) * 100)
    p2prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[4].children[2].innerHTML) * 100)
    p3prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[2].children[2].innerHTML) * 100)
    p3prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[5].children[2].innerHTML) * 100)
    p4prodmixA = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[3].children[2].innerHTML) * 100)
    p4prodmixB = Math.round(Number(assignedProductMixData.querySelectorAll('tr')[6].children[2].innerHTML) * 100)

    p2fullnessA = Math.round(binFullness[1].yValue)
    p2fullnessB = Math.round(binFullness[7].yValue)
    p3fullnessA = Math.round(binFullness[3].yValue)
    p3fullnessB = Math.round(binFullness[9].yValue)
    p4fullnessA = Math.round(binFullness[5].yValue)
    p4fullnessB = Math.round(binFullness[11].yValue)

    p2fullness6A = Math.round(fullnessPerBinSize[7].yValue)
    p2fullness9A = Math.round(fullnessPerBinSize[9].yValue)
    p2fullness11A = Math.round(fullnessPerBinSize[1].yValue)
    p2fullness14A = Math.round(fullnessPerBinSize[3].yValue)
    p2fullness18A = Math.round(fullnessPerBinSize[5].yValue)
    p2fullness6B = Math.round(fullnessPerBinSize[37].yValue)
    p2fullness9B = Math.round(fullnessPerBinSize[39].yValue)
    p2fullness11B = Math.round(fullnessPerBinSize[31].yValue)
    p2fullness14B = Math.round(fullnessPerBinSize[33].yValue)
    p2fullness18B = Math.round(fullnessPerBinSize[35].yValue)
    p3fullness6A = Math.round(fullnessPerBinSize[17].yValue)
    p3fullness9A = Math.round(fullnessPerBinSize[19].yValue)
    p3fullness11A = Math.round(fullnessPerBinSize[11].yValue)
    p3fullness14A = Math.round(fullnessPerBinSize[13].yValue)
    p3fullness18A = Math.round(fullnessPerBinSize[15].yValue)
    p3fullness6B = Math.round(fullnessPerBinSize[47].yValue)
    p3fullness9B = Math.round(fullnessPerBinSize[49].yValue)
    p3fullness11B = Math.round(fullnessPerBinSize[41].yValue)
    p3fullness14B = Math.round(fullnessPerBinSize[43].yValue)
    p3fullness18B = Math.round(fullnessPerBinSize[45].yValue)
    p4fullness6A = Math.round(fullnessPerBinSize[27].yValue)
    p4fullness9A = Math.round(fullnessPerBinSize[29].yValue)
    p4fullness11A = Math.round(fullnessPerBinSize[21].yValue)
    p4fullness14A = Math.round(fullnessPerBinSize[23].yValue)
    p4fullness18A = Math.round(fullnessPerBinSize[25].yValue)
    p4fullness6B = Math.round(fullnessPerBinSize[57].yValue)
    p4fullness9B = Math.round(fullnessPerBinSize[59].yValue)
    p4fullness11B = Math.round(fullnessPerBinSize[51].yValue)
    p4fullness14B = Math.round(fullnessPerBinSize[53].yValue)
    p4fullness18B = Math.round(fullnessPerBinSize[55].yValue)

    const injection = document.createElement('html')
    injection.innerHTML = injectionData
    p2injection = Math.round(injection.querySelectorAll('tr')[3].children[injection.querySelectorAll('tr')[3].children.length - 1].innerHTML) * 12 * unitsPerTote
    p3injection = Math.round(injection.querySelectorAll('tr')[2].children[injection.querySelectorAll('tr')[2].children.length - 1].innerHTML) * 12 * unitsPerTote
    p4injection = Math.round(injection.querySelectorAll('tr')[1].children[injection.querySelectorAll('tr')[1].children.length - 1].innerHTML) * 12 * unitsPerTote
    totalInjection = (p2injection + p3injection + p4injection)

    totalConsumption = p2consumption + p3consumption + p4consumption
    totalBuffer = bufferP2[0].data['unit-count'] + bufferP3[0].data['unit-count'] + bufferP4[0].data['unit-count']
    bufferInHours = Math.round((totalBuffer / totalConsumption) * 10) / 10
    //totalInjection = totalConsumption + (((bufferP2[0].data['unit-count'] - bufferP2[6].data['unit-count']) + (bufferP3[0].data['unit-count'] - bufferP3[6].data['unit-count']) + (bufferP4[0].data['unit-count'] - bufferP4[6].data['unit-count'])) * 2)
    totalDelta = totalInjection - totalConsumption

    document.getElementById('p2headcount').innerHTML = p2headcount
    document.getElementById('p3headcount').innerHTML = p3headcount
    document.getElementById('p4headcount').innerHTML = p4headcount
    document.getElementById('p2rates').innerHTML = p2rate
    document.getElementById('p3rates').innerHTML = p3rate
    document.getElementById('p4rates').innerHTML = p4rate
    document.getElementById('p2consumption').innerHTML = p2consumption.toLocaleString()
    document.getElementById('p3consumption').innerHTML = p3consumption.toLocaleString()
    document.getElementById('p4consumption').innerHTML = p4consumption.toLocaleString()
    document.getElementById('p2bufferplus').innerHTML = p2bufferplus
    document.getElementById('p3bufferplus').innerHTML = p3bufferplus
    document.getElementById('p4bufferplus').innerHTML = p4bufferplus
    document.getElementById('p2bufferminus').innerHTML = p2bufferminus
    document.getElementById('p3bufferminus').innerHTML = p3bufferminus
    document.getElementById('p4bufferminus').innerHTML = p4bufferminus
    document.getElementById('p2buffer').innerHTML = p2buffer
    document.getElementById('p3buffer').innerHTML = p3buffer
    document.getElementById('p4buffer').innerHTML = p4buffer
    document.getElementById('p2delta').innerHTML = p2delta
    document.getElementById('p3delta').innerHTML = p3delta
    document.getElementById('p4delta').innerHTML = p4delta
    document.getElementById('p2Aheadcount').innerHTML = p2headcountA
    document.getElementById('p2Bheadcount').innerHTML = p2headcountB
    document.getElementById('p3Aheadcount').innerHTML = p3headcountA
    document.getElementById('p3Bheadcount').innerHTML = p3headcountB
    document.getElementById('p4Aheadcount').innerHTML = p4headcountA
    document.getElementById('p4Bheadcount').innerHTML = p4headcountB
    document.getElementById('p2Arates').innerHTML = p2ratesA
    document.getElementById('p2Brates').innerHTML = p2ratesB
    document.getElementById('p3Arates').innerHTML = p3ratesA
    document.getElementById('p3Brates').innerHTML = p3ratesB
    document.getElementById('p4Arates').innerHTML = p4ratesA
    document.getElementById('p4Brates').innerHTML = p4ratesB
    document.getElementById('p2Aproductmix').innerHTML = p2prodmixA + "%"
    document.getElementById('p2Bproductmix').innerHTML = p2prodmixB + "%"
    document.getElementById('p3Aproductmix').innerHTML = p3prodmixA + "%"
    document.getElementById('p3Bproductmix').innerHTML = p3prodmixB + "%"
    document.getElementById('p4Aproductmix').innerHTML = p4prodmixA + "%"
    document.getElementById('p4Bproductmix').innerHTML = p4prodmixB + "%"
    document.getElementById('p2Abinfullness').innerHTML = p2fullnessA + "%"
    document.getElementById('p2Bbinfullness').innerHTML = p2fullnessB + "%"
    document.getElementById('p3Abinfullness').innerHTML = p3fullnessA + "%"
    document.getElementById('p3Bbinfullness').innerHTML = p3fullnessB + "%"
    document.getElementById('p4Abinfullness').innerHTML = p4fullnessA + "%"
    document.getElementById('p4Bbinfullness').innerHTML = p4fullnessB + "%"
    document.getElementById('p2Afullness6').innerHTML = p2fullness6A + "%"
    document.getElementById('p2Afullness9').innerHTML = p2fullness9A + "%"
    document.getElementById('p2Afullness11').innerHTML = p2fullness11A + "%"
    document.getElementById('p2Afullness14').innerHTML = p2fullness14A + "%"
    document.getElementById('p2Afullness18').innerHTML = p2fullness18A + "%"
    document.getElementById('p2Bfullness6').innerHTML = p2fullness6B + "%"
    document.getElementById('p2Bfullness9').innerHTML = p2fullness9B + "%"
    document.getElementById('p2Bfullness11').innerHTML = p2fullness11B + "%"
    document.getElementById('p2Bfullness14').innerHTML = p2fullness14B + "%"
    document.getElementById('p2Bfullness18').innerHTML = p2fullness18B + "%"
    document.getElementById('p3Afullness6').innerHTML = p3fullness6A + "%"
    document.getElementById('p3Afullness9').innerHTML = p3fullness9A + "%"
    document.getElementById('p3Afullness11').innerHTML = p3fullness11A + "%"
    document.getElementById('p3Afullness14').innerHTML = p3fullness14A + "%"
    document.getElementById('p3Afullness18').innerHTML = p3fullness18A + "%"
    document.getElementById('p3Bfullness6').innerHTML = p3fullness6B + "%"
    document.getElementById('p3Bfullness9').innerHTML = p3fullness9B + "%"
    document.getElementById('p3Bfullness11').innerHTML = p3fullness11B + "%"
    document.getElementById('p3Bfullness14').innerHTML = p3fullness14B + "%"
    document.getElementById('p3Bfullness18').innerHTML = p3fullness18B + "%"
    document.getElementById('p4Afullness6').innerHTML = p4fullness6A + "%"
    document.getElementById('p4Afullness9').innerHTML = p4fullness9A + "%"
    document.getElementById('p4Afullness11').innerHTML = p4fullness11A + "%"
    document.getElementById('p4Afullness14').innerHTML = p4fullness14A + "%"
    document.getElementById('p4Afullness18').innerHTML = p4fullness18A + "%"
    document.getElementById('p4Bfullness6').innerHTML = p4fullness6B + "%"
    document.getElementById('p4Bfullness9').innerHTML = p4fullness9B + "%"
    document.getElementById('p4Bfullness11').innerHTML = p4fullness11B + "%"
    document.getElementById('p4Bfullness14').innerHTML = p2fullness14B + "%"
    document.getElementById('p4Bfullness18').innerHTML = p2fullness18B + "%"
    document.getElementById('p2injection').innerHTML = p2injection.toLocaleString()
    document.getElementById('p3injection').innerHTML = p3injection.toLocaleString()
    document.getElementById('p4injection').innerHTML = p4injection.toLocaleString()
    document.getElementById('total-consumption').innerHTML = totalConsumption.toLocaleString()
    document.getElementById('total-buffer').innerHTML = totalBuffer.toLocaleString()
    document.getElementById('buffer-in-hours').innerHTML = bufferInHours
    document.getElementById('total-injection').innerHTML = totalInjection.toLocaleString()
    document.getElementById('total-delta').innerHTML = totalDelta.toLocaleString()

        //main graf
    bufferValues = [];
    labels = []
    bufferValuesPlus = []
    bufferValuesMinus = []
    for (let i = 0; i <= 100; i++) {
        let unitCount = bufferP2[i].data['unit-count'] + bufferP3[i].data['unit-count'] + bufferP4[i].data['unit-count']
        let date = new Date(bufferP2[i].timestamp).toLocaleTimeString()
        let bufferValuesPlusData = Math.round(((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) + (((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) * 20 / 100))
        let bufferValuesMinusData = Math.round(((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) - (((bufferP2[i].data['employee-count'] + bufferP3[i].data['employee-count'] + bufferP4[i].data['employee-count']) * (((p2rate * (Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue))) + (p3rate * (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue))) + (p4rate * (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) / ((Math.round(workedHours[1].yValue) + Math.round(workedHours[7].yValue)) + (Math.round(workedHours[3].yValue) + Math.round(workedHours[9].yValue)) + (Math.round(workedHours[5].yValue) + Math.round(workedHours[11].yValue)))) * bufferExpInHours) * 20 / 100))
        labels.unshift(date)
        bufferValues.unshift(unitCount)
        bufferValuesPlus.unshift(bufferValuesPlusData)
        bufferValuesMinus.unshift(bufferValuesMinusData)
    }
        mainChart.data.labels = labels
        mainChart.data.datasets[0].data = bufferValues
        mainChart.data.datasets[1].data = bufferValuesPlus
        mainChart.data.datasets[2].data = bufferValuesMinus
        mainChart.update()

        highlightBufferAtRisk({p2buffer: bufferP2[0].data['unit-count'], p3buffer: bufferP3[0].data['unit-count'], p4buffer: bufferP4[0].data['unit-count'], p2bufferPlus: Math.round((p2headcount * p2rate * bufferExpInHours) + (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferPlus: Math.round((p3headcount * p3rate * bufferExpInHours) + (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferPlus: Math.round((p4headcount * p4rate * bufferExpInHours) + (p4headcount * p4rate * bufferExpInHours) * 20 / 100), p2bufferMinus: Math.round((p2headcount * p2rate * bufferExpInHours) - (p2headcount * p2rate * bufferExpInHours) * 20 / 100), p3bufferMinus: Math.round((p3headcount * p3rate * bufferExpInHours) - (p3headcount * p3rate * bufferExpInHours) * 20 / 100), p4bufferMinus: Math.round((p4headcount * p4rate * bufferExpInHours) - (p4headcount * p4rate * bufferExpInHours) * 20 / 100)})
    }, 120000)
}

//add style for metrics at risk
function highlightBufferAtRisk({p2buffer, p3buffer, p4buffer, p2bufferPlus, p3bufferPlus, p4bufferPlus, p2bufferMinus, p3bufferMinus, p4bufferMinus}) {
    if (p2buffer > p2bufferPlus) {
        document.getElementById('p2buffer').style.backgroundColor = '#ffff99'
        document.getElementById('p2delta').style.backgroundColor = '#ffff99'
    } else if (p2buffer < p2bufferMinus) {
        document.getElementById('p2buffer').style.backgroundColor = '#ff8566'
        document.getElementById('p2delta').style.backgroundColor = '#ff8566'
    } else {
        document.getElementById('p2buffer').style.backgroundColor = '#b3ffb3'
        document.getElementById('p2delta').style.backgroundColor = '#b3ffb3'
    }
    if (p3buffer > p3bufferPlus) {
        document.getElementById('p3buffer').style.backgroundColor = '#ffff99'
        document.getElementById('p3delta').style.backgroundColor = '#ffff99'
    } else if (p3buffer < p3bufferMinus) {
        document.getElementById('p3buffer').style.backgroundColor = '#ff8566'
        document.getElementById('p3delta').style.backgroundColor = '#ff8566'
    } else {
        document.getElementById('p3buffer').style.backgroundColor = '#b3ffb3'
        document.getElementById('p3delta').style.backgroundColor = '#b3ffb3'
    }
    if (p4buffer > p4bufferPlus) {
        document.getElementById('p4buffer').style.backgroundColor = '#ffff99'
        document.getElementById('p4delta').style.backgroundColor = '#ffff99'
    } else if (p4buffer < p4bufferMinus) {
        document.getElementById('p4buffer').style.backgroundColor = '#ff8566'
        document.getElementById('p4delta').style.backgroundColor = '#ff8566'
    } else {
        document.getElementById('p4buffer').style.backgroundColor = '#b3ffb3'
        document.getElementById('p4delta').style.backgroundColor = '#b3ffb3'
    }
}
