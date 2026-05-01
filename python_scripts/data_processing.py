import os
from datetime import datetime
import pandas as pd
from supabase import create_client, Client

# Setup Supabase client
# Ensure SUPABASE_URL and SUPABASE_KEY are set in your environment
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    print("Please set them to run this script. Example:")
    print("export SUPABASE_URL='https://your-project.supabase.co'")
    print("export SUPABASE_KEY='your-service-role-key'")
    exit(1)

supabase: Client = create_client(url, key)

def fetch_data(table_name):
    """Fetch all rows from a given Supabase table."""
    print(f"Fetching {table_name}...")
    response = supabase.table(table_name).select("*").execute()
    return pd.DataFrame(response.data or [])


def normalize_text(value):
    """Normalize whitespace and lowercase string values."""
    if pd.isna(value):
        return None
    return " ".join(str(value).strip().split()).lower()


def clean_events(df_events, df_categories):
    """Clean and standardize event data."""
    if df_events.empty:
        return df_events

    cleaned = df_events.copy()
    cleaned = cleaned.drop_duplicates(subset=["event_id"], keep="last")
    cleaned["event_name"] = cleaned["event_name"].astype(str).str.strip()
    cleaned["organizer_name"] = cleaned["organizer_name"].astype(str).str.strip()
    cleaned["event_date"] = pd.to_datetime(cleaned["event_date"], errors="coerce")
    cleaned = cleaned.dropna(subset=["event_id", "event_name", "event_date"])

    category_map = {}
    if not df_categories.empty:
        for _, row in df_categories.iterrows():
            if pd.notna(row.get("category_id")) and pd.notna(row.get("category_name")):
                category_map[int(row["category_id"])] = " ".join(str(row["category_name"]).split()).title()
    cleaned["standard_category"] = cleaned["category_id"].map(category_map).fillna("Other")
    cleaned["department_id"] = cleaned["department_id"].fillna(-1).astype(int)
    cleaned["is_competition"] = cleaned["is_competition"].fillna(False).astype(bool)
    return cleaned


def clean_participants(df_participants, df_departments):
    """Clean and standardize participant data."""
    if df_participants.empty:
        return df_participants

    cleaned = df_participants.copy()
    cleaned = cleaned.drop_duplicates(subset=["participant_id"], keep="last")
    cleaned["participant_name"] = cleaned["participant_name"].astype(str).str.strip()
    cleaned["participant_type"] = (
        cleaned["participant_type"]
        .apply(normalize_text)
        .replace({"internal participant": "internal", "external participant": "external"})
        .fillna("internal")
    )
    cleaned["participant_type"] = cleaned["participant_type"].where(
        cleaned["participant_type"].isin(["internal", "external"]),
        "internal",
    )
    cleaned["department_id"] = cleaned["department_id"].fillna(-1).astype(int)
    cleaned["year_of_study"] = pd.to_numeric(cleaned["year_of_study"], errors="coerce").fillna(0).astype(int)

    if not df_departments.empty and "department_name" in df_departments.columns:
        dept_map = (
            df_departments.dropna(subset=["department_id"])
            .set_index("department_id")["department_name"]
            .to_dict()
        )
        cleaned["standard_department"] = cleaned["department_id"].map(dept_map).fillna("External / Unassigned")
    else:
        cleaned["standard_department"] = "External / Unassigned"

    return cleaned


def build_derived_metrics(df_events, df_participants, df_event_participants, df_event_results):
    """Build all required derived metrics."""
    events_per_dept = (
        df_events[df_events["department_id"] != -1]
        .groupby(["department_id"], as_index=False)
        .agg(event_count=("event_id", "nunique"))
    )
    dept_names = (
        df_participants[["department_id", "standard_department"]]
        .drop_duplicates()
        .rename(columns={"standard_department": "department_name"})
    )
    department_metrics = events_per_dept.merge(dept_names, on="department_id", how="left")
    department_metrics["department_name"] = department_metrics["department_name"].fillna("Unknown Department")

    registrations = (
        df_event_participants.groupby("event_id", as_index=False)
        .agg(total_registrations=("participant_id", "nunique"))
    )
    event_participant_types = df_event_participants.merge(
        df_participants[["participant_id", "participant_type"]],
        on="participant_id",
        how="left",
    )
    type_split = (
        event_participant_types.groupby(["event_id", "participant_type"], as_index=False)
        .agg(count=("participant_id", "nunique"))
        .pivot(index="event_id", columns="participant_type", values="count")
        .fillna(0)
        .reset_index()
    )
    if "internal" not in type_split.columns:
        type_split["internal"] = 0
    if "external" not in type_split.columns:
        type_split["external"] = 0

    participation_metrics = (
        df_events[["event_id", "event_name", "event_date"]]
        .merge(registrations, on="event_id", how="left")
        .merge(type_split[["event_id", "internal", "external"]], on="event_id", how="left")
        .fillna({"total_registrations": 0, "internal": 0, "external": 0})
    )
    participation_metrics["total_registrations"] = participation_metrics["total_registrations"].astype(int)
    participation_metrics["internal"] = participation_metrics["internal"].astype(int)
    participation_metrics["external"] = participation_metrics["external"].astype(int)
    participation_metrics["external_participation_pct"] = participation_metrics.apply(
        lambda row: round((row["external"] * 100.0) / row["total_registrations"], 2)
        if row["total_registrations"] > 0
        else 0.0,
        axis=1,
    )

    valid_positions = {"1st", "2nd", "3rd"}
    filtered_results = (
        df_event_results[df_event_results["position"].isin(valid_positions)].copy()
        if not df_event_results.empty
        else pd.DataFrame(columns=["participant_id", "prize_amount", "position"])
    )
    top_performers = (
        filtered_results.merge(
            df_participants[["participant_id", "participant_name", "roll_number"]],
            on="participant_id",
            how="left",
        )
        .groupby(["participant_id", "participant_name", "roll_number"], as_index=False)
        .agg(total_awards=("position", "count"), total_prize_money=("prize_amount", "sum"))
        .sort_values(["total_awards", "total_prize_money"], ascending=[False, False])
    )

    monthly_frequency = (
        df_events.assign(month=df_events["event_date"].dt.strftime("%Y-%m"))
        .groupby("month", as_index=False)
        .agg(events_in_month=("event_id", "count"), competitions_in_month=("is_competition", "sum"))
        .sort_values("month")
    )

    return {
        "department_metrics": department_metrics.sort_values("event_count", ascending=False),
        "participation_metrics": participation_metrics.sort_values("total_registrations", ascending=False),
        "top_performers": top_performers.head(20),
        "monthly_frequency": monthly_frequency,
    }

def process_data():
    """Main repeatable and idempotent data processing pipeline."""
    print("Starting data processing pipeline...")

    # 1. Fetch raw data
    df_events = fetch_data("events")
    df_participants = fetch_data("participants")
    df_depts = fetch_data("departments")
    df_categories = fetch_data("categories")
    df_event_participants = fetch_data("event_participants")
    df_event_results = fetch_data("event_results")

    if df_events.empty:
        print("Not enough data to process. Exiting.")
        return

    # 2. Clean incoming data
    cleaned_events = clean_events(df_events, df_categories)
    cleaned_participants = clean_participants(df_participants, df_depts)
    cleaned_event_participants = (
        df_event_participants.drop_duplicates(subset=["event_id", "participant_id"], keep="last")
        if not df_event_participants.empty
        else df_event_participants
    )
    cleaned_event_results = (
        df_event_results.drop_duplicates(subset=["result_id"], keep="last")
        if not df_event_results.empty
        else df_event_results
    )

    # 3. Compute derived metrics
    metrics = build_derived_metrics(
        cleaned_events,
        cleaned_participants,
        cleaned_event_participants,
        cleaned_event_results,
    )

    # 4. Save/export derived metrics
    print("\n--- Derived Metrics Computed ---")
    print("Top Departments by Events:\n" + f"{metrics['department_metrics'].head(3)}")
    print(
        "\nTop Events by Participation:\n"
        + f"{metrics['participation_metrics'][['event_name', 'total_registrations']].head(3)}"
    )

    output_dir = "processed_output"
    os.makedirs(output_dir, exist_ok=True)

    run_timestamp = datetime.utcnow().isoformat() + "Z"
    metadata = {
        "processed_at_utc": run_timestamp,
        "source_tables": [
            "events",
            "participants",
            "departments",
            "categories",
            "event_participants",
            "event_results",
        ],
        "idempotent_strategy": "overwrite_json_outputs_and_upsert_derived_tables",
    }

    metrics["department_metrics"].to_json(f"{output_dir}/department_metrics.json", orient="records", indent=4)
    metrics["participation_metrics"].to_json(f"{output_dir}/participation_metrics.json", orient="records", indent=4)
    metrics["top_performers"].to_json(f"{output_dir}/top_performers.json", orient="records", indent=4)
    metrics["monthly_frequency"].to_json(f"{output_dir}/monthly_frequency.json", orient="records", indent=4)
    pd.DataFrame([metadata]).to_json(f"{output_dir}/run_metadata.json", orient="records", indent=4)

    print(f"\nPipeline complete! Derived metrics saved to ./{output_dir}/")

if __name__ == "__main__":
    process_data()
