export const analyticsData = {
  meta: { 
    property: "Evolve Back Coorg", 
    rooms: 200, 
    timezone: "Asia/Kolkata" 
  },
  
  kpis: {
    checkinCompletionTminus1Pct: 63,
    appUsageRatePct: 58,
    fnbOrders: 126,
    fnbAovINR: 1288,
    activitiesGmvINR: 58200,
    activitiesConversionPct: 9.8,
    frtMedianMin: 8.5,
    ttrMedianMin: 42,
    slaCompliancePct: 90,
    paymentSuccessPct: 96.2,
    avgRating: 4.5,
    reviewResponseRatePct: 94
  },
  
  series: {
    days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    dailyActiveInhouse: [168,172,181,190,205,198,210],
    fnbOrders: [18,22,19,24,26,17,28],
    fnbAovINR: [1240,1320,1180,1400,1290,1210,1350],
    activitiesGmvINR: [4200,5200,4600,6100,6800,5400,7200],
    revporIncrementalINR: [420,455,438,510,498,472,525],
    frtMedianMin: [9.2,8.4,10.1,11.8,9.5,7.9,8.1],
    ttrMedianMin: [44,46,41,39,42,40,38],
    slaCompliancePct: [91,93,88,84,89,92,94],
    paymentSuccessPct: [96.8,96.1,95.4,93.2,94.8,96.0,96.5],
    avgRating: [4.4,4.5,4.3,4.6,4.5,4.7,4.6],
    responseRatePct: [88,86,90,92,91,95,94]
  },
  
  funnels: {
    checkin: [
      {"step":"Invite Sent","count":240},
      {"step":"Opened","count":210},
      {"step":"Started","count":180},
      {"step":"ID Uploaded","count":165},
      {"step":"Visa Uploaded","count":40},
      {"step":"Submitted","count":160},
      {"step":"Approved","count":151}
    ],
    fnb: [
      {"step":"Menu Viewed","count":620},
      {"step":"Item Viewed","count":480},
      {"step":"Add to Cart","count":220},
      {"step":"Checkout Started","count":170},
      {"step":"Payment Success","count":126}
    ],
    activities: [
      {"step":"List Viewed","count":410},
      {"step":"Detail Viewed","count":260},
      {"step":"Book CTA","count":150},
      {"step":"Checkout","count":110},
      {"step":"Payment Success","count":78}
    ],
    dropoffReasons: {
      checkin: [{"reason":"ID blur","sharePct":38},{"reason":"Poor network","sharePct":22},{"reason":"Long form","sharePct":18}],
      fnb: [{"reason":"Price shock","sharePct":29},{"reason":"Payment fail","sharePct":26},{"reason":"Out of stock","sharePct":15}],
      activities: [{"reason":"Timing clash","sharePct":34},{"reason":"Capacity full","sharePct":20}]
    }
  },
  
  engagement: {
    actionsPerUserByGuestType: [
      {"guestType":"Family","actions":3.6},
      {"guestType":"Couple","actions":4.1},
      {"guestType":"Solo","actions":2.8},
      {"guestType":"Business","actions":3.2}
    ],
    sectionAdoptionShare: [
      {"section":"Requests","sharePct":62},
      {"section":"F&B","sharePct":54},
      {"section":"Activities","sharePct":31},
      {"section":"Comms","sharePct":22}
    ]
  },
  
  commerce: {
    gmvByDay: [
      {"day":"Mon","fnb":14200,"activities":4200,"addons":600},
      {"day":"Tue","fnb":17800,"activities":5200,"addons":500},
      {"day":"Wed","fnb":15400,"activities":4600,"addons":450},
      {"day":"Thu","fnb":20100,"activities":6100,"addons":700},
      {"day":"Fri","fnb":22400,"activities":6800,"addons":900},
      {"day":"Sat","fnb":13900,"activities":5400,"addons":500},
      {"day":"Sun","fnb":24800,"activities":7200,"addons":1100}
    ],
    ordersByDay: [38,41,36,44,49,31,55],
    aovByDayINR: [1240,1320,1180,1400,1290,1210,1350],
    revporByDayINR: [420,455,438,510,498,472,525],
    itemMixPareto: [
      {"item":"Grilled Paneer Panini","gmv":9600},
      {"item":"Cold Brew","gmv":4620},
      {"item":"Kerala Toddy Sour","gmv":8100},
      {"item":"Chef Special Curry","gmv":11200}
    ]
  },
  
  service: {
    frtDistributionMin: [2,3,5,7,9,10,12,14,18,22,30],
    ttrDistributionMin: [10,18,25,33,40,52,60,75,90,110,140],
    requestsHeatmap: {
      hours: [0,2,4,6,8,10,12,14,16,18,20,22],
      mon: [4,2,1,1,6,9,12,18,26,22,10,6],
      tue: [3,2,1,1,5,8,13,17,24,20,9,5],
      wed: [4,2,1,1,6,8,11,16,22,19,8,5],
      thu: [3,2,1,1,5,9,12,15,23,21,9,5],
      fri: [5,3,1,1,6,10,14,20,28,26,12,7],
      sat: [6,3,1,1,7,11,16,22,31,28,14,8],
      sun: [5,3,1,1,6,10,15,21,30,27,13,7]
    },
    deptBreaches: [
      {"department":"Housekeeping","breaches":14,"slaCompliancePct":76},
      {"department":"Maintenance","breaches":9,"slaCompliancePct":82},
      {"department":"F&B","breaches":7,"slaCompliancePct":88}
    ],
    reopenRateByDeptPct: [
      {"department":"Housekeeping","reopenPct":8},
      {"department":"Maintenance","reopenPct":12},
      {"department":"F&B","reopenPct":4}
    ]
  },
  
  checkin: {
    completionTminus1Pct: 63,
    docIssues: [
      {"type":"ID mismatch","count":11},
      {"type":"Blurred image","count":17},
      {"type":"Visa missing","count":6}
    ],
    outstandingBalances: [
      {"bookingId":"b_1002","guest":"Aisha R","roomType":"Lake View","balanceINR":2500},
      {"bookingId":"b_1011","guest":"A. Menon","roomType":"Deluxe","balanceINR":1800}
    ]
  },
  
  reviews: {
    avgRatingByDay: [4.4,4.5,4.3,4.6,4.5,4.7,4.6],
    responseRateByDayPct: [88,86,90,92,91,95,94],
    themes: [
      {"theme":"Staff","positive":42,"negative":6},
      {"theme":"Cleanliness","positive":28,"negative":8},
      {"theme":"Food","positive":31,"negative":12},
      {"theme":"Check-in","positive":12,"negative":14}
    ],
    pendingReplies: [
      {"id":"rv_301","source":"Google","rating":3,"text":"Check-in was slow.","date":"2025-08-28"},
      {"id":"rv_302","source":"TripAdvisor","rating":4,"text":"Great activities, room AC slow.","date":"2025-08-30"}
    ]
  },
  
  payments: {
    successByDayPct: [96.8,96.1,95.4,93.2,94.8,96.0,96.5],
    byMethod: [
      {"method":"UPI","successPct":95.8,"count":210},
      {"method":"Card","successPct":96.9,"count":120},
      {"method":"Wallet","successPct":94.2,"count":32},
      {"method":"Cash","successPct":100,"count":44}
    ],
    settlementDelayDays: [1.2,1.6,1.3,1.4,1.8,1.1,1.5],
    failedCodes: [
      {"code":"UPI_TIMEOUT","count":9},
      {"code":"DO_NOT_HONOR","count":5},
      {"code":"INSUFFICIENT_FUNDS","count":4}
    ]
  },
  
  cohorts: {
    arrivalWeeks: ["W30","W31","W32","W33","W34","W35","W36"],
    purchasePctByWeek: [22,24,26,25,29,31,28],
    segmentKpis: [
      {"segment":"Direct","revporINR":520,"fnbConversionPct":14,"activitiesConversionPct":12},
      {"segment":"OTA","revporINR":410,"fnbConversionPct":9,"activitiesConversionPct":7},
      {"segment":"Corporate","revporINR":480,"fnbConversionPct":11,"activitiesConversionPct":8}
    ]
  },
  
  diagnostics: {
    anomalies: [
      {"metric":"Payment Success","magnitudePct":-2.1,"severity":"high","when":"Thu","segment":"UPI","driver":"Gateway timeouts","recommendation":"Enable fallback to Card; show retry banner","link":"/payments?tab=GatewayHealth"},
      {"metric":"Check-in Completion T-1","magnitudePct":-8.0,"severity":"high","when":"This week","segment":"International","driver":"Visa upload drop","recommendation":"Send WA deep link at T-2 with sample guide","link":"/checkin?tab=Flagged"},
      {"metric":"F&B AOV","magnitudePct":-15.5,"severity":"med","when":"This week","segment":"All","driver":"Chef Specials not featured; stock-outs","recommendation":"Feature 2 high-margin items; restock","link":"/engage?tab=FNB"}
    ]
  }
};

export const thresholds = {
  targets: {
    checkinCompletionTminus1Pct: 70,
    frtMedianMin: 10,
    slaCompliancePct: 90,
    fnbConversionPct: 12,
    activitiesConversionPct: 10,
    paymentSuccessPct: 96,
    reviewResponseRatePct: 90
  },
  ambers: {
    checkinCompletionTminus1Pct: 60,
    frtMedianMin: 20,
    slaCompliancePct: 80,
    fnbConversionPct: 8,
    activitiesConversionPct: 6,
    paymentSuccessPct: 93
  }
};