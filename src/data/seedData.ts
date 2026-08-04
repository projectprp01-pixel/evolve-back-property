export const seedData = {
  "reviews": [
    {"id":"rv_101","source":"Google","rating":4,"text":"Loved the spice walk. AC took time to cool.","createdAt":"2025-08-30T18:20:00+05:30","respondedAt":null,"themes":["Activities+","Maintenance-"]},
    {"id":"rv_102","source":"Booking.com","rating":5,"text":"Amazing staff and activities!","createdAt":"2025-08-29T14:05:00+05:30","respondedAt":"2025-08-30T10:00:00+05:30","themes":["Staff+","Experience+"]},
    {"id":"rv_103","source":"TripAdvisor","rating":3,"text":"Check-in was slow.","createdAt":"2025-08-28T09:40:00+05:30","respondedAt":null,"themes":["Check-in-"]}
  ],

  "payments": {
    "transactions":[
      {"id":"tx_9001","orderType":"fnb","amount":1288,"method":"UPI","gateway":"Razorpay","status":"paid","bookingId":"b_1001","utr":"UTR12345","createdAt":"2025-08-31T13:04:20+05:30","settledAt":"2025-09-01T15:10:00+05:30"},
      {"id":"tx_9002","orderType":"activity","amount":1600,"method":"Card","gateway":"Stripe","status":"paid","bookingId":"b_1002","utr":"STRP-7781","createdAt":"2025-08-31T07:12:10+05:30","settledAt":null},
      {"id":"tx_9003","orderType":"fnb","amount":450,"method":"Cash","gateway":"—","status":"paid","bookingId":"b_1003","utr":null,"createdAt":"2025-08-31T20:10:00+05:30","settledAt":null},
      {"id":"tx_9004","orderType":"fnb","amount":320,"method":"UPI","gateway":"Razorpay","status":"failed","bookingId":"b_1002","utr":null,"createdAt":"2025-08-31T20:22:00+05:30","settledAt":null}
    ],
    "settlements":[
      {"payoutId":"py_100","gateway":"Razorpay","date":"2025-09-01","amount":184300,"txns":42},
      {"payoutId":"py_101","gateway":"Stripe","date":"2025-09-02","amount":58200,"txns":11}
    ],
    "refunds":[
      {"refundId":"rf_11","txnId":"tx_9001","amount":120,"reason":"Item unavailable","date":"2025-08-31"}
    ],
    "gatewayHealth":{"successPct":96.2,"settlementDelayDays":1.4,"chargebackRatePct":0.3}
  }
};
