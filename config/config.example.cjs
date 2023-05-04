module.exports = {
  account: "production",
  slack: {
    accessToken: "",
    appToken: "",
    channel: "highlow",
  },
  server: {
    pipeName: "mthl",
  },
  browser: {
    timeout: 10000,
  },
  cron: {
    schedules: [
      {
        schedule: "0 10 * * * 1-5",
        query: { command: "CheckBalance" },
      },
      {
        schedule: "0 30 6 * * 1-5",
        query: { command: "Stats", clear: true },
      },
      {
        schedule: "0 30 11,18 * * 1-5",
        query: { command: "Stats", clear: false },
      },
    ]
  }
}
