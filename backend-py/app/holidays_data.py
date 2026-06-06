"""
Static, computed public-holiday data for a handful of countries.

No external service or network call — holidays are derived on the fly for any
year from a small per-country ruleset. Covers fixed-date holidays, nth-weekday
holidays (e.g. US Thanksgiving), and Easter-relative holidays (Good Friday).
"""

from datetime import date, timedelta
from dateutil.easter import easter

# Country code → display name
COUNTRIES = [
    {"code": "US", "name": "United States"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "IN", "name": "India"},
    {"code": "CA", "name": "Canada"},
    {"code": "AU", "name": "Australia"},
]

_COUNTRY_NAMES = {c["code"]: c["name"] for c in COUNTRIES}

# Weekday constants matching date.weekday() (Mon=0 … Sun=6)
MON, TUE, WED, THU, FRI, SAT, SUN = range(7)


def _nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    """nth occurrence of a weekday in a month. n=-1 means the last one."""
    if n > 0:
        d = date(year, month, 1)
        offset = (weekday - d.weekday()) % 7
        return d + timedelta(days=offset + (n - 1) * 7)
    # last occurrence: walk back from the end of the month
    if month == 12:
        d = date(year, 12, 31)
    else:
        d = date(year, month + 1, 1) - timedelta(days=1)
    offset = (d.weekday() - weekday) % 7
    return d - timedelta(days=offset)


# Each rule: (name, kind, *args)
#   ("fixed", month, day)
#   ("nth", month, weekday, n)   n=-1 → last
#   ("easter", offset_days)
_RULES = {
    "US": [
        ("New Year's Day", "fixed", 1, 1),
        ("Martin Luther King Jr. Day", "nth", 1, MON, 3),
        ("Presidents' Day", "nth", 2, MON, 3),
        ("Memorial Day", "nth", 5, MON, -1),
        ("Juneteenth", "fixed", 6, 19),
        ("Independence Day", "fixed", 7, 4),
        ("Labor Day", "nth", 9, MON, 1),
        ("Columbus Day", "nth", 10, MON, 2),
        ("Veterans Day", "fixed", 11, 11),
        ("Thanksgiving", "nth", 11, THU, 4),
        ("Christmas Day", "fixed", 12, 25),
    ],
    "GB": [
        ("New Year's Day", "fixed", 1, 1),
        ("Good Friday", "easter", -2),
        ("Easter Monday", "easter", 1),
        ("Early May Bank Holiday", "nth", 5, MON, 1),
        ("Spring Bank Holiday", "nth", 5, MON, -1),
        ("Summer Bank Holiday", "nth", 8, MON, -1),
        ("Christmas Day", "fixed", 12, 25),
        ("Boxing Day", "fixed", 12, 26),
    ],
    "IN": [
        ("Republic Day", "fixed", 1, 26),
        ("Independence Day", "fixed", 8, 15),
        ("Gandhi Jayanti", "fixed", 10, 2),
        ("Christmas Day", "fixed", 12, 25),
    ],
    "CA": [
        ("New Year's Day", "fixed", 1, 1),
        ("Good Friday", "easter", -2),
        ("Canada Day", "fixed", 7, 1),
        ("Labour Day", "nth", 9, MON, 1),
        ("Thanksgiving", "nth", 10, MON, 2),
        ("Christmas Day", "fixed", 12, 25),
        ("Boxing Day", "fixed", 12, 26),
    ],
    "AU": [
        ("New Year's Day", "fixed", 1, 1),
        ("Australia Day", "fixed", 1, 26),
        ("Good Friday", "easter", -2),
        ("Easter Monday", "easter", 1),
        ("Anzac Day", "fixed", 4, 25),
        ("Christmas Day", "fixed", 12, 25),
        ("Boxing Day", "fixed", 12, 26),
    ],
}

SUPPORTED_CODES = set(_RULES)


def _resolve(rule, year: int) -> date:
    kind = rule[1]
    if kind == "fixed":
        return date(year, rule[2], rule[3])
    if kind == "nth":
        return _nth_weekday(year, rule[2], rule[3], rule[4])
    if kind == "easter":
        return easter(year) + timedelta(days=rule[2])
    raise ValueError(f"Unknown holiday rule kind: {kind}")


def holidays_for(country_code: str, year: int):
    """Return a list of holiday dicts for one country and year."""
    code = country_code.upper()
    rules = _RULES.get(code, [])
    out = []
    for name, *spec in rules:
        d = _resolve((name, *spec), year)
        out.append({
            "id": f"{code}-{d.isoformat()}-{name.replace(' ', '_')}",
            "name": name,
            "date": d.isoformat(),
            "country_code": code,
            "country_name": _COUNTRY_NAMES.get(code, code),
            "type": "public",
            "is_national": True,
        })
    out.sort(key=lambda h: h["date"])
    return out
