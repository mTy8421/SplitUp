const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const server = http.createServer((req, res) => {
  let file = path.resolve(
    root,
    "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
  );
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (file === root) file = path.join(root, "index.html");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
  };
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.getByText("เริ่มทริปแรกของคุณ", { exact: true }).waitFor();
    const { demoTrip } = await import("../src/lib/engine.ts");
    await page.evaluate(
      (trip) =>
        localStorage.setItem("harnkan-trips-v1", JSON.stringify([trip])),
      demoTrip(),
    );
    await page.reload();
    await page.getByText("เริ่มทริปแรกของคุณ", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("harnkan-trips-v1")),
      ),
      [],
    );
    const edited = { ...demoTrip(), name: "ทริปสำหรับทดสอบ" };
    await page.evaluate(
      (trip) =>
        localStorage.setItem("harnkan-trips-v1", JSON.stringify([trip])),
      edited,
    );
    await page.reload();
    await page
      .getByRole("heading", { name: edited.name, exact: true })
      .waitFor();
    await page.getByText("฿5,000.00", { exact: true }).waitFor();
    fs.mkdirSync(path.join(root, "review"), { recursive: true });
    const checkViewport = async () => {
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll('input,[role="button"],[role="tab"]')]
          .filter((el) => {
            if (el.closest('[aria-hidden="true"]')) return false;
            const rect = el.getBoundingClientRect();
            return (
              rect.width > 0 &&
              (rect.left < -1 || rect.right > window.innerWidth + 1)
            );
          })
          .map((el) => el.getAttribute("aria-label") || el.textContent),
      );
      assert.deepEqual(overflow, [], "Controls overflow the viewport");
    };
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
      await page.getByRole("tab", { name: "หน้าหลัก", exact: true }).click();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(root, "review", "home-" + width + ".png"),
        fullPage: true,
      });
      assert.equal(
        await page.getByTestId("desktop-sidebar").count(),
        width >= 1100 ? 1 : 0,
      );
      await checkViewport();
      for (const name of ["ค่าใช้จ่าย", "สรุปยอด", "สมาชิก"]) {
        await page.getByRole("tab", { name, exact: true }).click();
        await checkViewport();
      }
      await page.getByRole("tab", { name: "หน้าหลัก", exact: true }).click();
      await page
        .getByRole("button", { name: "+ เพิ่มค่าใช้จ่าย", exact: true })
        .click();
      await page.getByTestId("form-sheet").waitFor();
      await page.waitForTimeout(350);
      await checkViewport();
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: path.join(root, "review", "form-" + width + ".png"),
          fullPage: true,
        });
      await page.getByRole("button", { name: "ปิด", exact: true }).click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );

    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page
      .getByRole("button", { name: "+ เพิ่มค่าใช้จ่าย", exact: true })
      .click();
    await page.getByLabel("จำนวนเงิน (บาท)", { exact: true }).fill("100");
    await page.getByLabel("ชื่อรายการ", { exact: true }).fill("ทดสอบอาหาร");
    await page
      .getByRole("button", { name: "บันทึกค่าใช้จ่าย", exact: true })
      .click();
    await page.getByText("฿5,100.00", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("฿5,100.00", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "ทดสอบอาหาร 100.00 บาท", exact: true })
      .click();
    await page
      .getByRole("button", { name: "แก้ไขรายการ", exact: true })
      .click();
    await page.getByLabel("จำนวนเงิน (บาท)", { exact: true }).fill("200");
    await page
      .getByRole("button", { name: "บันทึกค่าใช้จ่าย", exact: true })
      .click();
    await page.getByText("฿5,200.00", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "ทดสอบอาหาร 200.00 บาท", exact: true })
      .click();
    await page.getByRole("button", { name: "ลบรายการ", exact: true }).click();
    await page.getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await page.getByText("฿5,000.00", { exact: true }).waitFor();
    await page.getByRole("tab", { name: "สรุปยอด" }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "บันทึกว่าชำระแล้ว", exact: true })
        .count(),
      2,
    );
    await page
      .getByRole("button", { name: "บันทึกว่าชำระแล้ว", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await page
      .getByRole("button", { name: "ยกเลิกสถานะชำระแล้ว", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "บันทึกว่าชำระแล้ว", exact: true })
        .count(),
      1,
    );
    await page
      .getByRole("button", { name: "ยกเลิกสถานะชำระแล้ว", exact: true })
      .click();
    await page.getByRole("button", { name: "ยืนยัน", exact: true }).click();
    await page.waitForFunction(
      () => !document.body.textContent.includes("ยกเลิกสถานะชำระแล้ว"),
    );
    await page
      .getByRole("button", { name: "ทริปทั้งหมด", exact: true })
      .click();
    await page
      .getByRole("button", { name: "+ สร้างทริป", exact: true })
      .click();
    await page.getByLabel("ชื่อทริป", { exact: true }).fill("ทริปทดสอบ");
    await page.getByLabel("สมาชิกคนที่ 1", { exact: true }).fill("เอ");
    await page.getByLabel("สมาชิกคนที่ 2", { exact: true }).fill("บี");
    await page.getByRole("button", { name: "สร้างทริป", exact: true }).click();
    await page
      .getByRole("heading", { name: "ทริปทดสอบ", exact: true })
      .waitFor();
    await page.getByRole("tab", { name: "สมาชิก" }).click();
    await page.getByLabel("เพิ่มสมาชิก", { exact: true }).fill("ซี");
    await page
      .getByRole("button", { name: "บันทึกสมาชิก", exact: true })
      .click();
    await page.getByText("ซี", { exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );

    await page.evaluate(() => {
      const trips = JSON.parse(localStorage.getItem("harnkan-trips-v1"));
      const trip = trips[0];
      trip.name = "ทริปทดสอบชื่อยาวสำหรับวันหยุดกับเพื่อนและครอบครัว".repeat(2);
      trip.members.forEach((m, i) => {
        m.name = "สมาชิกชื่อยาวสำหรับทดสอบการแสดงผล".repeat(2) + i;
      });
      const e = trip.expenses[0];
      e.amount = 10000000000;
      e.mode = "equal";
      e.inputs = {};
      const ids = Object.keys(e.shares);
      ids.forEach((id, i) => {
        e.shares[id] =
          Math.floor(e.amount / ids.length) +
          (i < e.amount % ids.length ? 1 : 0);
      });
      localStorage.setItem("harnkan-trips-v1", JSON.stringify(trips));
    });
    await page.reload();
    await page.getByRole("tab", { name: "หน้าหลัก", exact: true }).waitFor();
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const name of ["หน้าหลัก", "ค่าใช้จ่าย", "สรุปยอด", "สมาชิก"]) {
        await page.getByRole("tab", { name, exact: true }).click();
        await checkViewport();
      }
      await page.getByRole("tab", { name: "ค่าใช้จ่าย", exact: true }).click();
      await page
        .getByRole("button", { name: "+ เพิ่มค่าใช้จ่าย", exact: true })
        .click();
      await page.waitForTimeout(350);
      await page.getByRole("button", { name: "กำหนดยอด", exact: true }).click();
      await checkViewport();
      await page.getByRole("button", { name: "ปิด", exact: true }).click();
    }

    assert.deepEqual(errors, []);
    console.log(
      "Browser checks passed: mobile/desktop layout, expense CRUD, persistence, settlements/undo, trips and members.",
    );
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
