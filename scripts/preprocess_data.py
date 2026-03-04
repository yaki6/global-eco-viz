"""Convert JST Dataset R6.xlsx into per-chapter JSON files for the frontend."""
import json
import math
import sys
from pathlib import Path

import pandas as pd

EXCEL_PATH = Path(__file__).parent.parent / "Research " / "JST Dataset R6.xlsx"
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "data"

COUNTRIES_18 = [
    "Australia", "Belgium", "Canada", "Switzerland", "Germany", "Denmark",
    "Spain", "Finland", "France", "United Kingdom", "Ireland", "Italy",
    "Japan", "Netherlands", "Norway", "Portugal", "Sweden", "USA"
]

def clean_val(v):
    """Convert NaN/inf to None for JSON serialization."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return round(v, 6) if isinstance(v, float) else v

def load_dataframe() -> pd.DataFrame:
    df = pd.read_excel(EXCEL_PATH, sheet_name=0)
    df = df[df["country"].isin(COUNTRIES_18)]
    return df

def build_chapter1(df: pd.DataFrame) -> dict:
    """Credit Cycles & Financial Crises."""
    cols = ["year", "country", "iso", "tloans", "gdp", "crisisJST", "hpnom", "money"]
    subset = df[cols].copy()
    subset["credit_gdp"] = subset["tloans"] / subset["gdp"]

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "credit_gdp": [clean_val(v) for v in cdf["credit_gdp"]],
            "crisis": [int(v) if not math.isnan(v) else 0 for v in cdf["crisisJST"]],
            "house_prices": [clean_val(v) for v in cdf["hpnom"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter2(df: pd.DataFrame) -> dict:
    """Rate of Return on Everything."""
    cols = ["year", "country", "iso", "eq_tr", "bond_tr", "housing_tr", "bill_rate",
            "capital_tr", "risky_tr", "safe_tr", "cpi"]
    subset = df[cols].copy()

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "equity": [clean_val(v) for v in cdf["eq_tr"]],
            "bonds": [clean_val(v) for v in cdf["bond_tr"]],
            "housing": [clean_val(v) for v in cdf["housing_tr"]],
            "bills": [clean_val(v) for v in cdf["bill_rate"]],
            "capital": [clean_val(v) for v in cdf["capital_tr"]],
            "risky": [clean_val(v) for v in cdf["risky_tr"]],
            "safe": [clean_val(v) for v in cdf["safe_tr"]],
            "cpi": [clean_val(v) for v in cdf["cpi"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter3(df: pd.DataFrame) -> dict:
    """Fiscal Policy & Debt Sustainability."""
    cols = ["year", "country", "iso", "debtgdp", "revenue", "expenditure",
            "gdp", "rgdpmad", "stir", "ltrate", "crisisJST"]
    subset = df[cols].copy()
    subset["rev_gdp"] = subset["revenue"] / subset["gdp"]
    subset["exp_gdp"] = subset["expenditure"] / subset["gdp"]

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "debt_gdp": [clean_val(v) for v in cdf["debtgdp"]],
            "revenue_gdp": [clean_val(v) for v in cdf["rev_gdp"]],
            "expenditure_gdp": [clean_val(v) for v in cdf["exp_gdp"]],
            "real_gdp_pc": [clean_val(v) for v in cdf["rgdpmad"]],
            "crisis": [int(v) if not math.isnan(v) else 0 for v in cdf["crisisJST"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter4(df: pd.DataFrame) -> dict:
    """Inflation & Monetary Policy."""
    cols = ["year", "country", "iso", "cpi", "stir", "ltrate",
            "unemp", "wage", "narrowm", "money"]
    subset = df[cols].copy()
    inflation_series = []
    for country in COUNTRIES_18:
        mask = subset["country"] == country
        cdf = subset[mask].sort_values("year")
        inf = cdf["cpi"].pct_change() * 100
        inflation_series.append(inf)
    subset["inflation"] = pd.concat(inflation_series)

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "inflation": [clean_val(v) for v in cdf["inflation"]],
            "short_rate": [clean_val(v) for v in cdf["stir"]],
            "long_rate": [clean_val(v) for v in cdf["ltrate"]],
            "unemployment": [clean_val(v) for v in cdf["unemp"]],
            "wages": [clean_val(v) for v in cdf["wage"]],
            "narrow_money": [clean_val(v) for v in cdf["narrowm"]],
            "broad_money": [clean_val(v) for v in cdf["money"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataframe()

    builders = [
        ("chapter1.json", build_chapter1),
        ("chapter2.json", build_chapter2),
        ("chapter3.json", build_chapter3),
        ("chapter4.json", build_chapter4),
    ]

    for filename, builder in builders:
        data = builder(df)
        out_path = OUTPUT_DIR / filename
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        size_kb = out_path.stat().st_size / 1024
        print(f"Wrote {filename}: {size_kb:.0f} KB, {len(data)} countries")

if __name__ == "__main__":
    main()
