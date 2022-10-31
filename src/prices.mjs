import "./polyfills.mjs";
import express from "express";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.
function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const liftPassCost = req.query.cost;
    const liftPassType = req.query.type;
    database.setBasePrice(liftPassType, liftPassCost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const temporal = parseTemporal(req.query.date);
    const cost = calculateCost(age, type, baseCost, temporal);
    res.json({ cost });
  });


  function parseTemporal(str) {
    if (str) {
      return Temporal.PlainDate.from(str);
    }
  }
  
  function calculateCost(age, type, baseCost, temporal) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, baseCost, temporal);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, baseCost, temporal) {
    let reduction = calculateReduction(temporal);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(temporal) {
    let reduction = 0;
    if (temporal && isMonday(temporal) && !isHoliday(temporal)) {
      reduction = 35;
    }
    return reduction;
  }

  function isMonday(temporal) {
    return temporal.dayOfWeek === 1;
  }

  function isHoliday(temporal) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = parseTemporal(row.holiday);
      if (temporal && temporal.equals(holiday)) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
