import pandas as pd
import csv

INPUT_FILE = "data/PC11_TV_DIR.xlsx"
OUTPUT_FILE = "data/india-villages.csv"

df = pd.read_excel(
    INPUT_FILE,
    sheet_name="Sheet1",
    dtype=str
)

df.columns = [str(c).strip() for c in df.columns]

print("Columns found:")
for column in df.columns:
    print(repr(column))

df = df.rename(columns={
    "State Code": "state_code",
    "District Code": "district_code",
    "Sub District Code": "subdistrict_code",
    "Town-Village Code": "village_code",
    "Town-Village Name": "name"
})

for column in df.columns:
    df[column] = df[column].fillna("").astype(str).str.strip()

current_state_code = ""
current_state_name = ""

current_district_code = ""
current_district_name = ""

current_subdistrict_code = ""
current_subdistrict_name = ""

output_rows = []

for _, row in df.iterrows():

    state_code = row["state_code"].zfill(2)
    district_code = row["district_code"].zfill(3)
    subdistrict_code = row["subdistrict_code"].zfill(5)
    village_code = row["village_code"].zfill(6)
    name = row["name"]

    # State row
    if (
        district_code == "000"
        and subdistrict_code == "00000"
        and village_code == "000000"
        and name
    ):
        current_state_code = state_code
        current_state_name = name
        continue

    # District row
    if (
        subdistrict_code == "00000"
        and village_code == "000000"
        and district_code != "000"
        and name
    ):
        current_district_code = district_code
        current_district_name = name
        continue

    # Sub-district row
    if (
        village_code == "000000"
        and subdistrict_code != "00000"
        and name
    ):
        current_subdistrict_code = subdistrict_code
        current_subdistrict_name = name
        continue

    # Ignore hierarchy rows without village code
    if village_code == "000000":
        continue

    # Ignore town/city entries
    if village_code.startswith("8"):
        continue

    # Valid village
    if (
        current_state_code
        and current_district_code
        and current_subdistrict_code
        and name
    ):
        output_rows.append([
            current_state_code,
            current_state_name,
            current_district_code,
            current_district_name,
            current_subdistrict_code,
            current_subdistrict_name,
            village_code,
            name,
            ""
        ])

with open(
    OUTPUT_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "state_code",
        "state_name",
        "district_code",
        "district_name",
        "subdistrict_code",
        "subdistrict_name",
        "village_code",
        "village_name",
        "pincode"
    ])

    writer.writerows(output_rows)

print()
print(f"Created: {OUTPUT_FILE}")
print(f"Village rows: {len(output_rows):,}")
