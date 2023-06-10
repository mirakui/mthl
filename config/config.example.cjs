module.exports = {
  account: {
    environment: "production",
  },
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
    host: "127.0.0.1",
    port: 9222,
    launch: false,
    headless: true,
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
  },
  entry: {
    rateLimitPerMinute: 2,
  }
}
