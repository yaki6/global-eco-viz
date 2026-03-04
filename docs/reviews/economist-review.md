# Economic Accuracy Review: Global Economic Visualization
**Reviewer**: Macroeconomist (JST Macrohistory Database Specialist)
**Date**: 2026-03-04
**Documents Reviewed**: Design Doc, Implementation Plan, MacroFinance Documentation R6.pdf, JST RORE Documentation.pdf

---

## Executive Summary

The overall conceptual framework is sound and well-grounded in the JST literature. The four chapters address genuinely important macroeconomic phenomena that the JST database is uniquely positioned to illuminate. However, there are several significant technical errors, misleading simplifications, and missed "aha moments" that would undermine the educational value and academic credibility of the visualization. These issues range from variable misuse (using `bill_rate` as a level rather than a return) to economically misleading narratives (presenting the Phillips curve without its post-1970 breakdown). Each chapter is reviewed in detail below.

---

## Chapter 1: Credit Cycles & Financial Crises

### Variable Accuracy

**CORRECT**: The use of `tloans / gdp` as the credit-to-GDP ratio is accurate and directly corresponds to JST documentation. `tloans` is defined as "Total loans to non-financial private sector (nominal, local currency)" and `gdp` is "GDP (nominal, local currency)". Both are in the same currency denomination, so the ratio is dimensionally consistent. This is the canonical measure used in Schularick & Taylor (2012) and Jorda, Schularick & Taylor (2013).

**CORRECT**: `crisisJST` (systemic financial crises, 0-1 dummy, included since R5) is the appropriate variable. Note: the design correctly uses `crisisJST` rather than the older `crisisJST_old` (R1-R4 coding). This distinction matters — `crisisJST` incorporates revised crisis dating from recent research. Visualizers should note this in a footnote.

**PROBLEM - `hpnom` interpretation**: The design includes `hpnom` (house prices, nominal index, 1990=100) in the variables list but does not explain how it will be used. Plotting raw index values across countries is meaningless for comparison because each country is indexed to 1990=100. If comparing house prices across countries, the visualization must either (a) show growth rates (pct_change), or (b) clearly label that all series are indexed and explain what that means. Showing raw index values side-by-side as if they are comparable is economically misleading.

**MISSING - mortgage loans decomposition**: The dataset includes `tmort` (mortgage loans) and `thh` (household loans) in addition to `tloans`. The key insight from Jorda, Schularick & Taylor (2016) "The Great Mortgaging" is that the 20th century credit boom was *specifically* driven by mortgage lending, not business lending. Showing only total credit misses this crucial insight. The visualization should show `tmort/gdp` vs `tbus/gdp` to reveal the mortgage revolution.

**MISSING - bank leverage**: The dataset includes `lev` (banks' capital ratio, in %), `ltd` (loans-to-deposits ratio), and `noncore` (noncore funding ratio). These are the most direct indicators of banking sector fragility. A pre-crisis surge in `ltd` or decline in `lev` is more mechanically linked to crisis than credit/GDP alone. Including one of these would significantly strengthen the financial fragility narrative.

### Narrative Accuracy

**ACCURATE**: The core thesis — "credit expansion precedes crises" — is empirically well-supported in the JST literature. The narrative correctly identifies credit-to-GDP as an early warning signal.

**OVERSIMPLIFIED**: The phrase "banks lend aggressively, asset prices rise" conflates cause and effect. The JST research shows the causation runs both ways: rising collateral values (especially housing) enable more lending, which further inflates asset prices (credit-asset price feedback loop). The narrative should acknowledge this amplification mechanism.

**MISLEADING - "nearly every major banking crisis"**: Not every credit boom ends in a crisis. The narrative implies a more deterministic relationship than exists. Schularick & Taylor (2012) show credit growth doubles the probability of a crisis in the next 5 years — that is a probabilistic relationship, not a deterministic one. The visualization should clarify this nuance, perhaps by showing "false alarms" (credit booms without crises).

### Suggested "Aha Moment" for Chapter 1

**The Great Mortgaging Reveal**: Show that before WWII, credit/GDP was dominated by business lending. After WWII, mortgage lending took over entirely. By 2007, in countries like the US, UK, and Ireland, mortgage credit alone exceeded 50-70% of GDP. This structural shift — from business finance to real estate speculation — is the key story of 20th century financial instability. The visualization could show a stacked area chart: `tmort/gdp` (bottom) + `tbus/gdp` (top), with crisis markers, revealing how the composition changed dramatically.

---

## Chapter 2: The Rate of Return on Everything

### Variable Accuracy

**CRITICAL ERROR - `bill_rate` interpretation**: The design uses `bill_rate` alongside `eq_tr`, `bond_tr`, and `housing_tr` as if they are comparable return measures. They are NOT. Per the documentation:
- `eq_tr`: Equity **total return** — includes both capital gains and dividends: `r[t] = [[p[t] + d[t]] / p[t-1]] - 1`
- `bond_tr`: Bond **total return** — includes both price appreciation and coupon: `r[t] = [[p[t] + coupon[t]] / p[t-1]] - 1`
- `housing_tr`: Housing **total return** — includes both capital gains and rent: `r[t] = [[p[t] + d[t]] / p[t-1]] - 1`
- `bill_rate`: Bill **rate** — defined as `r[t] = coupon[t] / p[t-1]` — this is essentially just a yield, NOT a total return in the same sense

For bills (which are short-duration instruments), the total return approximates the yield, so using `bill_rate` as a proxy for safe asset returns is *defensible* but should be explicitly noted. The implementation plan correctly includes `bill_rate` in the safe assets comparison, but the frontend narrative must make clear that bills are short-term instruments (T-bills, money market rates, or deposit rates depending on country — see RORE Documentation Table 1) and their "return" is just the yield because there is no capital gain component.

**CORRECT**: The use of `risky_tr` and `safe_tr` as portfolio aggregates is accurate:
- `risky_tr`: "Nominal, equally weighted average of housing and equity" — simple average of `housing_tr` and `eq_tr`
- `safe_tr`: "Nominal, equally weighted average of bonds and bills"
- `capital_tr`: "Total return on wealth, nominal. Weighted average of housing, equity, bonds and bills" — this is the aggregate wealth portfolio return

**IMPORTANT NOTE on weighting**: The documentation states `risky_tr` is an *equally weighted* average of housing and equity, and `capital_tr` is a *wealth-weighted* average. The narrative must be careful: showing `capital_tr` as "the return on wealth" is correct only if the user understands that wealth weights vary by country and time. An equally-weighted composite would tell a different story.

**PROBLEM - Nominal vs Real conversion**: The design mentions a "nominal/real toggle" that "adjusts by CPI." The CPI variable in JST is an **index** (1990=100), not a rate. To deflate nominal returns to real returns, the implementation must compute:
```
real_return[t] = (1 + nominal_return[t]) / (1 + inflation_rate[t]) - 1
```
where `inflation_rate[t] = cpi[t]/cpi[t-1] - 1`.

The implementation plan shows `subset["inflation"] = cdf["cpi"].pct_change() * 100` — this correctly computes the inflation rate. But the real return conversion needs to use the Fisher equation, not simple subtraction (`real ≠ nominal - inflation` for large returns). For the 1920s hyperinflation episodes (Germany, for example, is excluded but other countries saw high inflation), simple subtraction would produce large errors.

**MISSING - Country coverage gap**: The RORE Documentation explicitly states that for 2016-2020, data availability varies by country (e.g., Spain's bill rate is missing for 2018). The cumulative $1 chart will have breaks for some country-asset combinations. The implementation must handle these gaps gracefully (e.g., chain-linking around missing years, or simply not extending the cumulative series through gaps).

### Narrative Accuracy

**ACCURATE**: The central finding from Jorda et al. (2019) — that housing returns are comparable to equity returns over the long run but with lower volatility — is one of the most counterintuitive results in modern financial economics. This is well-suited to the "aha moment" format.

**OVERSIMPLIFIED**: The narrative about "risk premium" needs more precision. The equity premium (equity returns minus bill returns) was roughly 4-5% per year over the full sample, but this average masks enormous cross-country and cross-era variation. The premium essentially disappeared in several European countries during 1914-1945. Showing the equity premium decade-by-decade would be more instructive than a single average.

**MISSING - The housing puzzle**: The most surprising finding of RORE is that housing total returns are *nearly as high as equity* over 1870-2015, but with roughly half the volatility (standard deviation). This violates the standard risk-return tradeoff. The Sharpe ratio of housing exceeds that of equity in most countries. This should be the headline "aha moment" of Chapter 2, not just mentioned in passing.

### Suggested "Aha Moment" for Chapter 2

**The Housing Puzzle Visualization**: Plot a risk-return scatter where the x-axis is the standard deviation of annual returns (1870-2020) and the y-axis is the average annual real return for each asset class (equity, housing, bonds, bills). Each dot represents one country-asset combination. The user would expect equity to be in the upper-right (high return, high risk) and bonds/bills in the lower-left (low return, low risk). Housing, surprisingly, clusters near equity returns but with much lower volatility — violating the textbook risk-return tradeoff. This is the "puzzle" that RORE introduced to the literature.

---

## Chapter 3: Fiscal Policy & Debt Sustainability

### Variable Accuracy

**CORRECT**: `debtgdp` is defined as "Public debt-to-GDP ratio" — this is already expressed as a ratio (presumably percent, i.e., 0-100 scale in the data). The implementation must verify whether the variable is stored as a fraction (0-1) or percentage (0-100) before plotting. Most JST variables are stored as ratios rather than percentages.

**PROBLEM - Revenue and Expenditure calculation**: The implementation computes:
```python
subset["rev_gdp"] = subset["revenue"] / subset["gdp"]
```
`revenue` is "Government revenues (nominal, local currency)" and `gdp` is "GDP (nominal, local currency)." This calculation is dimensionally correct. However, there is a consistency concern: `debtgdp` is a pre-computed ratio in the dataset, while `rev_gdp` and `exp_gdp` are computed on the fly. If the underlying GDP series used to compute `debtgdp` differs slightly from the `gdp` column (due to revisions), there could be inconsistencies. The documentation confirms that GDP was revised in R6 (Section 1.1 of RORE Documentation). To be safe, a footnote should acknowledge this.

**MISSING - Interest rate dynamics**: The design mentions `stir` and `ltrate` in the variable list for Chapter 3, but the implementation only uses `debt_gdp`, `revenue_gdp`, and `expenditure_gdp`. The most important fiscal sustainability concept is the **debt dynamics equation**:

```
Δ(debt/GDP) = (r - g) × (debt/GDP) + primary_deficit/GDP
```

where r is the real interest rate and g is the real GDP growth rate. The visualization should show:
- `ltrate` minus inflation (= real interest rate, r)
- Growth rate of `rgdpmad` (= real GDP growth, g)
- The (r - g) gap, which determines whether debt is self-sustaining

When r > g (interest rate exceeds growth rate), debt spirals upward without primary surpluses. When r < g (as in the post-WWII period), governments can "grow out" of debt. This is one of the most important fiscal concepts and is not currently represented.

**MISSING - Seigniorage and war finance**: The dataset includes `narrowm` and `money` (narrow and broad money). During wars, governments financed deficits through money creation (seigniorage). The sharp rise in `money/gdp` during WWI and WWII, combined with the spike in `debtgdp`, tells the story of how wars were financed. This would be a powerful addition to Chapter 3.

### Narrative Accuracy

**ACCURATE**: Wartime debt accumulation followed by peacetime consolidation is well-documented and visible in the JST data. The UK's debt/GDP peaked above 200% after WWII before declining.

**MISSING - The r-g miracle**: The post-WWII debt reduction in most countries was not primarily due to fiscal austerity — it was largely achieved through financial repression (keeping real interest rates below growth rates) and inflation. This "r < g" regime is one of the key historical lessons from the data. With current debates about fiscal sustainability at high debt levels, this is highly relevant and would make an excellent "aha moment."

**OVERSIMPLIFIED**: The scatter plot of "Debt-to-GDP vs GDP growth rate" without controlling for the interest rate environment will confuse rather than clarify. High debt with low r-g can be perfectly sustainable; high debt with high r-g is explosive. The scatter needs a third dimension or should be shown separately for different interest rate regimes.

### Suggested "Aha Moment" for Chapter 3

**The r-g Gap Animation**: Animate the r-g gap (real interest rate minus real GDP growth rate) for a selected country from 1870 to 2020. Shade periods red when r > g (debt dynamics are explosive) and blue when r < g (debt dynamics are favorable). Overlay the debt/GDP ratio. The user would see: (1) the pre-WWI gold standard era with moderate r-g, (2) wartime spikes in debt, (3) the post-WWII "financial repression" era with deeply negative r-g enabling massive debt reduction, (4) the 1980s Volcker shock pushing r-g sharply positive, (5) the post-2008 return to r < g with near-zero rates. This single chart contains the entire history of fiscal sustainability.

---

## Chapter 4: Inflation & Monetary Policy

### Variable Accuracy

**CRITICAL ERROR - CPI as price level vs. inflation**: The design says variables include `cpi` but that Chapter 4 concerns "CPI inflation rate." The `cpi` variable in JST is a **price level index** (index, 1990=100), NOT an inflation rate. The implementation correctly computes:
```python
inf = cdf["cpi"].pct_change() * 100
```
This is correct. However, the design document lists `cpi` as a variable used for "Toggle between different inflation measures" — there is only ONE inflation measure derivable from the JST data (the CPI-based year-over-year rate). There is no PCE, GDP deflator, or core inflation in JST. The design should not imply there are multiple inflation measures to toggle.

**CORRECT**: Computing inflation as `cpi.pct_change() * 100` is the standard approach and produces annual percentage inflation rates. This is the correct formula.

**IMPORTANT CAVEAT on unemployment data quality**: The RORE Documentation (Section 1.2) is explicit that pre-WWII unemployment data is measured very differently from post-WWII data. Before WWII, unemployment was often measured within trade unions or specific insured subgroups, which systematically *underestimates* true unemployment. The unemployment rate in 1910 and the unemployment rate in 2010 are not strictly comparable. The Phillips curve for pre-1945 data should be interpreted with extreme caution, and users should be warned explicitly.

**PROBLEM - Phillips Curve specification**: The design shows a simple scatter of unemployment vs. inflation (levels). This is the textbook "original" Phillips curve from 1958. However, the empirically relevant Phillips curve is the **New Keynesian Phillips Curve**:

```
π[t] = β·E[π[t+1]] + κ·(u[t] - u*) + ε[t]
```

A simple scatter of unemployment vs. inflation levels will look like noise for the full 150-year sample because:
1. The relationship shifted dramatically after the 1970s supply shocks
2. Inflation expectations were anchored at different levels across different monetary regimes (gold standard, Bretton Woods, fiat)
3. The natural rate of unemployment (u*) changed over time

The "animate through decades" feature in the design is exactly the right approach to reveal this, but the narrative must explain *why* the scatter shifts — it is not random, it reflects changing monetary policy credibility and inflation expectations.

**MISSING - Monetary regimes**: The JST data covers three distinct monetary regimes: the gold standard (roughly 1870-1914), the interwar period (with various currency arrangements), and the post-WWII fiat money era (Bretton Woods 1946-1971, then floating rates). Inflation behavior is fundamentally different across these regimes. The Phillips curve analysis without controlling for monetary regime is misleading. The `peg` dummy in JST can proxy for fixed exchange rate regimes, which correlates with the gold standard era.

**MISSING - Wage inflation**: The `wage` variable (nominal wages index, 1990=100) enables the computation of wage inflation — the original "wage Phillips curve" from A.W. Phillips (1958) was actually about wages, not CPI. Computing `wage.pct_change()` gives the nominal wage growth rate. Plotting unemployment vs. wage growth (rather than CPI inflation) would be both more historically accurate and would reveal additional insights about the labor market.

### Narrative Accuracy

**ACCURATE**: The description of the Phillips curve as shifting across decades is correct and is one of the key insights from the Gabriel (2021) paper that introduced the unemployment and wages data to JST R6.

**SERIOUSLY MISLEADING - "monetary neutrality"**: The phrase "monetary neutrality" in the chapter's stated economic principle refers to the long-run proposition that money supply changes affect only nominal variables (prices), not real variables (output, employment). This is a highly contested empirical claim over a 150-year sample. The JST data includes episodes (like the 1930s Great Depression or the Volcker disinflation) where monetary policy had dramatic real effects for extended periods. Presenting "monetary neutrality" as the central message oversimplifies and could mislead students into thinking money doesn't matter for the real economy.

**BETTER FRAMING**: Replace "monetary neutrality" with "monetary regimes" as the organizing concept. The key insight is that the relationship between money, inflation, and economic activity depends critically on the monetary policy framework in place — whether the economy is on the gold standard, under Bretton Woods, or in a fiat money regime with an independent central bank.

### Suggested "Aha Moment" for Chapter 4

**The Volcker Disinflation as a Natural Experiment**: For the United States (and to a lesser extent, UK under Thatcher), show the period 1979-1985 in detail. Paul Volcker raised the federal funds rate to nearly 20% to break inflation, causing a sharp recession (unemployment peaked at ~10.8% in 1982). The scatter shows the Phillips curve "working" — higher unemployment was deliberately used to reduce inflation from ~13% to ~3%. Then show the 2010s: unemployment fell from 10% to under 4%, yet inflation remained near 2% (the "flat Phillips curve" puzzle). This comparison — one era where the Phillips curve was steep and central banks had to pay a high price to reduce inflation, versus another era where it flattened — is the central puzzle of modern monetary economics.

---

## Cross-Cutting Issues

### 1. Crisis Variable Consistency

The implementation uses `crisisJST` across all chapters. The documentation notes that R6 introduced `crisisJST` (replacing `crisisJST_old`). The key difference is that R6 revised crisis dating based on updated research. The UI should note "Crisis dating from JST Release 6 (2022)" to distinguish from earlier versions users may have encountered.

### 2. Handling Missing Data

Several variables have significant missing data:
- Early years (1870-1900): unemployment data is sparse or unavailable for many countries
- War years (1914-18, 1939-45): equity, bond, and housing returns are often interpolated (see `eq_tr_interp`, `housing_capgain_ipolated` flags in documentation)
- Ireland: only added in R6, so coverage starts later than 1870 for many variables

The implementation's `clean_val()` function correctly converts NaN to None. But the frontend should visually distinguish between "data not collected" (early periods), "data interpolated" (wartime), and "data genuinely missing" (isolated gaps). Currently, the design treats all missing values the same way.

### 3. Nominal vs. Real Returns: Fisher Equation

Throughout all chapters, when converting nominal returns to real returns, use the Fisher equation:
```
real_return = (1 + nominal_return) / (1 + inflation_rate) - 1
```
NOT the approximation `real ≈ nominal - inflation`. The approximation is reasonable for small values (< 5%) but fails badly during high-inflation episodes (1970s, post-WWI) where this visualization will spend considerable time. The implementation plan does not specify which formula to use.

### 4. Attribution Requirements

The PDF documentation (page 2) specifies two distinct citation requirements:
- For macroeconomic variables: cite Jorda, Schularick & Taylor (2017), NBER Macroeconomics Annual
- **For asset return data (Chapter 2)**: cite Jorda, Knoll, Kuvshinov, Schularick & Taylor (2019), QJE

The current design only shows one citation in the footer. Chapter 2 must add the RORE citation separately. Failure to do so violates the CC BY-NC-SA 4.0 license terms.

### 5. Country-Specific Caveats

Germany is included in the 18 countries but is a special case: it underwent hyperinflation in 1923 (not fully captured in the annual data), currency reform in 1948 (Deutsche Mark replacing Reichsmark), and reunification in 1990. Any cross-country comparison that includes Germany should note these structural breaks. For Chapter 4 (inflation), Germany's hyperinflation is so extreme it will visually dominate any chart and should probably be displayed separately or with explicit annotation.

---

## Summary of Required Corrections (Priority Order)

| Priority | Chapter | Issue | Fix Required |
|----------|---------|-------|--------------|
| CRITICAL | Ch. 2 | `bill_rate` is a yield, not a comparable total return | Add explanatory note; clarify measurement difference |
| CRITICAL | Ch. 2 | Real return conversion should use Fisher equation | Fix in implementation |
| CRITICAL | Ch. 4 | Unemployment data pre-WWII is not comparable to post-WWII | Add data quality warning in narrative |
| CRITICAL | Attribution | RORE data requires separate QJE citation | Add to Chapter 2 footer |
| HIGH | Ch. 1 | `hpnom` index values not comparable cross-country | Use growth rates or add explicit indexing explanation |
| HIGH | Ch. 3 | r-g gap omitted from debt sustainability narrative | Add (r-g) visualization |
| HIGH | Ch. 4 | "Monetary neutrality" framing is misleading | Replace with "monetary regimes" |
| HIGH | Ch. 4 | Phillips curve without regime shifts is noise | Require decade selector; add monetary regime coloring |
| MEDIUM | Ch. 1 | Mortgage vs. business credit decomposition missing | Add `tmort/gdp` vs `tbus/gdp` stacked chart |
| MEDIUM | Ch. 2 | Housing Sharpe ratio > equity Sharpe ratio not highlighted | Make this the headline finding |
| MEDIUM | Ch. 3 | War finance via money creation not shown | Add money/GDP overlay on fiscal chart |
| LOW | All | Interpolated wartime data not distinguished visually | Add dashed lines or different styling for interpolated data |
| LOW | Ch. 4 | Original Phillips curve was about wages, not CPI | Add `wage.pct_change()` as alternative y-axis |

---

## Additional Economic Insights Worth Adding

1. **The "Hockey Stick" of Finance**: One of the most striking JST findings is that total credit/GDP was roughly flat at 30-40% of GDP from 1870 to ~1950, then doubled to 80%+ by 2008 across most advanced economies. This "hockey stick" pattern is the organizing fact of Chapter 1 and should be its opening visual.

2. **Safe Asset Scarcity**: The post-2008 period shows an unusual configuration: central banks pushed bill rates to zero or negative. `bill_rate` for most countries from 2009-2021 is near zero or negative. This is unprecedented in the 150-year record. Chapter 2 should highlight this as a structural break.

3. **The WWI/WWII Natural Experiments**: Both world wars provide natural experiments in fiscal policy (deficit spending + debt monetization) and monetary policy (inflation, exchange controls). These are the clearest examples of how extreme fiscal stress is resolved — rarely through austerity alone.

4. **Cross-Country Synchronization of Crises**: The 2008 crisis was notable for its simultaneous occurrence across nearly all 18 countries. Earlier crises were more idiosyncratic. A map animation showing which countries were in crisis each year would powerfully illustrate the increasing synchronization of modern financial crises.
